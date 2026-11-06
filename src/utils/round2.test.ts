import { it, expect } from "vitest";
import katex from "katex";
import { formulas } from "../data/formulas";
import { officialExams } from "../data/exam-presets";
import { officialStatus } from "./exams";
import { validateBackup } from "./logic";
import { emptyData } from "../types";
it("每条公式可渲染且有单位、条件、来源，ID不重复", () => {
  expect(new Set(formulas.map((f) => f.id)).size).toBe(formulas.length);
  for (const f of formulas) {
    expect(() =>
      katex.renderToString(f.expression, { throwOnError: true }),
    ).not.toThrow();
    expect(
      f.units &&
        f.conditions &&
        f.variables &&
        f.source?.url &&
        f.checked &&
        f.course,
    ).toBeTruthy();
  }
});
it("官方日期保留范围与过期状态，不产生负数倒计时", () => {
  const season = officialExams.find((e) => e.precision === "range")!;
  expect(officialStatus(season, new Date("2027-05-05T12:00:00"))).toBe(
    "考季进行中",
  );
  expect(officialStatus(season, new Date("2027-05-15T12:00:00"))).toBe(
    "已结束",
  );
  const day = officialExams[0];
  expect(officialStatus(day, new Date(day.date + "T12:00:00"))).toBe(
    "今天考试",
  );
  expect(new Set(officialExams.map((e) => e.id)).size).toBe(
    officialExams.length,
  );
  for (const e of officialExams) {
    expect(e.source.startsWith("https://")).toBe(true);
    expect(e.checked).toBe("2026-11-06");
  }
});
it("旧备份兼容，题库和特殊日期附加字段必须验证", () => {
  const d = emptyData();
  expect(validateBackup({ version: 1, data: d })).toEqual(d);
  const malformed = {
    ...d,
    preferences: {
      ...d.preferences,
      questionBank: [{ id: "a", question: "原题", answer: 7 }],
    },
  };
  expect(() => validateBackup({ version: 1, data: malformed })).toThrow();
  expect(() =>
    validateBackup({
      version: 1,
      data: {
        ...d,
        preferences: {
          ...d.preferences,
          specialDays: [{ date: "2026-99-99" }],
        },
      },
    }),
  ).toThrow();
});
