import { it, expect } from "vitest";
import data from "../data/aip-presets";
import { chooseSubject, subjectKey, electiveModel } from "./electives";
import { presetCourses } from "./school";
let i = 0;
const id = () => `p-${i++}`;
it("同池选BIO整周不出现CSA或MACRO，缺少BIO的时段自习，包括单独CSA课", () => {
  const selection = chooseSubject("211", {}, "bio");
  const rows = presetCourses("211", selection, id);
  for (const r of rows) {
    if (
      r.candidates?.some((c) => ["bio", "macro", "csa"].includes(subjectKey(c)))
    ) {
      if (r.candidates.some((c) => subjectKey(c) === "bio"))
        expect(subjectKey(r.name)).toBe("bio");
      else expect(r.name).toBe("自习课");
    }
    expect(["csa", "macro"]).not.toContain(subjectKey(r.name));
  }
  expect(
    rows.filter((r) => r.start === "16:40").every((r) => r.name === "自习课"),
  ).toBe(true);
});
it("改选CSA自动取消BIO，选择按科目不依赖教室和教师字符串", () => {
  const s = chooseSubject("211", chooseSubject("211", {}, "bio"), "csa");
  expect(s["subject:bio"]).toBeUndefined();
  expect(s["subject:csa"]).toBe("1");
  expect(subjectKey("AP Biology (Teacher)【1111】")).toBe(
    subjectKey("Bio (Another)【2222】"),
  );
});
it("高一高三真实模板可生成且无同槽多课，112分组不混淆", () => {
  expect(data.filter((p) => p.grade === "高一").map((p) => p.id)).toEqual([
    "111A",
    "111B",
    "112",
    "113",
    "114",
  ]);
  expect(data.filter((p) => p.grade === "高三").map((p) => p.id)).toEqual([
    "311",
    "312",
    "313",
    "314",
  ]);
  for (const p of data) {
    const courses = presetCourses(p.id, {}, id);
    expect(courses).toHaveLength(p.slots.length);
    expect(new Set(courses.map((c) => `${c.day}-${c.start}`)).size).toBe(
      courses.length,
    );
  }
  expect(electiveModel("112").labels.has("phy 1 group a")).toBe(true);
});
it("交叉候选只排除真实同时上课科目，不误把整张课表合成一个池", () => {
  const model = electiveModel("311");
  const a = chooseSubject("311", {}, "bio");
  const b = chooseSubject("311", a, "chem");
  expect(b["subject:bio"]).toBe("1");
  expect(b["subject:chem"]).toBe("1");
  for (const keys of model.sets)
    expect(keys.filter((k) => b["subject:" + k])).toHaveLength(
      keys.filter((k) => b["subject:" + k]).length > 0 ? 1 : 0,
    );
});
it("212B原表EC缩写与同教室教师的MACRO共用选课，AL ECON保持独立", () => {
  expect(subjectKey("EC (Cash)【5310】")).toBe("macro");
  expect(subjectKey("ECON (Kwasi)【5207】")).toBe("econ");
  const s = chooseSubject("212B", {}, "macro");
  const row = presetCourses("212B", s, id).find(
    (c) => c.source?.cell === "V32:Z32",
  );
  expect(row?.room).toBe("5310");
  expect(row?.name).not.toBe("自习课");
});
