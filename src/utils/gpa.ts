import {
  gradePoints,
  thresholds,
  type GpaCategory,
  type LetterGrade,
} from "../data/gpa-policy";
export interface GpaRow {
  id: string;
  name: string;
  year: string;
  grade: "Y10" | "Y11" | "Y12";
  period: "S1Midterm" | "S1Final" | "S2Final";
  category: GpaCategory;
  score: number | null;
  letter: LetterGrade | null;
  credits: number;
  included: boolean;
  passFail: boolean;
}
export function convertGrade(
  score: number,
  category: GpaCategory,
): LetterGrade {
  if (!Number.isFinite(score) || score < 0 || score > 100)
    throw new Error("成绩必须在 0–100 之间");
  return thresholds[category].find(([minimum]) => score >= minimum)![1];
}
export function rowGrade(row: GpaRow) {
  const calculated =
    row.score === null ? null : convertGrade(row.score, row.category);
  const letter = row.letter ?? calculated;
  return {
    calculated,
    letter,
    points: letter === null ? null : gradePoints[letter],
    different: !!row.letter && !!calculated && row.letter !== calculated,
  };
}
export function calculateGpa(rows: readonly GpaRow[], includeMidterm = false) {
  let credits = 0,
    total = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    if (
      !row.included ||
      row.passFail ||
      (!includeMidterm && row.period === "S1Midterm")
    )
      continue;
    if (!Number.isFinite(row.credits) || row.credits < 0)
      throw new Error("学分必须为非负数");
    if (row.credits === 0) continue;
    const result = rowGrade(row);
    if (result.points === null) continue;
    credits += row.credits;
    total += result.points * row.credits;
  }
  return { credits, total, gpa: credits ? total / credits : null };
}
export function parseGpaLine(line: string) {
  const match = line
    .trim()
    .match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F))?$/i,
    );
  if (!match) throw new Error("格式应为：课程名称 98/A+");
  const score = Number(match[2]);
  if (score > 100) throw new Error("成绩不能超过100");
  return {
    name: match[1].trim(),
    score,
    letter: match[3]?.toUpperCase() as LetterGrade | undefined,
  };
}
export function validGpaRows(value: unknown): value is GpaRow[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((r: unknown) => {
    if (typeof r !== "object" || r === null) return false;
    const x = r as Record<string, unknown>;
    if (typeof x.id !== "string" || !x.id || ids.has(x.id)) return false;
    ids.add(x.id);
    return (
      typeof x.name === "string" &&
      x.name.length > 0 &&
      typeof x.year === "string" &&
      /^\d{4}[–-]\d{4}$/.test(x.year) &&
      ["Y10", "Y11", "Y12"].includes(String(x.grade)) &&
      ["S1Midterm", "S1Final", "S2Final"].includes(String(x.period)) &&
      ["P", "H", "CH"].includes(String(x.category)) &&
      (x.score === null ||
        (typeof x.score === "number" &&
          Number.isFinite(x.score) &&
          x.score >= 0 &&
          x.score <= 100)) &&
      (x.letter === null ||
        (typeof x.letter === "string" &&
          Object.hasOwn(gradePoints, x.letter))) &&
      typeof x.credits === "number" &&
      Number.isFinite(x.credits) &&
      x.credits >= 0 &&
      x.credits <= 20 &&
      typeof x.included === "boolean" &&
      typeof x.passFail === "boolean"
    );
  });
}
