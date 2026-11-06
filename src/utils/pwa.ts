export function registerOffline() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        const offerUpdate = (worker: ServiceWorker | null) => {
          if (
            worker &&
            navigator.serviceWorker.controller &&
            confirm(
              "速度工具箱有新版本。保存好正在输入的内容后，是否刷新更新？",
            )
          ) {
            worker.postMessage("SKIP_WAITING");
          }
        };
        offerUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") offerUpdate(worker);
          });
        });
        let refreshing = false;
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing && hadController) {
            refreshing = true;
            location.reload();
          }
        });
      })
      .catch((error) =>
        console.warn("离线缓存暂不可用，网页功能仍可使用。", error),
      );
  });
}
