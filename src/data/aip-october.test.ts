import { it, expect } from "vitest";
import all from "./aip-presets";
const data = all.filter((p) => p.grade === "高二");
it("新版五组共206实际课程时段，空斜杠不生成课", () => {
  expect(data.map((p) => p.slots.length)).toEqual([42, 42, 42, 40, 40]);
  for (const p of data)
    for (const s of p.slots) {
      expect(s.raw.trim()).not.toBe("/");
      expect(Object.values(s.cells).join("\n")).toBe(s.raw);
    }
});
it("新版教师和教室及选修候选来自各自单元格", () => {
  expect(data[0].slots.find((s) => s.cell === "O4:U4")?.teacher).toContain(
    "Netsanet",
  );
  expect(data[3].slots.find((s) => s.cell === "V44:Z44")?.teacher).toBe(
    "Bin Li",
  );
  expect(data[0].slots.find((s) => s.cell === "AA5:AF5")?.options).toHaveLength(
    2,
  );
  expect(data[0].slots.find((s) => s.cell === "AA4:AF4")?.options).toHaveLength(
    3,
  );
  expect(data[0].slots.find((s) => s.cell === "B12:H12")?.options).toHaveLength(
    0,
  );
});
