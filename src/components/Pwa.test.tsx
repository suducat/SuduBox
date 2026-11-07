// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { InstallGuide } from "./Pwa";
import { Store } from "./context";
import { emptyData } from "../types";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function mount(installed = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: installed,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  return render(
    <Store.Provider
      value={{
        data: emptyData(),
        now: new Date(),
        message: "",
        toast: vi.fn(),
        update: async () => true,
      }}
    >
      <InstallGuide />
    </Store.Provider>,
  );
}
it("未安装时给出 Safari 和 Android 指引，只在浏览器支持时显示安装按钮", async () => {
  mount();
  expect(screen.getByText(/iPhone \/ iPad/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "安装应用" })).toBeNull();
  const prompt = vi.fn(async () => {});
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) },
  );
  fireEvent(window, event);
  expect(event.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "安装应用" }));
  await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "安装应用" })).toBeNull(),
  );
  expect(screen.getByText(/已在独立窗口中打开/)).toBeTruthy();
});
it("主屏幕独立模式不重复显示安装步骤或按钮", () => {
  mount(true);
  expect(screen.queryByRole("button", { name: "安装应用" })).toBeNull();
  expect(screen.queryByText(/用 Safari 打开本站/)).toBeNull();
});
