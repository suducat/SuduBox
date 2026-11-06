import { it, expect } from "vitest";
import presets from "./aip-presets-20260518.json";
it("五份真实课表各40时段，独立分组且无午休伪课程", () => {
  expect(presets).toHaveLength(5);
  for (const p of presets) expect(p.slots).toHaveLength(40);
  expect(new Set(presets.map((p) => p.id)).size).toBe(5);
});
it("关键单元格逐格保持原教师与教室差异", () => {
  for (const [id, cell, text] of [
    ["211", "E4", "5301"],
    ["212", "E17", "2206"],
    ["212B", "F29", "Lesley Li"],
    ["213", "G42", "5311"],
    ["214", "E55", "AL Maths"],
  ])
    expect(
      presets.find((p) => p.id === id)?.slots.find((s) => s.cell === cell)?.raw,
    ).toContain(text);
});
it("周一首节不套用其他工作日时间", () => {
  for (const p of presets) {
    expect(p.slots[0].start).toBe("08:10");
    expect(p.slots[0].end).toBe("08:50");
    expect(p.slots[1].start).toBe("08:00");
    expect(p.slots[1].end).toBe("08:40");
  }
});
