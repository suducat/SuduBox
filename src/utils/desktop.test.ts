import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { download, copy } from "./logic";
import { registerOffline } from "./pwa";
const native = vi.hoisted(() => ({ save: vi.fn(), writeTextFile: vi.fn(), writeText: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ save: native.save }));
vi.mock("@tauri-apps/plugin-fs", () => ({ writeTextFile: native.writeTextFile }));
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({ writeText: native.writeText }));
beforeEach(() => {
  vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
  vi.stubGlobal("alert", vi.fn());
  native.save.mockReset();
  native.writeTextFile.mockReset();
  native.writeText.mockReset();
});
afterEach(() => vi.unstubAllGlobals());
describe("桌面文件保存", () => {
  it("只向用户选定的路径保存原始内容", async () => {
    native.save.mockResolvedValue("/chosen/backup.json");
    native.writeTextFile.mockResolvedValue(undefined);
    expect(await download("backup.json", '{"version":1}')).toBe(true);
    expect(native.writeTextFile).toHaveBeenCalledExactlyOnceWith("/chosen/backup.json", '{"version":1}');
  });
  it("取消保存不会写文件或报告成功", async () => {
    native.save.mockResolvedValue(null);
    expect(await download("backup.json", "{}")).toBe(false);
    expect(native.writeTextFile).not.toHaveBeenCalled();
  });
  it("写入失败会反馈并返回失败", async () => {
    native.save.mockResolvedValue("/chosen/backup.json");
    native.writeTextFile.mockRejectedValue(new Error("disk full"));
    expect(await download("backup.json", "{}")).toBe(false);
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("disk full"));
  });
  it("桌面复制仅写入剪贴板", async () => {
    await copy("复制结果");
    expect(native.writeText).toHaveBeenCalledExactlyOnceWith("复制结果");
  });
  it("桌面启动不注册网页 Service Worker", () => {
    expect(() => registerOffline()).not.toThrow();
  });
});
