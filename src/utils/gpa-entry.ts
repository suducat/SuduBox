import { supplementalGpaCourses } from "../data/gpa-supplement";
import { gpaCourses, type GpaCourse } from "../data/gpa-courses";
import { gradePoints, type LetterGrade } from "../data/gpa-policy";
import { rowGrade, type GpaRow } from "./gpa";
import type { Preferences } from "../types";

export interface GpaSettings {
  year: string;
  grade: GpaRow["grade"];
  track: GpaCourse["track"];
  period: GpaRow["period"];
  mode: "draft" | "saved";
}
export const periods = {
  S1Midterm: "第一学期期中（估算）",
  S1Final: "第一学期最终",
  S2Final: "第二学期最终",
};
export function validGpaSettings(value: unknown): value is GpaSettings {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.year === "string" &&
    /^\d{4}[–-]\d{4}$/.test(v.year) &&
    ["Y10", "Y11", "Y12"].includes(String(v.grade)) &&
    ["AP", "A-Level"].includes(String(v.track)) &&
    Object.hasOwn(periods, String(v.period)) &&
    ["draft", "saved"].includes(String(v.mode))
  );
}
export function initialGpaSettings(
  p: Preferences,
  now = new Date(),
): GpaSettings {
  if (validGpaSettings(p.gpaSettings)) return p.gpaSettings;
  const year = now.getFullYear() - (now.getMonth() < 7 ? 1 : 0);
  const grade = p.aipGrade?.startsWith("高一")
    ? "Y10"
    : p.aipGrade?.startsWith("高三")
      ? "Y12"
      : "Y11";
  const group = p.aipGroup ?? "";
  const track = /^(113|114|213|214|313|314)(?:\D|$)|\bAL\b|A-Level/i.test(group)
    ? "A-Level"
    : "AP";
  return {
    year: `${year}–${year + 1}`,
    grade,
    track,
    period: "S1Final",
    mode: "draft",
  };
}
export function parseGradeInput(
  text: string,
): Pick<GpaRow, "score" | "letter"> {
  const clean = text.trim().toUpperCase().replace(/[−–]/g, "-");
  if (!clean) return { score: null, letter: null };
  if (Object.hasOwn(gradePoints, clean))
    return { score: null, letter: clean as LetterGrade };
  const m = clean.match(
    /^(\d+(?:\.\d+)?)\s*(?:\/\s*(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F))?$/,
  );
  if (!m || !Number.isFinite(Number(m[1])) || Number(m[1]) > 100)
    throw new Error("请输入 0–100、88/A- 或 A-");
  return {
    score: Number(m[1]),
    letter: (m[2] as LetterGrade | undefined) ?? null,
  };
}
export function gradeText(row: GpaRow) {
  return row.score === null
    ? (row.letter ?? "")
    : `${row.score}${row.letter ? `/${row.letter}` : ""}`;
}
export function parseEntryLine(line: string) {
  const match = line
    .trim()
    .replace(/\t+/g, " ")
    .match(/^(.+?)\s+((?:\d+(?:\.\d+)?\s*(?:\/\s*)?)?(?:[ABCDF][+\-−–]?)?)$/i);
  if (!match || !match[2].trim()) throw new Error("请按“课程名称 98/A+”输入");
  return { name: match[1].trim(), ...parseGradeInput(match[2]) };
}
export const courseKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();
export const rowKey = (r: GpaRow) =>
  `${r.year.replace("–", "-")}|${r.grade}|${r.period}|${courseKey(r.name)}`;
export function appendUnique(existing: GpaRow[], incoming: GpaRow[]) {
  const keys = new Set(existing.map(rowKey));
  return [
    ...existing,
    ...incoming.filter((r) => {
      const k = rowKey(r);
      if (keys.has(k)) return false;
      keys.add(k);
      return true;
    }),
  ];
}
export function courseChoices(settings: GpaSettings) {
  const result: GpaCourse[] = [];
  // Prefer the student's grade, but allow explicitly selecting a course in another grade.
  const courses = [...gpaCourses, ...supplementalGpaCourses]
    .filter((c) => c.track === settings.track)
    .sort(
      (a, b) =>
        Number(b.grade === settings.grade) - Number(a.grade === settings.grade),
    );
  const seen = new Set<string>();
  for (const c of courses) {
    const key = `${courseKey(c.name)}|${c.category}|${c.credits[settings.period === "S2Final" ? 1 : 0]}|${c.passFail}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}
export function matchCourse(name: string, settings: GpaSettings) {
  const choices = courseChoices(settings).filter((c) =>
    [c.name, ...(c.aliases ?? [])].some(
      (alias) => courseKey(alias) === courseKey(name),
    ),
  );
  const current = choices.filter((c) => c.grade === settings.grade);
  return current.length === 1
    ? current[0]
    : choices.length === 1
      ? choices[0]
      : undefined;
}
export function fromCourse(
  course: GpaCourse,
  settings: GpaSettings,
  id: string,
): GpaRow {
  return {
    id,
    name: course.name,
    year: settings.year,
    grade: settings.grade,
    period: settings.period,
    category: course.category,
    credits: course.credits[settings.period === "S2Final" ? 1 : 0],
    included: course.included,
    passFail: course.passFail,
    score: null,
    letter: null,
  };
}
export const counted = (row: GpaRow) =>
  row.included &&
  !row.passFail &&
  row.credits > 0 &&
  rowGrade(row).points !== null;

// Correct only floating-point representation noise at the display boundary.
// The calculation engine and the stored, unrounded GPA remain unchanged.
export function formatGpa(value: number | null) {
  if (value === null) return "—";
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 4;
  return (Math.round((value + tolerance) * 100) / 100).toFixed(2);
}
