// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import StudyRooms from "./StudyRooms";
import { trackUsage } from "../utils/analytics";
vi.mock("../utils/analytics", () => ({ trackUsage: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
it("defaults to auto, runs a local range only on submit, and resumes automatic updates", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-23T08:10:00+08:00"));
  render(<StudyRooms />);
  expect(
    screen
      .getByRole("button", { name: "自动查询" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.getByText("3 间可用自习室")).toBeTruthy();
  expect(screen.queryByText("作息与数据说明")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "手动查询" }));
  fireEvent.change(screen.getByLabelText("查询日期"), {
    target: { value: "2026-11-23" },
  });
  fireEvent.change(screen.getByLabelText("开始时间"), {
    target: { value: "09:00" },
  });
  fireEvent.change(screen.getByLabelText("结束时间"), {
    target: { value: "10:00" },
  });
  await act(async () => {
    fireEvent.submit(
      screen.getByRole("button", { name: "查询自习室" }).closest("form")!,
    );
  });
  expect(screen.getByText("1 间在所选时间段内均可用")).toBeTruthy();
  expect(trackUsage).toHaveBeenCalledExactlyOnceWith(
    "study-rooms.manual-query",
  );
  act(() => {
    vi.advanceTimersByTime(30000);
    window.dispatchEvent(new Event("focus"));
  });
  expect(trackUsage).toHaveBeenCalledTimes(1);
  expect(screen.getByText("1 间在所选时间段内均可用")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("开始时间"), {
    target: { value: "11:00" },
  });
  await act(async () => {
    fireEvent.submit(
      screen.getByRole("button", { name: "查询自习室" }).closest("form")!,
    );
  });
  expect(screen.getByText(/结束时间应晚于开始时间/)).toBeTruthy();
  expect(trackUsage).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date("2026-11-23T12:10:00+08:00"));
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  fireEvent.click(screen.getByRole("button", { name: "自动查询" }));
  expect(screen.getByText("8 间可用自习室")).toBeTruthy();
  expect(screen.getByText(/Lunch 午休/)).toBeTruthy();
});
