// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import StudyRooms from "./StudyRooms";
import { trackUsage } from "../utils/analytics";
vi.mock("../utils/analytics", () => ({ trackUsage: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
it("defaults to auto and immediately queries selected weekdays/periods without date inputs", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-23T08:10:00+08:00"));
  const { container } = render(<StudyRooms />);
  expect(
    screen
      .getByRole("button", { name: "自动查询" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.queryByText("作息与数据说明")).toBeNull();
  expect(screen.queryByText(/可用至/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "按课表查询" }));
  expect(
    container.querySelector('input[type="date"],input[type="time"]'),
  ).toBeNull();
  expect(screen.getByRole("combobox", { name: "星期" })).toBeTruthy();
  expect(screen.getByRole("option", { name: /第 1 节 · 08:10/ })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("星期"), { target: { value: "2" } });
  expect(screen.getByRole("option", { name: /第 1 节 · 08:00/ })).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(5);
  fireEvent.change(screen.getByLabelText("时段"), {
    target: { value: "Lunch" },
  });
  expect(screen.getAllByRole("article")).toHaveLength(8);
  expect(screen.getByText(/原表未明确午休/)).toBeTruthy();
  expect(trackUsage).toHaveBeenCalledTimes(3);
  expect(trackUsage).toHaveBeenLastCalledWith("study-rooms.manual-query");
  vi.setSystemTime(new Date("2026-11-28T12:10:00+08:00"));
  act(() => {
    vi.advanceTimersByTime(30000);
    window.dispatchEvent(new Event("focus"));
  });
  expect(screen.getAllByRole("article")).toHaveLength(8);
  expect(trackUsage).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole("button", { name: "自动查询" }));
  expect(screen.getByText("当前时段暂无自习室安排数据")).toBeTruthy();
  expect(screen.queryByRole("article")).toBeNull();
});
it("shows next-slot status on each room and never calls the last slot free", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-23T09:00:00+08:00"));
  render(<StudyRooms />);
  expect(
    within(screen.getByRole("article", { name: "教室 5210" })).getByText(
      "下时段有安排",
    ),
  ).toBeTruthy();
  expect(
    within(screen.getByRole("article", { name: "教室 5310" })).getByText(
      "下时段空闲，仍可用",
    ),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "按课表查询" }));
  fireEvent.change(screen.getByLabelText("时段"), { target: { value: "9" } });
  expect(screen.getAllByText("后续暂无安排数据")).toHaveLength(17);
  expect(screen.queryByText("下时段空闲，仍可用")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "自动查询" }));
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getAllByRole("article")).toHaveLength(9);
});
