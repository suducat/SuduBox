import { describe, it, expect } from "vitest";
import {
  schedule,
  conflicts,
  countdown,
  cleanText,
  defaultClean,
  draw,
  parseWords,
  validateBackup,
  localDate,
} from "./logic";
import { emptyData, type Course } from "../types";
const course = (patch: Partial<Course> = {}): Course => ({
  id: "a",
  name: "数学",
  day: 1,
  start: "09:00",
  end: "10:00",
  room: "",
  note: "",
  color: "#4979e8",
  ...patch,
});
describe("本地课表", () => {
  it("识别当前、下一节与完成进度", () => {
    const s = schedule(
      [course(), course({ id: "b", start: "10:15", end: "11:00" })],
      new Date(2026, 10, 2, 9, 30),
    );
    expect(s.current[0].id).toBe("a");
    expect(s.next?.id).toBe("b");
    expect(s.completed).toBe(0);
  });
  it("边界下课不再算当前，上课算当前", () => {
    expect(
      schedule([course()], new Date(2026, 10, 2, 10)).current,
    ).toHaveLength(0);
    expect(schedule([course()], new Date(2026, 10, 2, 9)).current).toHaveLength(
      1,
    );
  });
  it("当天无课、跨午夜与周日", () => {
    expect(schedule([course()], new Date(2026, 10, 3, 0)).today).toHaveLength(
      0,
    );
    expect(
      schedule([course({ day: 7 })], new Date(2026, 10, 8, 9, 30)).current,
    ).toHaveLength(1);
  });
  it("提醒重叠而非首尾相接", () => {
    expect(
      conflicts(course(), [course({ id: "b", start: "09:30", end: "10:30" })]),
    ).toHaveLength(1);
    expect(
      conflicts(course(), [course({ id: "b", start: "10:00", end: "11:00" })]),
    ).toHaveLength(0);
  });
});
describe("考试日期", () => {
  it("同一天无时间显示今天", () =>
    expect(
      countdown({ date: "2026-11-05", time: "" }, new Date(2026, 10, 5, 12)),
    ).toBe("今天考试"));
  it("日期按照本地日历而非剩余整日", () =>
    expect(
      countdown(
        { date: "2026-11-06", time: "" },
        new Date(2026, 10, 5, 23, 59),
      ),
    ).toBe("1 天"));
  it("处理考试时间和历史", () => {
    expect(
      countdown(
        { date: "2026-11-05", time: "14:00" },
        new Date(2026, 10, 5, 13, 30),
      ),
    ).toContain("0小时 30分钟");
    expect(
      countdown(
        { date: "2026-11-05", time: "12:00" },
        new Date(2026, 10, 5, 13),
      ),
    ).toBe("已结束");
  });
  it("本地日期不会用 UTC 截取", () =>
    expect(localDate(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01"));
});
describe("保守文本整理", () => {
  it("保留小数、缩写、公式、段落", () => {
    const s = "3.14 + x^2 = 0\nU.S.A.\n\n下一段。";
    expect(cleanText(s, defaultClean)).toBe(s);
  });
  it("清理空格和重复空行", () =>
    expect(cleanText("  a   b \n\n\n c  ", defaultClean)).toBe("a b\n\nc"));
  it("规则可以独立关闭", () =>
    expect(
      cleanText(" a  b ", {
        spaces: false,
        trim: false,
        pdf: false,
        cjk: false,
        punctuation: false,
        width: false,
        blank: false,
      }),
    ).toBe(" a  b "));
  it("可选字符规范不修改小数", () =>
    expect(
      cleanText("中文English，测试,3.14", {
        ...defaultClean,
        cjk: true,
        punctuation: true,
      }),
    ).toBe("中文 English，测试，3.14"));
});
describe("抽题", () => {
  it("抽取互不重复，剩余池正确", () => {
    const a = draw(["1", "2", "3"], 2, () => 0);
    expect(a.picked).toEqual(["1", "2"]);
    expect(a.remaining).toEqual(["3"]);
    const b = draw(a.remaining, 2, () => 0);
    expect(b.picked).toEqual(["3"]);
    expect(b.remaining).toEqual([]);
  });
  it("空池不会产生虚假结果", () => expect(draw([], 3).picked).toEqual([]));
});
describe("单词清洗", () => {
  it("兼容分隔符并去重", () => {
    const p = parseWords(
      "derive 推导\nequilibrium - 均衡\nelasticity: 弹性\nDerive 重复\n\n foo bar",
      ["foo"],
    );
    expect(p.rows.map((w) => w.word)).toEqual([
      "derive",
      "equilibrium",
      "elasticity",
    ]);
    expect(p.duplicates).toBe(2);
  });
  it("失败行明确返回", () =>
    expect(parseWords("invalid\n a:").errors).toHaveLength(2));
});
describe("备份验证", () => {
  it("验证空备份并清除计时", () =>
    expect(validateBackup({ version: 1, data: emptyData() })).toEqual(
      emptyData(),
    ));
  it("拒绝错误版本和缺字段", () => {
    expect(() => validateBackup({ version: 2, data: emptyData() })).toThrow();
    expect(() => validateBackup({ version: 1, data: {} })).toThrow();
  });
  it("拒绝非法时间、日期、状态和重复 ID", () => {
    const d = emptyData();
    d.courses = [course({ end: "08:00" })];
    expect(() => validateBackup({ version: 1, data: d })).toThrow();
    d.courses = [course(), course()];
    expect(() => validateBackup({ version: 1, data: d })).toThrow();
    d.courses = [];
    d.exams = [
      {
        id: "1",
        name: "a",
        date: "2026-02-30",
        time: "",
        subject: "",
        color: "",
        done: false,
        pinned: false,
      },
    ];
    expect(() => validateBackup({ version: 1, data: d })).toThrow();
  });
});
