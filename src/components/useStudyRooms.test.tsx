// @vitest-environment jsdom
import { renderHook, act, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useStudyRooms } from "./useStudyRooms";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("updates across periods at 15 seconds, immediately on focus/visibility, and cleans up", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-24T12:09:59+08:00"));
  const { result, unmount } = renderHook(useStudyRooms);
  expect(result.current.slot?.id).toBe("5");
  act(() => {
    vi.advanceTimersByTime(15000);
  });
  expect(result.current.slot?.id).toBe("Lunch");
  vi.setSystemTime(new Date("2026-11-24T14:10:00+08:00"));
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(result.current.slot?.id).toBe("6");
  vi.setSystemTime(new Date("2026-11-28T14:10:00+08:00"));
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(result.current.slot).toBeUndefined();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
