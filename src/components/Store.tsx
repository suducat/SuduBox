import { useState, useEffect, useRef, type ReactNode } from "react";
import { emptyData, type Data } from "../types";
import { load, mutate } from "../db";
import { Store } from "./context";
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(emptyData);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, toast] = useState("");
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    load()
      .then((d) => {
        setData(d);
        setReady(true);
      })
      .catch((e) =>
        setError(
          `无法打开本地数据库：${String(e)}。请允许浏览器保存网站数据，然后刷新。`,
        ),
      );
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
      void load()
        .then((d) => {
          setData(d);
        })
        .catch(() => toast("读取更新失败，请刷新重试"));
    };
    const channel =
      "BroadcastChannel" in window ? new BroadcastChannel("sudubox") : null;
    if (channel) channel.onmessage = refresh;
    window.addEventListener("focus", refresh);
    return () => {
      channel?.close();
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => toast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        data.preferences.theme === "system"
          ? m.matches
            ? "dark"
            : "light"
          : data.preferences.theme);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [data.preferences.theme]);
  const update = (fn: (d: Data) => Data): Promise<boolean> =>
    new Promise((resolve) => {
      pending.current++;
      queue.current = queue.current.then(async () => {
        try {
          const next = await mutate(fn);
          setData(next);
          if ("BroadcastChannel" in window) {
            const channel = new BroadcastChannel("sudubox");
            channel.postMessage("changed");
            channel.close();
          }
          resolve(true);
        } catch (error) {
          toast(
            error instanceof Error
              ? error.message + "（未更改原有数据）"
              : "保存失败，请检查浏览器存储权限或空间，并先备份数据。",
          );
          resolve(false);
        } finally {
          pending.current--;
        }
      });
    });
  if (error)
    return (
      <main className="loading">
        <h1>本地存储暂不可用</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>重试</button>
      </main>
    );
  if (!ready) return <main className="loading">正在打开你的学习空间…</main>;
  return (
    <Store.Provider value={{ data, update, toast, now, message }}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </Store.Provider>
  );
}
