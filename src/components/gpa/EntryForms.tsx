import { useRef, useState } from "react";
import { CoursePicker } from "./Inputs";
import type { GpaCourse } from "../../data/gpa-courses";
import type { GpaCategory } from "../../data/gpa-policy";
import { rowGrade, type GpaRow } from "../../utils/gpa";
import {
  courseChoices,
  courseKey,
  fromCourse,
  gradeText,
  matchCourse,
  parseEntryLine,
  parseGradeInput,
  type GpaSettings,
} from "../../utils/gpa-entry";
import { uid } from "../../types";

interface Entry {
  row: GpaRow;
  categoryKnown: boolean;
  creditsKnown: boolean;
  manual: boolean;
}
function makeEntry(name: string, settings: GpaSettings): Entry {
  const course = matchCourse(name, settings);
  return course
    ? {
        row: fromCourse(course, settings, uid()),
        categoryKnown: true,
        creditsKnown: true,
        manual: false,
      }
    : {
        row: {
          id: uid(),
          name,
          year: settings.year,
          grade: settings.grade,
          period: settings.period,
          category: "H",
          credits: 0,
          included: true,
          passFail: false,
          score: null,
          letter: null,
        },
        categoryKnown: false,
        creditsKnown: false,
        manual: true,
      };
}
const ready = (e: Entry) =>
  e.categoryKnown &&
  e.creditsKnown &&
  Number.isFinite(e.row.credits) &&
  e.row.credits >= 0 &&
  e.row.credits <= 20;
