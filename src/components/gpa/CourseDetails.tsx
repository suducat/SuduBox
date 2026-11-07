import { useState } from "react";
import type { GpaRow } from "../../utils/gpa";
import { rowGrade } from "../../utils/gpa";
import {
  gradePoints,
  type GpaCategory,
  type LetterGrade,
} from "../../data/gpa-policy";
export function CourseDetails({
  row,
  onSave,
}: {
  row: GpaRow;
  onSave: (row: GpaRow) => Promise<boolean>;
}) {
  const [edit, setEdit] = useState(row),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const result = rowGrade(row);
  return (
    <div className="gpa-course-details">
      <p>
        {row.category} 类 · {row.credits.toFixed(2)} 学分 · 等级{" "}
        {result.letter ?? "未录入"} · GPA 贡献{" "}
        {row.included && !row.passFail ? (result.points ?? 0) * row.credits : 0}{" "}
        加权绩点
      </p>
      {result.different && (
        <p className="warning">
          按分数换算为 {result.calculated}，学校等级为 {row.letter}
          ；当前采用学校等级。
        </p>
      )}
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (
            !Number.isFinite(edit.credits) ||
            edit.credits < 0 ||
            edit.credits > 20
          ) {
            setError("学分应在 0–20 之间");
            return;
          }
          setBusy(true);
          try {
            await onSave({
              ...row,
              category: edit.category,
              credits: edit.credits,
              letter: edit.letter,
              included: edit.included,
              passFail: edit.passFail,
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            课程类别
            <select
              value={edit.category}
              onChange={(e) =>
                setEdit({ ...edit, category: e.target.value as GpaCategory })
              }
            >
              {["H", "P", "CH"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            本学期学分
            <input
              type="number"
              required
              min="0"
              max="20"
              step="any"
              value={Number.isFinite(edit.credits) ? edit.credits : ""}
              onChange={(e) =>
                setEdit({
                  ...edit,
                  credits: e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            学校等级
            <select
              value={edit.letter ?? ""}
              onChange={(e) =>
                setEdit({
                  ...edit,
                  letter: (e.target.value || null) as LetterGrade | null,
                })
              }
            >
              <option value="">按分数换算</option>
              {Object.keys(gradePoints).map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={edit.passFail}
            onChange={(e) => setEdit({ ...edit, passFail: e.target.checked })}
          />
          Pass/Fail，不计入 GPA
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={edit.included}
            onChange={(e) => setEdit({ ...edit, included: e.target.checked })}
          />
          计入 GPA
        </label>
        {error && <p role="alert">{error}</p>}
        <button disabled={busy} type="submit">
          {busy ? "保存中…" : "应用修改"}
        </button>
      </form>
    </div>
  );
}
