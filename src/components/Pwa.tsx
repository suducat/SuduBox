import { useEffect, useState, useSyncExternalStore } from "react";
import { applyUpdate, getUpdateReady, subscribeUpdate } from "../utils/pwa";
import { useStore } from "./context";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installEvent: InstallEvent | null = null;
// Register before React/IndexedDB finishes mounting; some browsers fire early.
if (typeof window !== "undefined")
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event as InstallEvent;
    window.dispatchEvent(new Event("sudubox:install-ready"));
  });
export function UpdateNotice() {
  const available = useSyncExternalStore(subscribeUpdate, getUpdateReady);
  const [later, setLater] = useState(false),
    [busy, setBusy] = useState(false);
  const { update, toast } = useStore();
  if (!available || later) return null;
  return (
    <aside className="pwa-update" role="status">
      <span>新版本已就绪，保存好输入内容后再更新。</span>
      <button
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          // Flush queued IndexedDB writes through the existing single transaction queue.
          const ok = await update((d) => d);
          if (ok) applyUpdate();
          else {
            toast("保存尚未完成，请稍后再更新");
            setBusy(false);
          }
        }}
      >
        保存并刷新
      </button>
      <button disabled={busy} onClick={() => setLater(true)}>
        稍后
      </button>
    </aside>
  );
}
export function InstallGuide() {
  const standalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone;
  const [installed, setInstalled] = useState(standalone),
    [ready, setReady] = useState(!!installEvent),
    [busy, setBusy] = useState(false);
  const { toast } = useStore();
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(standalone());
    const onReady = () => setReady(!!installEvent);
    const onInstalled = () => {
      installEvent = null;
      setReady(false);
      setInstalled(true);
    };
    window.addEventListener("sudubox:install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", sync);
    return () => {
      window.removeEventListener("sudubox:install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", sync);
    };
  }, []);
  if ("__TAURI_INTERNALS__" in window) return null;
  return (
    <section className="panel install-guide">
      <h2>安装到主屏幕</h2>
      {installed ? (
        <p>已在独立窗口中打开，可以像应用一样使用。</p>
      ) : (
        <>
          <p>
            <strong>iPhone / iPad：</strong>用 Safari 打开本站，点“分享” →
            “添加到主屏幕”。若看到“作为网页 App 打开”，保持开启。
          </p>
          <p>
            <strong>Android：</strong>在 Chrome
            等支持的浏览器中点“安装应用”；没有按钮时，在浏览器菜单中选择“安装应用”或“添加到主屏幕”。
          </p>
          {ready && (
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                const event = installEvent;
                if (!event || busy) return;
                setBusy(true);
                try {
                  await event.prompt();
                  const choice = await event.userChoice;
                  if (choice.outcome === "accepted") setInstalled(true);
                } catch {
                  toast("请通过浏览器菜单添加到主屏幕");
                } finally {
                  installEvent = null;
                  setReady(false);
                  setBusy(false);
                }
              }}
            >
              安装应用
            </button>
          )}
          <p>
            也可直接在浏览器使用。首次完整打开并完成缓存后，本地工具可离线使用。
          </p>
        </>
      )}
      <p>
        数据保存在当前浏览器或主屏幕应用，不同设备不会自动同步。清除网站数据前请先导出备份。
      </p>
    </section>
  );
}
