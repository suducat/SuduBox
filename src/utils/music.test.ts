import { describe, expect, it } from "vitest";
import { randomMusicIndex } from "./music";
import { musicLines } from "../data/music-corner";
import { guideSteps } from "../data/onboarding";
import { tools } from "../data/tools";
describe("音乐随机选择", () => {
  it("单条内容仍能展示，空列表明确报错", () => {
    expect(randomMusicIndex(1, 0)).toBe(0);
    expect(() => randomMusicIndex(0)).toThrow(RangeError);
  });
  it("每个位置都可被首次抽到，换句时排除当前条目且覆盖其余条目", () => {
    const n = musicLines.length;
    const initial = Array.from({ length: n }, (_, i) =>
      randomMusicIndex(n, -1, () => (i + 0.5) / n),
    );
    expect(new Set(initial).size).toBe(n);
    for (let current = 0; current < n; current++) {
      const next = Array.from({ length: n - 1 }, (_, i) =>
        randomMusicIndex(n, current, () => (i + 0.5) / (n - 1)),
      );
      expect(next).not.toContain(current);
      expect(new Set(next).size).toBe(n - 1);
    }
  });
  it("每条保留署名，移除用户指定删除的条目", () => {
    expect(musicLines).toHaveLength(31);
    expect(
      musicLines.every((line) => line.artist && line.song && line.text),
    ).toBe(true);
    expect(musicLines.some((line) => line.text.includes("不躲闪"))).toBe(false);
  });
});
it("向导覆盖所有核心工具，所有入口都有对应路由", () => {
  const routes = guideSteps.flatMap((step) =>
    step.tools.map((tool) => tool.route),
  );
  for (const route of routes)
    expect(route === "tools" || tools.some((tool) => tool.id === route)).toBe(
      true,
    );
  for (const route of [
    "schedule",
    "notes",
    "exams",
    "focus",
    "words",
    "random",
    "text",
    "formulas",
    "gpa",
    "files",
    "ai",
    "backup",
  ])
    expect(routes).toContain(route);
});
