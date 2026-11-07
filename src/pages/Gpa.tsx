import { useEffect, useRef, useState } from "react";
import {
  Plus,
  ClipboardPaste,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { PageHead, Modal, Confirm } from "../components/UI";
import { useStore } from "../components/context";
import { AddCourse, BulkEntry } from "../components/gpa/EntryForms";
import { GradeField } from "../components/gpa/Inputs";
import { CourseDetails } from "../components/gpa/CourseDetails";
import { policyInfo } from "../data/gpa-courses";
import { gradePoints } from "../data/gpa-policy";
import { calculateGpa, rowGrade, type GpaRow } from "../utils/gpa";
import {
  appendUnique,
  counted,
  formatGpa,
  initialGpaSettings,
  periods,
  rowKey,
  type GpaSettings,
} from "../utils/gpa-entry";
import { download } from "../utils/logic";

export default function Gpa() {
  const { data, update, toast } = useStore();
  const [settings, setSettings] = useState(() =>
    initialGpaSettings(data.preferences),
  );
  const [add, setAdd] = useState(false),
    [bulk, setBulk] = useState(false),
    [remove, setRemove] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null),
    [menu, setMenu] = useState(false),
    [showCalculation, setShowCalculation] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false),
    [replace, setReplace] = useState(false),
    [saving, setSaving] = useState(false);
  const saveLock = useRef(false),
    menuRef = useRef<HTMLDivElement>(null);
  const [simulation, setSimulation] = useState(false),
    [sim, setSim] = useState<Record<string, number>>({}),
    [recalculate, setRecalculate] = useState(false);
  const quick = settings.mode === "draft";
  const all = quick ? (data.gpaDraft ?? []) : (data.gpa ?? []);
  const rows = all.filter(
    (r) =>
      r.year.replace("–", "-") === settings.year.replace("–", "-") &&
      r.grade === settings.grade &&
      r.period === settings.period,
  );
  const result = calculateGpa(rows, true);
  const official = data.gpa ?? [];
  const annual = calculateGpa(
    official.filter(
      (r) => r.year.replace("–", "-") === settings.year.replace("–", "-"),
    ),
  );
  const cumulative = calculateGpa(official);
  const simulated = calculateGpa(
    rows.map((r) =>
      sim[r.id] === undefined
        ? r
        : { ...r, score: sim[r.id], letter: recalculate ? null : r.letter },
    ),
    true,
  );
  useEffect(() => {
    if (!data.preferences.gpaSettings)
      void update((d) => ({
        ...d,
        preferences: { ...d.preferences, gpaSettings: settings },
      }));
  }, []);
  useEffect(() => {
    const click = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const changeSettings = (patch: Partial<GpaSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setDetails(null);
    void update((d) => ({
      ...d,
      preferences: { ...d.preferences, gpaSettings: next },
    }));
  };
  const apply = (fn: (list: GpaRow[]) => GpaRow[]) =>
    update((d) =>
      quick
        ? { ...d, gpaDraft: fn(d.gpaDraft ?? []) }
        : { ...d, gpa: fn(d.gpa ?? []) },
    );
  const saveRow = (row: GpaRow) =>
    apply((list) => list.map((r) => (r.id === row.id ? row : r)));
  const addRows = async (incoming: GpaRow[]) => {
    let added = 0;
    const ok = await apply((list) => {
      const next = appendUnique(list, incoming);
      added = next.length - list.length;
      return next;
    });
    if (!ok) return false;
    if (!added) {
      toast("这些课程已经存在，可以直接修改列表中的成绩。");
      return false;
    }
    setAdd(false);
    setBulk(false);
    toast(
      `已添加 ${added} 门课程${added < incoming.length ? "，重复课程已跳过" : ""}`,
    );
    return true;
  };
  const historyScopes = Array.from(
    new Map(
      official.map((r) => [`${r.year}|${r.grade}|${r.period}`, r]),
    ).values(),
  ).sort(
    (a, b) =>
      b.year.localeCompare(a.year) ||
      a.grade.localeCompare(b.grade) ||
      a.period.localeCompare(b.period),
  );
  const duplicates = rows.filter((r) =>
    official.some((s) => rowKey(s) === rowKey(r)),
  ).length;
  return (
    <div className="gpa-page gpa-simple">
      <PageHead title="AIP GPA 计算器" description="输入成绩，看看你的 GPA。" />
      <section className="gpa-result" aria-label="当前 GPA">
        <div>
          <span>{quick ? "我的 GPA" : "已保存的 GPA"}</span>
          <div className="gpa-number" aria-live="polite">
            {formatGpa(result.gpa)}
            <small> / 4.30</small>
          </div>
          <p>
            已计算 {rows.filter(counted).length} 门课程 · 共{" "}
            {result.credits.toFixed(2)} 学分
          </p>
        </div>
        <small className="gpa-save-state">自动保存到本机</small>
      </section>
      {!quick && (
        <button onClick={() => changeSettings({ mode: "draft" })}>
          返回当前计算
        </button>
      )}
      <details className="gpa-disclosure">
        <summary>计算设置</summary>
        <fieldset className="choice-fieldset">
          <legend>年级</legend>
          <div className="choice-buttons">
            {(
              [
                ["Y10", "高一"],
                ["Y11", "高二"],
                ["Y12", "高三"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={settings.grade === value}
                onClick={() => changeSettings({ grade: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="choice-fieldset">
          <legend>课程体系</legend>
          <div className="choice-buttons">
            {(["AP", "A-Level"] as const).map((track) => (
              <button
                key={track}
                aria-pressed={settings.track === track}
                onClick={() => changeSettings({ track })}
              >
                {track}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="gpa-hint">
          用于推荐课程。类别和学分会自动填入，也可以点课程名调整。
        </p>
      </details>
      <div className="gpa-actions">
        <button className="primary" onClick={() => setAdd(true)}>
          <Plus size={17} />
          添加课程
        </button>
        <button onClick={() => setBulk(true)}>
          <ClipboardPaste size={17} />
          粘贴多门成绩
        </button>
        <div className="gpa-menu-wrap" ref={menuRef}>
          <button
            aria-expanded={menu}
            aria-controls="gpa-more-actions"
            aria-label="更多操作"
            onClick={() => setMenu((v) => !v)}
          >
            <MoreHorizontal size={18} />
            <span>更多操作</span>
          </button>
          {menu && (
            <div className="gpa-menu" id="gpa-more-actions">
              <button
                disabled={!rows.length}
                onClick={() => {
                  setSim({});
                  setRecalculate(false);
                  setSimulation(true);
                  setMenu(false);
                }}
              >
                成绩模拟
              </button>
              {quick && (
                <button
                  disabled={!rows.length}
                  onClick={() => {
                    setReplace(false);
                    setConfirmSave(true);
                    setMenu(false);
                  }}
                >
                  保存本次成绩
                </button>
              )}
              <button
                disabled={!all.length}
                onClick={() => {
                  setMenu(false);
                  void download(
                    "SuduBox-GPA.json",
                    JSON.stringify(
                      { app: "SuduBox-GPA", version: 1, rows: all },
                      null,
                      2,
                    ),
                  );
                }}
              >
                导出成绩
              </button>
              <button
                onClick={() => {
                  setShowCalculation(true);
                  setMenu(false);
                }}
              >
                查看计算明细
              </button>
              <a href="#/backup">数据导入与恢复</a>
            </div>
          )}
        </div>
      </div>
      {rows.length ? (
        <section className="gpa-list" aria-label="成绩列表">
          <div className="gpa-list-head" aria-hidden="true">
            <span>课程</span>
            <span>成绩</span>
            <span>绩点</span>
            <span>操作</span>
          </div>
          {rows.map((row) => {
            const grade = rowGrade(row);
            const expanded = details === row.id;
            return (
              <article className="gpa-course" key={row.id}>
                <div className="gpa-course-row">
                  <button
                    className="gpa-course-name"
                    aria-expanded={expanded}
                    aria-controls={`course-${row.id}`}
                    onClick={() => setDetails(expanded ? null : row.id)}
                  >
                    {row.name}
                    <ChevronDown size={15} />
                  </button>
                  <div>
                    <GradeField
                      row={row}
                      label={`${row.name} 成绩`}
                      onChange={(values) => {
                        void apply((list) =>
                          list.map((r) =>
                            r.id === row.id ? { ...r, ...values } : r,
                          ),
                        );
                      }}
                    />
                    <small className="gpa-grade-hint">
                      {grade.letter ?? "未录入"}
                      {grade.different
                        ? " · 等级有差异"
                        : row.passFail
                          ? " · Pass/Fail"
                          : ""}
                    </small>
                  </div>
                  <strong className="gpa-points">
                    <span className="mobile-label">绩点 </span>
                    {counted(row) ? grade.points?.toFixed(1) : "—"}
                  </strong>
                  <button
                    className="gpa-delete"
                    aria-label={`删除 ${row.name}`}
                    onClick={() => setRemove(row.id)}
                  >
                    删除
                  </button>
                </div>
                {expanded && (
                  <div id={`course-${row.id}`}>
                    <CourseDetails
                      key={`${row.id}:${row.category}:${row.credits}:${row.letter}:${row.included}:${row.passFail}`}
                      row={row}
                      onSave={async (changed) => {
                        const ok = await saveRow(changed);
                        if (ok) toast("课程信息已保存");
                        return ok;
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <div className="gpa-empty">
          <h3>先加一门课吧。</h3>
          <p>选课程，填成绩，剩下的交给计算器。</p>
        </div>
      )}
      <details className="gpa-disclosure">
        <summary>更多统计</summary>
        <p className="gpa-hint">按已保存成绩汇总，未录入的成绩不计入。</p>
        {official.some((r) => r.period !== "S1Midterm") ? (
          <div className="gpa-stats">
            <p>
              学年 GPA（{settings.year}）{" "}
              <strong>{formatGpa(annual.gpa)}</strong> ·{" "}
              {annual.credits.toFixed(2)} 学分
            </p>
            <p>
              累计 GPA <strong>{formatGpa(cumulative.gpa)}</strong> ·{" "}
              {cumulative.credits.toFixed(2)} 学分
            </p>
          </div>
        ) : (
          <p>保存成绩后可查看统计。</p>
        )}
      </details>
      <details className="gpa-disclosure">
        <summary>
          成绩历史
          {historyScopes.length > 0 ? ` · ${historyScopes.length} 个学期` : ""}
        </summary>
        {!historyScopes.length ? (
          <p>还没有保存正式成绩。</p>
        ) : (
          <div className="gpa-history">
            {historyScopes.map((r) => (
              <button
                key={`${r.year}|${r.grade}|${r.period}`}
                onClick={() => {
                  changeSettings({
                    year: r.year,
                    grade: r.grade,
                    period: r.period,
                    mode: "saved",
                  });
                }}
              >
                {r.year} · {r.grade} · {periods[r.period]}
              </button>
            ))}
          </div>
        )}
        {!quick && (
          <button onClick={() => changeSettings({ mode: "draft" })}>
            返回当前计算
          </button>
        )}
      </details>
      <details
        className="gpa-disclosure"
        open={showCalculation}
        onToggle={(e) => setShowCalculation(e.currentTarget.open)}
      >
        <summary>计算明细与规则</summary>
        <p>
          Σ（绩点 × 学分）÷ Σ有效学分 = {result.total.toFixed(2)} ÷{" "}
          {result.credits.toFixed(2)} = {formatGpa(result.gpa)}
        </p>
        <p>
          学校等级优先。空成绩、零学分、Pass/Fail
          不计入；中方学术课程计入。期中只作阶段估算，不与最终成绩再次平均。
        </p>
        <p>
          {policyInfo.applies}；{policyInfo.source}。{policyInfo.revision}。
          {policyInfo.note}
        </p>
        <dl className="gpa-grade-scale">
          {Object.entries(gradePoints).map(([g, p]) => (
            <div key={g}>
              <dt>{g}</dt>
              <dd>{p.toFixed(1)}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="footnote">
        GPA 根据已提供的 AIP
        评分政策计算，仅供参考。实际成绩以学校官方成绩单为准。
      </p>
      {add && (
        <Modal title="添加课程" close={() => setAdd(false)}>
          <AddCourse settings={settings} onAdd={addRows} />
        </Modal>
      )}
      {bulk && (
        <Modal title="粘贴多门成绩" close={() => setBulk(false)}>
          <BulkEntry settings={settings} existing={rows} onAdd={addRows} />
        </Modal>
      )}
      {remove && (
        <Confirm
          title="删除成绩"
          description="只删除这条成绩，不影响课表或其他已保存记录。"
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (await apply((list) => list.filter((r) => r.id !== remove)))
              setRemove(null);
          }}
        />
      )}
      {confirmSave && (
        <Modal
          title="保存本次成绩"
          close={() => {
            if (!saving) setConfirmSave(false);
          }}
        >
          <p>
            将 {rows.length} 门课程保存为 {settings.year} · {settings.grade} ·{" "}
            {periods[settings.period]}。
          </p>
          {duplicates > 0 && (
            <label className="check">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              更新 {duplicates} 门同名正式成绩（不勾选则保留原记录）
            </label>
          )}
          <p>保存后仍可继续修改当前计算，不会自动改动已保存记录。</p>
          <button
            className="primary"
            disabled={saving}
            onClick={async () => {
              if (saveLock.current) return;
              saveLock.current = true;
              setSaving(true);
              try {
                const ok = await update((d) => {
                  let next = d.gpa ?? [];
                  if (replace) {
                    const replacements = new Map(
                      rows.map((r) => [rowKey(r), r]),
                    );
                    next = next.map((r) => {
                      const incoming = replacements.get(rowKey(r));
                      return incoming ? { ...incoming, id: r.id } : r;
                    });
                  }
                  return { ...d, gpa: appendUnique(next, rows) };
                });
                if (ok) {
                  setConfirmSave(false);
                  toast("已保存，当前计算仍可继续修改");
                }
              } finally {
                saveLock.current = false;
                setSaving(false);
              }
            }}
          >
            {saving ? "保存中…" : "确认保存"}
          </button>
        </Modal>
      )}
      {simulation && (
        <Modal title="成绩模拟" close={() => setSimulation(false)}>
          <p className="gpa-simulation-result">
            {formatGpa(result.gpa)} →{" "}
            <strong>{formatGpa(simulated.gpa)}</strong>
          </p>
          <p>仅预览，不改动已有成绩。</p>
          <label className="check">
            <input
              type="checkbox"
              checked={recalculate}
              onChange={(e) => setRecalculate(e.target.checked)}
            />
            按模拟分数重新换算学校等级（不勾选则保留原等级）
          </label>
          <div className="form">
            {rows
              .filter((r) => !r.passFail)
              .map((r) => (
                <label key={r.id}>
                  {r.name}
                  <input
                    aria-label={`${r.name} 模拟分数`}
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={sim[r.id] ?? r.score ?? ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setSim((s) => {
                        const next = { ...s };
                        if (e.target.value === "") delete next[r.id];
                        else if (Number.isFinite(n) && n >= 0 && n <= 100)
                          next[r.id] = n;
                        return next;
                      });
                    }}
                  />
                </label>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
