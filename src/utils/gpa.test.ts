import { describe, it, expect } from "vitest";
import { thresholds } from "../data/gpa-policy";
import {
  calculateGpa,
  convertGrade,
  rowGrade,
  parseGpaLine,
  type GpaRow,
} from "./gpa";
const row = (overrides: Partial<GpaRow> = {}): GpaRow => ({
  id: "1",
  name: "Test",
  year: "2026–2027",
  grade: "Y11",
  period: "S1Final",
  category: "H",
  score: null,
  letter: null,
  credits: 1,
  included: true,
  passFail: false,
  ...overrides,
});
describe("AIP GPA政策", () => {
  for (const category of ["P", "H", "CH"] as const)
    it(`${category}所有边界和小数`, () => {
      const bands = thresholds[category];
      bands.forEach(([minimum, letter], i) => {
        expect(convertGrade(minimum, category)).toBe(letter);
        if (minimum > 0)
          expect(convertGrade(minimum - 0.001, category)).toBe(bands[i + 1][1]);
      });
      expect(convertGrade(100, category)).toBe("A+");
      expect(convertGrade(0, category)).toBe("F");
    });
  it("H没有D-，不提前四舍五入", () => {
    expect(convertGrade(59.999, "H")).toBe("F");
    expect(convertGrade(93.999, "P")).toBe("A-");
  });
  it("拒绝无效成绩", () => {
    for (const score of [-1, 101, NaN, Infinity])
      expect(() => convertGrade(score, "P")).toThrow();
  });
  it("政策提供的加权示例为3.60", () => {
    expect(
      calculateGpa([
        row({ name: "Accelerated AP Calculus BC", score: 87, letter: "A-" }),
        row({
          id: "2",
          name: "Pre-AP Biology",
          category: "P",
          score: 90,
          letter: "A-",
          credits: 0.5,
        }),
        row({
          id: "3",
          name: "Pre-AP World History",
          score: 84,
          letter: "B+",
          credits: 0.5,
        }),
      ]).gpa,
    ).toBeCloseTo(3.6, 12);
  });
  it("空成绩、0学分、Pass/Fail不进入分母，0分进入", () => {
    expect(
      calculateGpa([
        row(),
        row({ id: "2", score: 100, credits: 0 }),
        row({ id: "3", score: 100, passFail: true }),
        row({ id: "4", score: 0 }),
      ]),
    ).toEqual({ credits: 1, total: 0, gpa: 0 });
  });
  it("累计排除期中并按全部学分加权，去重ID", () => {
    const rows = [
      row({ letter: "A", year: "2025–2026" }),
      row({ id: "2", letter: "B", credits: 0.5 }),
      row({ id: "3", letter: "F", period: "S1Midterm" }),
    ];
    expect(calculateGpa([...rows, rows[0]]).gpa).toBeCloseTo(5.5 / 1.5);
  });
  it("学校等级优先并提示差异", () => {
    expect(rowGrade(row({ score: 88, letter: "A+" }))).toMatchObject({
      calculated: "A-",
      letter: "A+",
      points: 4.3,
      different: true,
    });
  });
  it("解析用户提供的综合成绩格式", () => {
    expect(parseGpaLine("AP Calculus BC 88/A-")).toEqual({
      name: "AP Calculus BC",
      score: 88,
      letter: "A-",
    });
    expect(() => parseGpaLine("Homework")).toThrow();
  });
});

import { gpaCourses } from "../data/gpa-courses";
import { validGpaRows } from "./gpa";
import { validateBackup } from "./logic";
import { emptyData } from "../types";
it("目录正确保留跨学期零学分及CH学术/PF差异", () => {
  expect(
    gpaCourses.find(
      (c) => c.track === "AP" && c.grade === "Y11" && c.name === "Physics",
    )?.credits,
  ).toEqual([0.25, 0]);
  expect(
    gpaCourses.find(
      (c) => c.track === "AP" && c.grade === "Y10" && c.name === "History",
    )?.credits,
  ).toEqual([0, 0.25]);
  expect(
    gpaCourses
      .filter((c) => c.name === "Physical Education")
      .every((c) => c.passFail),
  ).toBe(true);
  expect(
    gpaCourses.filter((c) => c.name === "Chinese").every((c) => !c.passFail),
  ).toBe(true);
});
it("旧备份兼容，成绩备份可还原，无效或重复成绩拒绝", () => {
  expect(validateBackup({ version: 1, data: emptyData() }).gpa).toBeUndefined();
  const data = { ...emptyData(), gpa: [row({ score: 88, letter: "A-" })] };
  expect(
    validateBackup(JSON.parse(JSON.stringify({ version: 1, data }))).gpa,
  ).toEqual(data.gpa);
  expect(validGpaRows([row(), row()])).toBe(false);
  expect(() =>
    validateBackup({
      version: 1,
      data: { ...data, gpa: [row({ score: 101 })] },
    }),
  ).toThrow();
});
