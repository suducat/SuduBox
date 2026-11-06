import type { Timer } from "../types";
// Paused intervals and time past the planned end never become focus time.
export function timerState(timer: Timer, now: number) {
  const delta =
    timer.started === null
      ? 0
      : Math.min(timer.remaining, Math.max(0, now - timer.started));
  return {
    remaining: Math.max(0, timer.remaining - delta),
    elapsed: Math.min(timer.total, timer.elapsed + delta),
  };
}
