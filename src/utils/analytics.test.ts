// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const id = "12345678-1234-1234-1234-123456789abc";
const setup = () => import("./analytics");
beforeEach(() => {
  vi.resetModules();
  vi.doMock("../data/analytics-config.json", () => ({
    default: { websiteId: "", hostname: "suducat.github.io" },
  }));
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_UMAMI_WEBSITE_ID", id);
  vi.stubEnv("VITE_UMAMI_HOSTNAME", "suducat.github.io");
  vi.stubGlobal("location", {
    protocol: "https:",
    hostname: "suducat.github.io",
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  Object.defineProperty(navigator, "doNotTrack", {
    configurable: true,
    value: "0",
  });
  localStorage.clear();
  document.head.innerHTML = "";
  delete window.umami;
  delete window.suduboxUmamiBeforeSend;
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const loadScript = async () => {
  const sent: Record<string, unknown>[] = [];
  window.umami = {
    track: vi.fn(async (build) => {
      const clean = window.suduboxUmamiBeforeSend?.(
        "event",
        build({
          screen: "1024x768",
          title: "PRIVATE",
          referrer: "PRIVATE",
          url: "PRIVATE",
          id: "PRIVATE",
        }),
      );
      if (clean) sent.push(clean);
    }),
  };
  document.getElementById("sudubox-umami")?.dispatchEvent(new Event("load"));
  await Promise.resolve();
  return sent;
};
describe("independent anonymous analytics", () => {
  it.each(["unconfigured", "offline", "development", "tauri", "preview"])(
    "does nothing when %s",
    async (mode) => {
      if (mode === "unconfigured") vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "");
      if (mode === "offline")
        Object.defineProperty(navigator, "onLine", { value: false });
      if (mode === "development") vi.stubEnv("PROD", false);
      if (mode === "tauri")
        (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
      if (mode === "preview")
        vi.stubGlobal("location", {
          protocol: "https:",
          hostname: "preview.test",
        });
      const a = await setup();
      a.visitPage("schedule");
      a.trackUsage("schedule.save");
      expect(document.querySelector("script")).toBeNull();
    },
  );
  it("loads asynchronously without automatic tracking; only route transitions count", async () => {
    const a = await setup();
    a.visitPage("study-rooms");
    a.visitPage("study-rooms");
    const script = document.querySelector("script")!;
    expect(script.async).toBe(true);
    expect(script.getAttribute("data-auto-track")).toBe("false");
    const sent = await loadScript();
    expect(sent.map((p) => p.name)).toEqual([
      undefined,
      "tool.study-rooms.open",
      "tool.study-rooms.query",
    ]);
    a.visitPage("study-rooms");
    expect(sent).toHaveLength(3);
    a.visitPage("random");
    a.trackUsage("random.draw");
    expect(sent.map((p) => p.name).slice(-3)).toEqual([
      undefined,
      "tool.random.open",
      "tool.random.draw",
    ]);
  });
  it("strips all content, IDs, referrers, and rejects unknown pages and event names", async () => {
    const a = await setup();
    const clean = a.sanitizeAnalyticsPayload("event", {
      url: "/#/gpa",
      name: "tool.gpa.calculate",
      data: { score: 99, note: "SECRET" },
      title: "SECRET",
      referrer: "SECRET",
      id: "SECRET",
      screen: "1024x768",
    });
    expect(clean).toMatchObject({
      url: "/#/gpa",
      name: "tool.gpa.calculate",
      referrer: "",
    });
    expect(JSON.stringify(clean)).not.toContain("SECRET");
    expect(clean).not.toHaveProperty("data");
    expect(clean).not.toHaveProperty("id");
    expect(a.sanitizeAnalyticsPayload("identify", { url: "/#/gpa" })).toBe(
      false,
    );
    expect(
      a.sanitizeAnalyticsPayload("event", { url: "/#/gpa?input=SECRET" }),
    ).toBe(false);
    expect(
      a.sanitizeAnalyticsPayload("event", { url: "/#/gpa", name: "SECRET" }),
    ).toBe(false);
  });
  it("stops sending immediately after opt-out, including a stale script's callback", async () => {
    const a = await setup();
    a.visitPage("gpa");
    const sent = await loadScript();
    const initial = sent.length;
    a.setAnalyticsEnabled(false);
    a.trackUsage("gpa.calculate");
    a.visitPage("random");
    expect(sent).toHaveLength(initial);
    expect(a.sanitizeAnalyticsPayload("event", { url: "/#/gpa" })).toBe(false);
    expect(document.querySelector("script")).toBeNull();
  });
  it("silently skips failures/offline actions without retries or backfill", async () => {
    const a = await setup();
    a.visitPage("gpa");
    const sent = await loadScript();
    const initial = sent.length;
    Object.defineProperty(navigator, "onLine", { value: false });
    a.trackUsage("gpa.calculate");
    a.visitPage("random");
    Object.defineProperty(navigator, "onLine", { value: true });
    expect(sent).toHaveLength(initial);
    a.trackUsage("random.draw");
    expect(sent).toHaveLength(initial + 1);
    window.umami = { track: vi.fn().mockRejectedValue(new Error("offline")) };
    expect(() => a.trackUsage("random.draw")).not.toThrow();
    await Promise.resolve();
  });
  it("does not retry a failed script load on later navigation", async () => {
    const a = await setup();
    a.visitPage("gpa");
    const script = document.querySelector("script")!;
    script.dispatchEvent(new Event("error"));
    script.remove();
    a.visitPage("random");
    expect(document.querySelector("script")).toBeNull();
  });
});

it("does not load when Do Not Track is enabled", async () => {
  Object.defineProperty(navigator, "doNotTrack", { value: "1" });
  const a = await setup();
  a.visitPage("gpa");
  expect(document.querySelector("script")).toBeNull();
});
it("silently tolerates a browser policy refusing script insertion", async () => {
  const blocked = vi
    .spyOn(document.head, "appendChild")
    .mockImplementation(() => {
      throw new Error("CSP");
    });
  try {
    const a = await setup();
    expect(() => a.visitPage("gpa")).not.toThrow();
    expect(() => a.trackUsage("gpa.calculate")).not.toThrow();
  } finally {
    blocked.mockRestore();
  }
});

it("uses the public config when no Actions variable is supplied", async () => {
  vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "");
  vi.doMock("../data/analytics-config.json", () => ({
    default: { websiteId: id, hostname: "suducat.github.io" },
  }));
  const a = await setup();
  a.visitPage("gpa");
  expect(
    document.querySelector("script")?.getAttribute("data-website-id"),
  ).toBe(id);
});
