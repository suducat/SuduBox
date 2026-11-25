import analyticsConfig from "../data/analytics-config.json";
import { tools } from "../data/tools";

const OPT_OUT = "sudubox.analytics.disabled";
const SCRIPT_ID = "sudubox-umami";
const websiteId =
  import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ||
  analyticsConfig.websiteId.trim();
const hostname =
  import.meta.env.VITE_UMAMI_HOSTNAME?.trim() ||
  analyticsConfig.hostname.trim();
const toolIds = new Set(
  tools
    .filter((t) => t.group === "学习中心" || t.group === "实用工具")
    .map((t) => t.id),
);
export const usageEvents = [
  "schedule.save",
  "schedule.import",
  "gpa.calculate",
  "formulas.view",
  "exams.save",
  "focus.start",
  "random.draw",
  "notes.create",
  "text.clean",
  "words.save",
  "words.import",
  "words.review",
  "study-rooms.query",
  "study-rooms.manual-query",
] as const;
export type UsageEvent = (typeof usageEvents)[number];
const names = new Set<string>([
  ...usageEvents.map((event) => `tool.${event}`),
  ...Array.from(toolIds, (id) => `tool.${id}.open`),
]);
type Payload = Record<string, unknown>;
type Tracker = {
  track: (build: (defaults: Payload) => Payload) => Promise<unknown>;
};
declare global {
  interface Window {
    umami?: Tracker;
    suduboxUmamiBeforeSend?: (
      type: string,
      payload: Payload,
    ) => Payload | false;
  }
}
let lastRoute = "";
let attempted = false;
let loaded = false;

export function analyticsEnabled() {
  try {
    return localStorage.getItem(OPT_OUT) !== "1";
  } catch {
    return false;
  }
}
function eligible() {
  return (
    import.meta.env.PROD &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      websiteId,
    ) &&
    location.protocol === "https:" &&
    location.hostname === hostname &&
    !("__TAURI_INTERNALS__" in window) &&
    navigator.onLine &&
    !["1", "yes"].includes(navigator.doNotTrack ?? "") &&
    analyticsEnabled()
  );
}
function knownRoute(route: string) {
  return tools.some((t) => t.id === route) || route === "tools";
}
// An allowlist is the only payload boundary. Never send input, query strings,
// document titles, referrers, content, session IDs or arbitrary event properties.
export function sanitizeAnalyticsPayload(
  type: string,
  payload: Payload,
): Payload | false {
  if (!eligible() || type !== "event") return false;
  const route =
    typeof payload.url === "string" ? payload.url.split("#/")[1] : "";
  if (
    !route ||
    !knownRoute(route) ||
    (payload.name !== undefined && !names.has(String(payload.name)))
  )
    return false;
  return {
    website: websiteId,
    hostname: location.hostname,
    url: `${import.meta.env.BASE_URL}#/${route}`,
    title: tools.find((t) => t.id === route)?.name ?? "工具中心",
    referrer: "",
    screen:
      typeof payload.screen === "string" && /^\d+x\d+$/.test(payload.screen)
        ? payload.screen
        : undefined,
    language: navigator.language,
    ...(payload.name === undefined ? {} : { name: payload.name }),
  };
}
function send(name?: string) {
  if (!loaded || !eligible() || !knownRoute(lastRoute)) return;
  try {
    void window.umami
      ?.track((defaults) => ({
        ...defaults,
        url: `${import.meta.env.BASE_URL}#/${lastRoute}`,
        ...(name ? { name } : {}),
      }))
      .catch(() => {});
  } catch {
    /* Analytics must never affect a tool. */
  }
}
function reportVisit() {
  send();
  if (toolIds.has(lastRoute)) send(`tool.${lastRoute}.open`);
  // A query happens once per entry. Timers/focus updates never report usage.
  if (lastRoute === "study-rooms") trackUsage("study-rooms.query");
}
export function initAnalytics() {
  if (attempted || !eligible()) return;
  attempted = true; // No script retries, queue, offline persistence or replay.
  try {
    window.suduboxUmamiBeforeSend = sanitizeAnalyticsPayload;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = "https://cloud.umami.is/script.js";
    script.referrerPolicy = "no-referrer";
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute("data-auto-track", "false");
    script.setAttribute("data-errors", "false");
    script.setAttribute("data-performance", "false");
    script.setAttribute("data-do-not-track", "true");
    script.setAttribute("data-exclude-search", "true");
    script.setAttribute("data-before-send", "suduboxUmamiBeforeSend");
    script.onload = () => {
      loaded = true;
      reportVisit();
    };
    script.onerror = () => {
      loaded = false;
    };
    document.head.appendChild(script);
  } catch {
    loaded = false; // CSP/browser policy failures must not affect core tools.
  }
}
export function visitPage(route: string) {
  if (route === lastRoute) return;
  lastRoute = route; // Also updated offline: no backfill when reconnecting.
  if (!knownRoute(route)) return;
  if (loaded) reportVisit();
  else initAnalytics();
}
export function trackUsage(event: UsageEvent) {
  if (usageEvents.includes(event)) send(`tool.${event}`);
}
export function setAnalyticsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(OPT_OUT, enabled ? "0" : "1");
  } catch {
    return;
  }
  // The before-send gate stays installed even when the script is removed.
  if (!enabled) document.getElementById(SCRIPT_ID)?.remove();
  else initAnalytics();
}
