import { useState } from "react";
import { PageHead, Panel, Modal, Confirm } from "../components/UI";
import { useStore } from "../components/context";
import { uid } from "../types";
import { gpaCourses, policyInfo } from "../data/gpa-courses";
import {
  gradePoints,
  type GpaCategory,
  type LetterGrade,
} from "../data/gpa-policy";
import {
  calculateGpa,
  rowGrade,
  parseGpaLine,
  type GpaRow,
} from "../utils/gpa";
import { download } from "../utils/logic";
const periods = {
  S1Midterm: "第一学期期中（估算）",
  S1Final: "第一学期最终",
  S2Final: "第二学期最终",
};
const number = (value: string) => (value.trim() === "" ? null : Number(value));
export default function Gpa() {
  const { data, update, toast } = useStore();
  const saved = data.gpa ?? [];
  const [quick, setQuick] = useState(false);
  const [draft, setDraft] = useState<GpaRow[]>([]);
  const [year, setYear] = useState("2026–2027");
  const [grade, setGrade] = useState<GpaRow["grade"]>("Y11");
  const [period, setPeriod] = useState<GpaRow["period"]>("S1Final");
  const [track, setTrack] = useState<"AP" | "A-Level">("AP");
  const [edit, setEdit] = useState<GpaRow | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<GpaRow[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [simulation, setSimulation] = useState(false);
  const [sim, setSim] = useState<Record<string, number>>({});
  const [recalculate, setRecalculate] = useState(false);
  const all = quick ? draft : saved;
  const rows = all.filter(
    (r) => r.year === year && r.grade === grade && r.period === period,
  );
  const semester = calculateGpa(rows, true);
  const annual = calculateGpa(all.filter((r) => r.year === year));
  const cumulative = calculateGpa(all);
  const simulated = calculateGpa(
    rows.map((r) =>
      sim[r.id] === undefined
        ? r
        : { ...r, score: sim[r.id], letter: recalculate ? null : r.letter },
    ),
    true,
  );
  const create = (name = ""): GpaRow => ({
    id: uid(),
    name,
    year,
    grade,
    period,
    category: "H",
    score: null,
    letter: null,
    credits: 0,
    included: true,
    passFail: false,
  });
  const apply = (fn: (r: GpaRow[]) => GpaRow[]) =>
    quick
      ? (setDraft(fn), Promise.resolve(true))
      : update((d) => ({ ...d, gpa: fn(d.gpa ?? []) }));
  const catalog = gpaCourses.filter(
    (c) => c.grade === grade && c.track === track,
  );
  const useCourse = (row: GpaRow, id: string) => {
    const c = gpaCourses.find((c) => c.id === id);
    return c
      ? {
          ...row,
          name: c.name,
          category: c.category,
          credits: c.credits[period === "S2Final" ? 1 : 0],
          passFail: c.passFail,
          included: c.included,
        }
      : row;
  };
  const valid = (r: GpaRow) =>
    r.name.trim() &&
    Number.isFinite(r.credits) &&
    r.credits >= 0 &&
    r.credits <= 20 &&
    (r.score === null ||
      (Number.isFinite(r.score) && r.score >= 0 && r.score <= 100));
  const parse = () => {
    setConfirmed(false);
    const errors: string[] = [];
    const parsed: GpaRow[] = [];
    const seen = new Set(rows.map((r) => r.name.toLowerCase()));
    raw.split(/\r?\n/).forEach((line, i) => {
      if (!line.trim()) return;
      try {
        const p = parseGpaLine(line.replace(/\t+/g, " "));
        if (seen.has(p.name.toLowerCase())) {
          errors.push(`第${i + 1}行：课程重复，未导入`);
          return;
        }
        seen.add(p.name.toLowerCase());
        let r: GpaRow = {
          ...create(p.name),
          score: p.score,
          letter: p.letter ?? null,
        };
        const match = catalog.filter(
          (c) => c.name.toLowerCase() === p.name.toLowerCase(),
        );
        if (match.length === 1) r = useCourse(r, match[0].id);
        parsed.push(r);
      } catch (e) {
        errors.push(
          `第${i + 1}行：${e instanceof Error ? e.message : "无法识别"}`,
        );
      }
    });
    setPreview(parsed);
    setIssues(errors);
  };
  const gradeSelect = (r: GpaRow, onChange: (r: GpaRow) => void) => (
    <select
      aria-label="学校等级"
      value={r.letter ?? ""}
      onChange={(e) =>
        onChange({
          ...r,
          letter: (e.target.value || null) as LetterGrade | null,
        })
      }
    >
      <option value="">按分数换算</option>
      {Object.keys(gradePoints).map((g) => (
        <option key={g}>{g}</option>
      ))}
    </select>
  );
  return (
    <div className="gpa-page">
      <PageHead
        title="AIP GPA 计算器"
        description="选择课程，录入学校给出的综合成绩。"
      />
      <div className="tabs">
        <button
          className={quick ? "active" : ""}
          onClick={() => setQuick(true)}
        >
          快速估算
        </button>
        <button
          className={!quick ? "active" : ""}
          onClick={() => setQuick(false)}
        >
          学期成绩管理
        </button>
      </div>
      <div className="form-grid panel">
        <label>
          学年
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2026–2027"
            pattern="[0-9]{4}[–-][0-9]{4}"
          />
        </label>
        <label>
          年级
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as GpaRow["grade"])}
          >
            {["Y10", "Y11", "Y12"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>
          课程路径
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value as typeof track)}
          >
            <option>AP</option>
            <option>A-Level</option>
          </select>
        </label>
        <label>
          成绩阶段
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as GpaRow["period"])}
          >
            {Object.entries(periods).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="summary-grid">
        {[
          [period === "S1Midterm" ? "期中估算" : "本学期 GPA", semester],
          ["学年 GPA", annual],
          ["累计 GPA", cumulative],
        ].map(([label, value]) => {
          const v = value as typeof semester;
          return (
            <section className="panel" key={String(label)}>
              <small>{String(label)}</small>
              <h2>
                {v.gpa === null ? "—" : v.gpa.toFixed(2)} <small>/ 4.3</small>
              </h2>
              <small>{v.credits} 学分</small>
            </section>
          );
        })}
      </div>
      {quick && (
        <p className="muted">快速估算暂不保存。确认后可保存到学期成绩。</p>
      )}
      <div className="inline">
        <button
          className="primary"
          onClick={() => {
            setError("");
            setEdit(create());
          }}
        >
          添加课程
        </button>
        <button onClick={() => setBulk(true)}>批量粘贴</button>
        <button
          disabled={!rows.length}
          onClick={() => {
            setSim({});
            setRecalculate(false);
            setSimulation(true);
          }}
        >
          成绩模拟
        </button>
        {quick && (
          <button
            disabled={!draft.length}
            onClick={async () => {
              if (
                await update((d) => {
                  const existing = d.gpa ?? [];
                  const keys = new Set(
                    existing.map(
                      (r) =>
                        `${r.year}|${r.grade}|${r.period}|${r.name.toLowerCase()}`,
                    ),
                  );
                  return {
                    ...d,
                    gpa: [
                      ...existing,
                      ...draft.filter(
                        (r) =>
                          !keys.has(
                            `${r.year}|${r.grade}|${r.period}|${r.name.toLowerCase()}`,
                          ),
                      ),
                    ],
                  };
                })
              ) {
                setDraft([]);
                setQuick(false);
                toast("已保存；同学期同名课程未重复添加");
              }
            }}
          >
            保存估算成绩
          </button>
        )}
        <button
          disabled={!all.length}
          onClick={() =>
            void download(
              "SuduBox-GPA.json",
              JSON.stringify(
                { app: "SuduBox-GPA", version: 1, rows: all },
                null,
                2,
              ),
            )
          }
        >
          导出成绩 JSON
        </button>
      </div>
      {!rows.length ? (
        <section className="empty">
          <h3>添加你的第一门课程，看看 GPA 是多少。</h3>
        </section>
      ) : (
        <div className="panel gpa-table">
          <table>
            <thead>
              <tr>
                {[
                  "课程",
                  "成绩 / 学校等级",
                  "类别",
                  "学分",
                  "绩点",
                  "操作",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const g = rowGrade(r);
                return (
                  <tr key={r.id}>
                    <td>
                      {r.name}
                      {r.passFail && <small> Pass/Fail</small>}
                    </td>
                    <td>
                      {r.score ?? "—"} / {r.letter ?? g.calculated ?? "—"}
                      {g.different && (
                        <small className="warning">
                          学校 {r.letter}；换算 {g.calculated}，采用学校等级
                        </small>
                      )}
                    </td>
                    <td>{r.category}</td>
                    <td>{r.credits}</td>
                    <td>
                      {!r.included || r.passFail || r.credits === 0
                        ? "不计入"
                        : (g.points ?? "未录入")}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setError("");
                          setEdit({ ...r });
                        }}
                      >
                        编辑
                      </button>
                      <button onClick={() => setRemove(r.id)}>删除</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <details className="panel">
        <summary>计算过程与政策</summary>
        <p>
          Σ（绩点 × 学分）÷ Σ有效学分 = {semester.total.toFixed(4)} ÷{" "}
          {semester.credits} ={" "}
          {semester.gpa === null ? "暂无成绩" : semester.gpa.toFixed(2)}
        </p>
        <p>
          期中只用于阶段估算，不进入学年或累计。Final
          已是综合成绩，不与期中再次平均。空成绩、零学分及 Pass/Fail 不计入；CH
          学术课程计入。
        </p>
        <p>
          {policyInfo.applies}；{policyInfo.source}。{policyInfo.revision}。
          {policyInfo.note}
        </p>
        <table>
          <thead>
            <tr>
              <th>等级</th>
              <th>绩点</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(gradePoints).map(([g, p]) => (
              <tr key={g}>
                <td>{g}</td>
                <td>{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="footnote">
        GPA 根据已提供的 AIP
        评分政策计算，仅供参考。实际成绩以学校官方成绩单为准。
      </p>
      {edit && (
        <Modal title="课程成绩" close={() => setEdit(null)}>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!/^\d{4}[–-]\d{4}$/.test(year) || !valid(edit)) {
                setError("请检查学年、课程名、0–100成绩和0–20学分。");
                return;
              }
              if (
                all.some(
                  (r) =>
                    r.id !== edit.id &&
                    r.year === edit.year &&
                    r.grade === edit.grade &&
                    r.period === edit.period &&
                    r.name.trim().toLowerCase() ===
                      edit.name.trim().toLowerCase(),
                )
              ) {
                setError("该学期已有同名课程，请编辑已有记录。");
                return;
              }
              if (
                await apply((list) => [
                  ...list.filter((r) => r.id !== edit.id),
                  { ...edit, name: edit.name.trim() },
                ])
              )
                setEdit(null);
            }}
          >
            <label>
              从课程目录选择
              <select
                defaultValue=""
                onChange={(e) => setEdit(useCourse(edit, e.target.value))}
              >
                <option value="">手动填写（请确认学分）</option>
                {catalog.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name} · {c.category} ·{" "}
                    {c.credits[period === "S2Final" ? 1 : 0]}学分
                    {c.condition ? ` · ${c.condition}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              课程名称
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                百分制综合成绩
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={edit.score ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, score: number(e.target.value) })
                  }
                />
              </label>
              <label>学校字母等级{gradeSelect(edit, setEdit)}</label>
              <label>
                类别
                <select
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      category: e.target.value as GpaCategory,
                    })
                  }
                >
                  {["P", "H", "CH"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                本学期学分
                <input
                  required
                  type="number"
                  min="0"
                  max="20"
                  step="any"
                  value={edit.credits}
                  onChange={(e) =>
                    setEdit({ ...edit, credits: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={edit.passFail}
                onChange={(e) =>
                  setEdit({ ...edit, passFail: e.target.checked })
                }
              />
              Pass/Fail，不计入 GPA
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={edit.included}
                onChange={(e) =>
                  setEdit({ ...edit, included: e.target.checked })
                }
              />
              计入 GPA
            </label>
            {edit.score !== null &&
              Number.isFinite(edit.score) &&
              edit.score >= 0 &&
              edit.score <= 100 && (
                <p>
                  自动换算：{rowGrade(edit).calculated}；采用：
                  {rowGrade(edit).letter}
                  {rowGrade(edit).different
                    ? "（与学校等级不同，保留学校等级）"
                    : ""}
                </p>
              )}
            {error && (
              <p role="alert" className="warning">
                {error}
              </p>
            )}
            <button className="primary">保存成绩</button>
          </form>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="删除成绩"
          description="只删除这门课的成绩，不影响课表。"
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (await apply((list) => list.filter((r) => r.id !== remove)))
              setRemove(null);
          }}
        />
      )}
      {bulk && (
        <Modal title="批量导入成绩" close={() => setBulk(false)}>
          <textarea
            aria-label="批量成绩文本"
            rows={6}
            placeholder="课程名称 98/A+（每行一门）"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button onClick={parse}>解析并预览</button>
          {issues.map((x) => (
            <p key={x} role="alert">
              {x}
            </p>
          ))}
          {preview.map((r, i) => (
            <div className="panel" key={r.id}>
              <input
                aria-label="预览课程名称"
                value={r.name}
                onChange={(e) =>
                  setPreview((p) =>
                    p.map((x, j) =>
                      i === j ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <div className="form-grid">
                <label>
                  类别
                  <select
                    value={r.category}
                    onChange={(e) =>
                      setPreview((p) =>
                        p.map((x, j) =>
                          i === j
                            ? { ...x, category: e.target.value as GpaCategory }
                            : x,
                        ),
                      )
                    }
                  >
                    {["P", "H", "CH"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  确认学分
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="any"
                    value={r.credits}
                    onChange={(e) =>
                      setPreview((p) =>
                        p.map((x, j) =>
                          i === j
                            ? { ...x, credits: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  分数
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={r.score ?? ""}
                    onChange={(e) =>
                      setPreview((p) =>
                        p.map((x, j) =>
                          i === j ? { ...x, score: number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  学校等级
                  {gradeSelect(r, (changed) =>
                    setPreview((p) => p.map((x, j) => (i === j ? changed : x))),
                  )}
                </label>
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={r.passFail}
                  onChange={(e) =>
                    setPreview((p) =>
                      p.map((x, j) =>
                        i === j
                          ? {
                              ...x,
                              passFail: e.target.checked,
                              included: !e.target.checked,
                            }
                          : x,
                      ),
                    )
                  }
                />
                Pass/Fail（不计入 GPA）
              </label>
              <small>
                {r.credits === 0
                  ? "未匹配或本学期0学分，请核实后导入。"
                  : "请核对课程、学分和学校等级。"}
              </small>
            </div>
          ))}
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            已核对以上课程类别、学分和评分方式；未匹配项已手动确认
          </label>
          <button
            className="primary"
            disabled={
              !confirmed || !preview.length || preview.some((r) => !valid(r))
            }
            onClick={async () => {
              if (!/^\d{4}[–-]\d{4}$/.test(year)) {
                toast("请先输入有效学年");
                return;
              }
              if (
                await apply((list) => {
                  const keys = new Set(
                    list.map(
                      (r) =>
                        `${r.year}|${r.grade}|${r.period}|${r.name.toLowerCase()}`,
                    ),
                  );
                  return [
                    ...list,
                    ...preview.filter((r) => {
                      const key = `${r.year}|${r.grade}|${r.period}|${r.name.toLowerCase()}`;
                      if (keys.has(key)) return false;
                      keys.add(key);
                      return true;
                    }),
                  ];
                })
              ) {
                setBulk(false);
                setPreview([]);
                toast("已导入确认的成绩");
              }
            }}
          >
            确认导入 {preview.length} 门课程
          </button>
        </Modal>
      )}
      {simulation && (
        <Modal
          title="成绩模拟（不会修改已保存成绩）"
          close={() => setSimulation(false)}
        >
          <p>
            当前 {semester.gpa?.toFixed(2) ?? "—"} → 模拟{" "}
            {simulated.gpa?.toFixed(2) ?? "—"}；变化{" "}
            {semester.gpa !== null && simulated.gpa !== null
              ? (simulated.gpa - semester.gpa).toFixed(2)
              : "—"}
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={recalculate}
              onChange={(e) => setRecalculate(e.target.checked)}
            />
            按模拟分数重新换算学校手动等级（否则保留学校等级）
          </label>
          {rows
            .filter((r) => !r.passFail)
            .map((r) => (
              <label key={r.id}>
                {r.name}
                {r.letter && <small> 学校等级 {r.letter}</small>}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={sim[r.id] ?? r.score ?? ""}
                  onChange={(e) => {
                    const n = number(e.target.value);
                    setSim((s) => {
                      const next = { ...s };
                      if (n === null) delete next[r.id];
                      else if (Number.isFinite(n) && n >= 0 && n <= 100)
                        next[r.id] = n;
                      return next;
                    });
                  }}
                />
              </label>
            ))}
        </Modal>
      )}
    </div>
  );
}
