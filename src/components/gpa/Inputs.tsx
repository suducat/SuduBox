import { useEffect, useId, useState } from "react";
import type { GpaCourse } from "../../data/gpa-courses";
import { gradeText, parseGradeInput } from "../../utils/gpa-entry";
import type { GpaRow } from "../../utils/gpa";

export function CoursePicker({
  courses,
  value,
  onSelect,
  onCustom,
  label = "搜索课程",
  onQueryChange,
}: {
  courses: GpaCourse[];
  value: string;
  onSelect: (c: GpaCourse) => void;
  onCustom: (name: string) => void;
  label?: string;
  onQueryChange?: () => void;
}) {
  const id = useId();
  const [query, setQuery] = useState(value),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);
  const options = courses.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const select = (c: GpaCourse) => {
    onSelect(c);
    setQuery(c.name);
    setOpen(false);
  };
  return (
    <div
      className="gpa-picker"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options[active] ? `${id}-${active}` : undefined
        }
        autoComplete="off"
        placeholder="输入课程名，例如 Physics"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onQueryChange?.();
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((i) =>
              Math.max(
                0,
                Math.min(
                  options.length - 1,
                  i + (e.key === "ArrowDown" ? 1 : -1),
                ),
              ),
            );
          }
          if (e.key === "Enter" && open) {
            e.preventDefault();
            if (options[active]) select(options[active]);
          }
        }}
      />
      {open && (
        <div
          className="gpa-options"
          id={`${id}-options`}
          role="listbox"
          aria-label="匹配课程"
        >
          {options.map((c, i) => (
            <button
              type="button"
              role="option"
              id={`${id}-${i}`}
              aria-selected={active === i}
              key={c.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(c)}
            >
              {c.name}
              <small>
                {c.grade} · {c.category}
                {c.condition ? ` · ${c.condition}` : ""}
              </small>
            </button>
          ))}
          {!options.length && <p>目录中没有匹配项。</p>}
          {query.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onCustom(query.trim());
                setOpen(false);
              }}
            >
              手动添加“{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function GradeField({
  row,
  onChange,
  label,
}: {
  row: GpaRow;
  onChange: (value: Pick<GpaRow, "score" | "letter">) => void;
  label: string;
}) {
  const [value, setValue] = useState(gradeText(row)),
    [focused, setFocused] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!focused && !error) setValue(gradeText(row));
  }, [row.score, row.letter, focused, error]);
  const id = useId();
  return (
    <div className="gpa-grade-input">
      <input
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? id : undefined}
        value={value}
        placeholder="98 / A+"
        autoComplete="off"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (error) setValue(value);
        }}
        onChange={(e) => {
          setValue(e.target.value);
          try {
            const parsed = parseGradeInput(e.target.value);
            setError("");
            onChange(parsed);
          } catch (err) {
            setError(err instanceof Error ? err.message : "成绩无效");
          }
        }}
      />
      {error && (
        <small id={id} role="alert">
          {error}，此输入尚未保存。
        </small>
      )}
    </div>
  );
}
