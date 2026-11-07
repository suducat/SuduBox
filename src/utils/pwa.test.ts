import { afterEach, beforeEach, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("PROD", true);
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal(
    "document",
    Object.assign(new EventTarget(), {
      readyState: "complete",
      visibilityState: "visible",
    }),
  );
  vi.stubGlobal("location", { reload: vi.fn() });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("发现更新只通知；别的标签激活不会刷新，只有用户主动更新才刷新", async () => {
  const postMessage = vi.fn();
  const worker = Object.assign(new EventTarget(), {
    state: "installed",
    postMessage,
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: worker,
    installing: null,
    update: vi.fn(async () => {}),
  });
  const sw = Object.assign(new EventTarget(), {
    controller: {},
    register: vi.fn(async () => registration),
  });
  vi.stubGlobal("navigator", { serviceWorker: sw });
  const pwa = await import("./pwa");
  const notified = vi.fn();
  pwa.subscribeUpdate(notified);
  pwa.registerOffline();
  await Promise.resolve();
  await Promise.resolve();
  expect(pwa.getUpdateReady()).toBe(true);
  expect(notified).toHaveBeenCalled();
  expect(postMessage).not.toHaveBeenCalled();
  sw.dispatchEvent(new Event("controllerchange"));
  expect(location.reload).not.toHaveBeenCalled();
  pwa.applyUpdate();
  expect(postMessage).toHaveBeenCalledWith("SKIP_WAITING");
  sw.dispatchEvent(new Event("controllerchange"));
  expect(location.reload).toHaveBeenCalledTimes(1);
  sw.dispatchEvent(new Event("controllerchange"));
  expect(location.reload).toHaveBeenCalledTimes(1);
});
it("首次缓存安装不显示升级提示", async () => {
  const sw = Object.assign(new EventTarget(), {
    controller: null,
    register: vi.fn(async () =>
      Object.assign(new EventTarget(), { waiting: {}, installing: null }),
    ),
  });
  vi.stubGlobal("navigator", { serviceWorker: sw });
  const pwa = await import("./pwa");
  pwa.registerOffline();
  await Promise.resolve();
  await Promise.resolve();
  expect(pwa.getUpdateReady()).toBe(false);
});
