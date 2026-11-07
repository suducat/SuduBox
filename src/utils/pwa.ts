let waitingWorker: ServiceWorker | null = null;
let refreshRequested = false;
const listeners = new Set<() => void>();
export const getUpdateReady = () => waitingWorker !== null;
export const subscribeUpdate = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function applyUpdate() {
  if (!waitingWorker) return;
  if (waitingWorker.state === "activated") {
    // Another tab already activated it; this tab still needs its own explicit reload.
    location.reload();
    return;
  }
  refreshRequested = true;
  waitingWorker.postMessage("SKIP_WAITING");
}
export function registerOffline() {
  if ("__TAURI_INTERNALS__" in window) return;
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const start = () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
      .then((registration) => {
        const offer = (worker: ServiceWorker | null) => {
          if (!worker || !navigator.serviceWorker.controller) return;
          waitingWorker = worker;
          listeners.forEach((listener) => listener());
        };
        offer(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") offer(worker);
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // A different tab may activate a worker: never refresh this tab's editor.
          if (refreshRequested) {
            refreshRequested = false;
            location.reload();
          }
        });
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible")
            void registration.update().catch(() => {});
        });
      })
      .catch((error) =>
        console.warn("离线缓存暂不可用，网页功能仍可使用。", error),
      );
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
