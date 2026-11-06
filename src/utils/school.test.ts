import { describe, it, expect } from "vitest";
import { chooseSubject, subjectKey } from "./electives";
import { emptyData } from "../types";
import {
  schoolState,
  presetCourses,
  importPreset,
  electiveOptions,
  dayCourses,
} from "./school";
let id = 0;
const make = () => `test-${++id}`;
const at = (date: string, time: string) => new Date(`${date}T${time}:00+08:00`);
const setup = () => ({
  ...emptyData(),
  courses: presetCourses("211", {}, make),
  preferences: {
    ...emptyData().preferences,
    aipIdentity: "yes" as const,
    aipTimezone: "Asia/Shanghai",
  },
});
describe("AIP 时间边界与覆盖", () => {
  it("周一第一节与星期二第一节结束边界不同", () => {
    const d = setup();
    expect(schoolState(d, at("2026-11-02", "08:40")).current).toHaveLength(1);
    expect(schoolState(d, at("2026-11-02", "08:50")).label).toBe("课间休息");
    expect(schoolState(d, at("2026-11-03", "08:40")).label).toBe("课间休息");
    expect(schoolState(d, at("2026-11-03", "09:00")).current).toHaveLength(1);
  });
  it.each([
    ["07:59", "尚未上课"],
    ["12:10", "午休"],
    ["14:10", "上课"],
    ["16:30", "课间休息"],
    ["19:00", "晚自习"],
    ["22:00", "今日安排已结束"],
  ])("%s 正确显示 %s", (time, state) => {
    const s = schoolState(setup(), at("2026-11-03", time));
    if (state === "上课") expect(s.current).toHaveLength(1);
    else expect(s.label).toBe(state);
  });
  it("周末无安排休息，手动周末课优先", () => {
    const d = setup();
    expect(schoolState(d, at("2026-11-07", "09:00")).label).toBe("周末休息");
    d.courses.push({
      ...d.courses[0],
      id: make(),
      day: 6,
      name: "周末补课",
      start: "09:00",
      end: "10:00",
    });
    expect(schoolState(d, at("2026-11-07", "09:00")).label).toContain(
      "周末补课",
    );
  });
  it("日期停课覆盖每周课与晚自习，特殊周末课程覆盖休息", () => {
    const d = setup();
    d.preferences = {
      ...d.preferences,
      ...{
        specialDays: [
          {
            date: "2026-11-03",
            closed: true,
            mode: "replace" as const,
            courses: [],
          },
        ],
      },
    };
    expect(schoolState(d, at("2026-11-03", "09:00")).label).toBe("今日停课");
    expect(schoolState(d, at("2026-11-03", "19:00")).label).toBe("今日停课");
    expect(dayCourses(d, "2026-11-03")).toEqual([]);
  });
  it("跨天与其他时区重新计算本地日期", () => {
    const d = setup();
    expect(schoolState(d, new Date("2026-11-06T16:00:00Z")).date).toBe(
      "2026-11-07",
    );
    d.preferences.aipTimezone = "America/New_York";
    expect(schoolState(d, new Date("2026-11-06T16:00:00Z")).date).toBe(
      "2026-11-06",
    );
  });
});
describe("安全预设导入", () => {
  it("拒绝同版本重复导入；换模板保留笔记并留恢复点", () => {
    const d = setup();
    d.lessons.push({
      id: make(),
      courseId: d.courses[0].id,
      courseName: "原课",
      date: "2026-11-02",
      content: "原笔记",
      homework: "",
      review: "",
      note: "",
      confused: true,
      resolved: false,
    });
    expect(() => importPreset(d, "211", {}, false, make)).toThrow(/已导入/);
    const next = importPreset(d, "212B", {}, true, make);
    expect(next.courses).toHaveLength(42);
    expect(next.lessons).toEqual(d.lessons);
    expect(next.preferences.scheduleRecovery?.courses).toEqual(d.courses);
    expect(next.courses.some((c) => c.id === d.lessons[0].courseId)).toBe(
      false,
    );
  });
  it("集会不拆分，候选不选则没有确定教室，不能选择该时段缺失科目", () => {
    expect(electiveOptions("Assembly/Clubs")).toEqual([]);
    const rows = presetCourses("211", {}, make);
    const pending = rows.find((c) => c.candidates?.length)!;
    expect(pending.name).toBe("自习课");
    expect(pending.room).toBe("");
    expect(() =>
      presetCourses("211", { "subject:假的选修课": "1" }, make),
    ).toThrow();
    const selected = presetCourses(
      "211",
      chooseSubject("211", {}, subjectKey(pending.candidates![0])),
      make,
    ).find((c) => c.source?.cell === pending.source?.cell)!;
    expect(selected.room).not.toBe("");
    expect(selected.source?.raw).toBe(pending.source?.raw);
  });
});
it("新版有第九节且来源为S2，不凭空填入休息时段", () => {
  const rows = presetCourses("212B", {}, make);
  expect(rows).toHaveLength(42);
  expect(rows.filter((c) => c.start === "16:40")).toHaveLength(2);
  expect(
    rows.every(
      (c) => c.source?.sheet === "S2" && c.source.version === "2026-10-08",
    ),
  ).toBe(true);
});
