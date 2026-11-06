import { describe, it, expect } from "vitest";
import type { Timer } from "../types";
import { timerState } from "./timer";
const timer: Timer = {
  id: "session",
  mode: "focus",
  total: 60000,
  remaining: 60000,
  started: 1000,
  originalStart: 1000,
  subject: "",
  elapsed: 0,
};
describe("时间戳计时恢复", () => {
  it("刷新后依据原始时间戳恢复", () =>
    expect(timerState(timer, 21000)).toEqual({
      remaining: 40000,
      elapsed: 20000,
    }));
  it("后台过期时不计入额外时间", () =>
    expect(timerState(timer, 999999)).toEqual({
      remaining: 0,
      elapsed: 60000,
    }));
  it("暂停不继续累计，恢复只计算本段", () => {
    expect(
      timerState(
        { ...timer, started: null, remaining: 40000, elapsed: 20000 },
        999999,
      ),
    ).toEqual({ remaining: 40000, elapsed: 20000 });
    expect(
      timerState(
        { ...timer, started: 100000, remaining: 40000, elapsed: 20000 },
        110000,
      ),
    ).toEqual({ remaining: 30000, elapsed: 30000 });
  });
  it("设备时间倒退不产生负时长", () =>
    expect(timerState(timer, 0)).toEqual({ remaining: 60000, elapsed: 0 }));
});