function Metadata({
  entry,
  onChange,
}: {
  entry: Entry;
  onChange: (e: Entry) => void;
}) {
  return (
    <div className="gpa-missing">
      <div className="form-grid">
        <label>
          课程类别
          <select
            required
            value={entry.categoryKnown ? entry.row.category : ""}
            onChange={(e) =>
              onChange({
                ...entry,
                categoryKnown: !!e.target.value,
                row: { ...entry.row, category: e.target.value as GpaCategory },
              })
            }
          >
            <option value="" disabled>
              请选择类别
            </option>
            {["H", "P", "CH"].map((c) => (
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
            placeholder="请核实学分"
            value={entry.creditsKnown ? entry.row.credits : ""}
            onChange={(e) =>
              onChange({
                ...entry,
                creditsKnown: e.target.value !== "",
                row: { ...entry.row, credits: Number(e.target.value) },
              })
            }
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={entry.row.passFail}
          onChange={(e) =>
            onChange({
              ...entry,
              row: { ...entry.row, passFail: e.target.checked },
            })
          }
        />
        Pass/Fail，不计入 GPA
      </label>
    </div>
  );
}
export function AddCourse({
  settings,
  onAdd,
}: {
  settings: GpaSettings;
  onAdd: (rows: GpaRow[]) => Promise<boolean>;
}) {
  const [entry, setEntry] = useState<Entry | null>(null),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  let live: GpaRow | null = null;
  try {
    if (entry && text.trim()) live = { ...entry.row, ...parseGradeInput(text) };
  } catch {
    /* Keep invalid text visible; never write it. */
  }
  const select = (course: GpaCourse) => {
    setEntry({
      row: fromCourse(course, settings, uid()),
      categoryKnown: true,
      creditsKnown: true,
      manual: false,
    });
    setError("");
  };
  return (
    <form
      className="form gpa-add"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        if (!entry || !ready(entry)) {
          setError("请先选择课程，补齐未确认的类别和学分。");
          return;
        }
        try {
          const values = parseGradeInput(text);
          if (values.score === null && !values.letter && !entry.row.passFail)
            throw new Error("请输入成绩");
          lock.current = true;
          setBusy(true);
          await onAdd([{ ...entry.row, ...values }]);
        } catch (err) {
          setError(err instanceof Error ? err.message : "无法添加");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <CoursePicker
        courses={courseChoices(settings)}
        value={entry?.row.name ?? ""}
        onSelect={select}
        onCustom={(name) => {
          setEntry(makeEntry(name, settings));
          setError("");
        }}
        onQueryChange={() => setEntry(null)}
      />
      <label>
        成绩
        <input
          autoComplete="off"
          placeholder="例如 98、88/A- 或 A-"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
        />
      </label>
      {entry && (!entry.categoryKnown || !entry.creditsKnown) && (
        <p className="gpa-hint">目录未收录，请补充类别和学分。</p>
      )}
      {entry && entry.manual && <Metadata entry={entry} onChange={setEntry} />}
      {live && entry && ready(entry) && (
        <output className="gpa-live">
          {rowGrade(live).letter} · {rowGrade(live).points?.toFixed(1)} 绩点{" "}
          <small>
            {entry?.row.credits.toFixed(2)} 学分
            {entry?.row.passFail ? " · 不计入 GPA" : ""}
          </small>
        </output>
      )}
      {error && (
        <p role="alert" className="warning">
          {error}
        </p>
      )}
      <button
        className="primary"
        disabled={
          busy ||
          !entry ||
          !ready(entry) ||
          (!text.trim() && !entry.row.passFail)
        }
      >
        {busy ? "添加中…" : "确认添加"}
      </button>
    </form>
  );
}
export function BulkEntry({
  settings,
  existing,
  onAdd,
}: {
  settings: GpaSettings;
  existing: GpaRow[];
  onAdd: (rows: GpaRow[]) => Promise<boolean>;
}) {
  const [raw, setRaw] = useState(""),
    [entries, setEntries] = useState<Entry[]>([]),
    [issues, setIssues] = useState<string[]>([]),
    [parsed, setParsed] = useState(false),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const change = (i: number, e: Entry) =>
    setEntries((rows) => rows.map((r, j) => (i === j ? e : r)));
  const parse = () => {
    const next: Entry[] = [],
      errors: string[] = [];
    const seen = new Set(existing.map((r) => courseKey(r.name)));
    raw.split(/\r?\n/).forEach((line, i) => {
      if (!line.trim()) return;
      try {
        const p = parseEntryLine(line);
        if (seen.has(courseKey(p.name))) {
          errors.push(`第 ${i + 1} 行课程重复，已跳过`);
          return;
        }
        seen.add(courseKey(p.name));
        const e = makeEntry(p.name, settings);
        next.push({
          ...e,
          row: { ...e.row, score: p.score, letter: p.letter },
        });
      } catch (err) {
        errors.push(
          `第 ${i + 1} 行：${err instanceof Error ? err.message : "无法识别"}`,
        );
      }
    });
    setEntries(next);
    setIssues(errors);
    setParsed(true);
  };
  return (
    <div className="gpa-bulk">
      <label>
        每行一门课程
        <textarea
          rows={5}
          aria-label="多门成绩"
          value={raw}
          placeholder={
            "AP Biology 98/A+\nAP Calculus BC 88/A-\nAP Physics 2 90/A"
          }
          onChange={(e) => {
            setRaw(e.target.value);
            setParsed(false);
            setEntries([]);
            setIssues([]);
          }}
        />
      </label>
      <button onClick={parse}>预览成绩</button>
      {issues.length > 0 && (
        <div role="alert">
          {issues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      )}
      {entries.map((e, i) => (
        <div className="gpa-preview" key={e.row.id}>
          <div className="gpa-preview-heading">
            <strong>{e.row.name}</strong>
            <span>
              {gradeText(e.row)} →{" "}
              {ready(e) ? rowGrade(e.row).points?.toFixed(1) : "待确认"}
            </span>
          </div>
          {ready(e) && (
            <small>
              {e.row.category} · {e.row.credits.toFixed(2)} 学分
              {e.row.passFail ? " · Pass/Fail，不计入" : ""}
            </small>
          )}
          <details open={e.manual}>
            <summary>
              {ready(e) ? "修正课程信息" : "请补充未确认的类别和学分"}
            </summary>
            <CoursePicker
              courses={courseChoices(settings)}
              label={`修正 ${e.row.name}`}
              value={e.row.name}
              onSelect={(c) =>
                change(i, {
                  row: {
                    ...fromCourse(c, settings, e.row.id),
                    score: e.row.score,
                    letter: e.row.letter,
                  },
                  categoryKnown: true,
                  creditsKnown: true,
                  manual: false,
                })
              }
              onCustom={(name) => {
                const replacement = makeEntry(name, settings);
                change(i, {
                  ...replacement,
                  row: {
                    ...replacement.row,
                    id: e.row.id,
                    score: e.row.score,
                    letter: e.row.letter,
                  },
                });
              }}
            />
            <Metadata entry={e} onChange={(v) => change(i, v)} />
          </details>
        </div>
      ))}
      {parsed && !entries.length && (
        <p>还没有可导入的成绩，请检查上面的提示。</p>
      )}
      {entries.length > 0 && (
        <button
          className="primary"
          disabled={busy || entries.some((e) => !ready(e))}
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            try {
              await onAdd(entries.map((e) => e.row));
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          {busy ? "导入中…" : `确认导入 ${entries.length} 门课程`}
        </button>
      )}
    </div>
  );
}
