import { describe, it, expect } from "vitest";
import {
  parseGradeInput,
  formatGpa,
  parseEntryLine,
  initialGpaSettings,
  matchCourse,
  fromCourse,
  appendUnique,
} from "./gpa-entry";
import { calculateGpa } from "./gpa";
import { emptyData } from "../types";
import { validateBackup } from "./logic";
const settings = initialGpaSettings(
  emptyData().preferences,
  new Date(2026, 10, 7),
);
describe("极简成绩输入", () => {
  it("支持分数、学校等级、混合输入和 Unicode 减号", () => {
    expect(parseGradeInput("98")).toEqual({ score: 98, letter: null });
    expect(parseGradeInput("88 / A−")).toEqual({ score: 88, letter: "A-" });
    expect(parseGradeInput("a-")).toEqual({ score: null, letter: "A-" });
    expect(parseGradeInput("")).toEqual({ score: null, letter: null });
    for (const text of ["101", "-1", "NaN", "88/B++", "88/", "A--"])
      expect(() => parseGradeInput(text)).toThrow();
  });
  it("批量按最后一段识别成绩，保留课程名称中的数字", () => {
    expect(parseEntryLine("AP Physics 2 90/A")).toEqual({
      name: "AP Physics 2",
      score: 90,
      letter: "A",
    });
    expect(parseEntryLine("AP Biology A-")).toEqual({
      name: "AP Biology",
      score: null,
      letter: "A-",
    });
    expect(() => parseEntryLine("不能识别")).toThrow();
  });
  it("已知跨年级课程可匹配，未知课程不推测类型或学分", () => {
    const c = matchCourse("AP Physics 2", settings)!;
    expect(c.category).toBe("H");
    expect(c.credits).toEqual([1, 1]);
    expect(matchCourse("AP Psychology", settings)).toMatchObject({
      category: "H",
      needsCreditConfirmation: true,
    });
    expect(matchCourse("psych", settings)?.name).toBe("AP Psychology");
    expect(matchCourse("心理学", settings)?.name).toBe("AP Psychology");
    expect(matchCourse("Unknown course", settings)).toBeUndefined();
    expect(
      calculateGpa(
        [
          {
            ...fromCourse(matchCourse("AP Biology", settings)!, settings, "a"),
            ...parseGradeInput("98"),
          },
        ],
        true,
      ).gpa,
    ).toBe(4.3);
  });
  it("读取课表身份，记住的 GPA 设置优先，不影响课表", () => {
    const p = { ...emptyData().preferences, aipGrade: "高三", aipGroup: "313" };
    expect(initialGpaSettings(p)).toMatchObject({
      grade: "Y12",
      track: "A-Level",
    });
    expect(initialGpaSettings({ ...p, gpaSettings: settings })).toEqual(
      settings,
    );
  });
  it("同学期按规范名称去重，草稿及设置纳入备份", () => {
    const row = {
      ...fromCourse(matchCourse("AP Biology", settings)!, settings, "a"),
      score: 98,
    };
    expect(
      appendUnique([row], [{ ...row, id: "b", name: " AP   Biology " }]),
    ).toHaveLength(1);
    const data = {
      ...emptyData(),
      gpaDraft: [row],
      preferences: { ...emptyData().preferences, gpaSettings: settings },
    };
    expect(validateBackup({ version: 1, data }).gpaDraft).toEqual([row]);
    expect(() =>
      validateBackup({
        version: 1,
        data: { ...data, gpaDraft: [{ ...row, score: 101 }] },
      }),
    ).toThrow();
    expect(() =>
      validateBackup({
        version: 1,
        data: {
          ...data,
          preferences: {
            ...data.preferences,
            gpaSettings: { ...settings, period: "invalid" },
          },
        },
      }),
    ).toThrow();
  });
});

it("GPA 显示只修正浮点尾差，不在计算前舍入", () => {
  expect(formatGpa((4.3 + 4.3 + 4 + 3.3) / 4)).toBe("3.98");
  expect(formatGpa(3.974999)).toBe("3.97");
  expect(formatGpa(3.6)).toBe("3.60");
  expect(formatGpa(0)).toBe("0.00");
  expect(formatGpa(null)).toBe("—");
});
