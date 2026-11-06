import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Timer as TimerIcon,
} from "lucide-react";
import { useStore } from "../components/context";
import { PageHead, Panel, Empty } from "../components/UI";
import { localDate } from "../utils/logic";
import { timerState } from "../utils/timer";
import { uid, type Timer } from "../types";
const clock = (ms: number) =>
  `${String(Math.floor(Math.max(0, ms) / 60000)).padStart(2, "0")}:${String(Math.floor(Math.max(0, ms) / 1000) % 60).padStart(2, "0")}`;
export default function Focus() {
  const { data, update, now, toast } = useStore();
  const [mode, setMode] = useState<Timer["mode"]>("focus");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const notified = useRef("");
  const timer = data.timer;
  const currentMode = timer?.mode ?? mode;
  const minutes =
    currentMode === "focus"
      ? data.preferences.focusMinutes
      : currentMode === "short"
        ? data.preferences.shortMinutes
        : data.preferences.longMinutes;
  const remaining = timer
    ? timerState(timer, now.getTime()).remaining
    : minutes * 60000;
  useEffect(() => {
    if (timer && remaining === 0 && notified.current !== timer.id) {
      notified.current = timer.id;
      toast("计时结束，请确认并保存本次记录。");
      if ("Notification" in window && Notification.permission === "granted")
        new Notification("速度工具箱 · 计时结束", {
          body: "本次计时已结束，可以保存记录或开始休息。",
        });
    }
  }, [remaining, timer, toast]);
  const action = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const start = () =>
    action(() =>
      update((d) => ({
        ...d,
        timer: d.timer
          ? d.timer.started !== null
            ? d.timer
            : { ...d.timer, started: Date.now() }
          : {
              id: uid(),
              mode,
              total: minutes * 60000,
              remaining: minutes * 60000,
              started: Date.now(),
              originalStart: Date.now(),
              subject: subject.trim(),
              elapsed: 0,
            },
      })),
    );
  const pause = () =>
    action(() =>
      update((d) => {
        if (!d.timer || !d.timer.started) return d;
        return {
          ...d,
          timer: {
            ...d.timer,
            ...timerState(d.timer, Date.now()),
            started: null,
          },
        };
      }),
    );
  const finish = () =>
    action(() =>
      update((d) => {
        const t = d.timer;
        if (!t || t.id !== timer?.id) return d;
        const actual = timerState(t, Date.now()).elapsed;
        return {
          ...d,
          timer: null,
          focus:
            t.mode === "focus" &&
            actual >= 1000 &&
            !d.focus.some((f) => f.id === t.id)
              ? [
                  ...d.focus,
                  {
                    id: t.id,
                    date: localDate(new Date(t.originalStart)),
                    duration: actual,
                    subject: t.subject,
                    start: t.originalStart,
                    end: Date.now(),
                  },
                ]
              : d.focus,
        };
      }).then((ok) => {
        if (ok)
          toast(
            currentMode === "focus"
              ? "已按实际计时时长保存记录"
              : "休息计时已结束",
          );
      }),
    );
  const today = data.focus
    .filter((f) => f.date === localDate(now))
    .reduce((n, f) => n + f.duration, 0);
  const mon = new Date(now);
  mon.setDate(now.getDate() - (now.getDay() || 7) + 1);
  const week = data.focus
    .filter((f) => f.date >= localDate(mon) && f.date <= localDate(now))
    .reduce((n, f) => n + f.duration, 0);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    const date = localDate(d);
    return {
      date,
      label: d.toLocaleDateString("zh-CN", { weekday: "short" }),
      value: data.focus
        .filter((f) => f.date === date)
        .reduce((n, f) => n + f.duration / 60000, 0),
    };
  });
  const max = Math.max(30, ...bars.map((b) => b.value));
  return (
    <>
      <PageHead
        eyebrow="ONE THING AT A TIME"
        title="专注番茄钟"
        description="专心学一会儿，也记得休息"
      />
      <div className="focus-layout">
        <section className="panel timer-panel">
          <div className="tabs">
            {[
              ["focus", "专注"],
              ["short", "短休息"],
              ["long", "长休息"],
            ].map(([id, label]) => (
              <button
                disabled={!!timer}
                className={currentMode === id ? "active" : ""}
                key={id}
                onClick={() => setMode(id as Timer["mode"])}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="timer-orbit"
            style={
              {
                "--progress": `${100 * (1 - remaining / (timer?.total ?? minutes * 60000))}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <TimerIcon size={23} />
              <div className="timer-number" role="timer" aria-label="剩余时间">
                {clock(remaining)}
              </div>
              <span>
                {remaining === 0
                  ? "计时结束 · 请确认保存"
                  : timer?.started
                    ? "保持专注，你正在积累进步"
                    : timer
                      ? "暂停一下，再继续"
                      : "准备好开始了吗？"}
              </span>
            </div>
          </div>
          <input
            className="topic-input"
            placeholder="这次想专注什么？科目或学习主题"
            aria-label="学习主题"
            value={timer?.subject ?? subject}
            disabled={!!timer}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setSubject(inputValue);
            }}
          />
          <div className="timer-buttons">
            {remaining > 0 && (
              <button
                disabled={busy}
                className="primary"
                onClick={() => void (timer?.started ? pause() : start())}
              >
                {timer?.started ? <Pause size={18} /> : <Play size={18} />}{" "}
                {timer?.started ? "暂停" : timer ? "继续专注" : "开始计时"}
              </button>
            )}
            {timer && (
              <>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (confirm("重置会放弃本段尚未保存的时间，确定吗？"))
                      void action(() => update((d) => ({ ...d, timer: null })));
                  }}
                >
                  <RotateCcw size={17} />
                  重置
                </button>
                <button disabled={busy} onClick={() => void finish()}>
                  <Check size={17} />
                  {remaining === 0 ? "保存记录" : "提前完成"}
                </button>
              </>
            )}
          </div>
          <p className="footnote">
            离开时请暂停，结束后保存记录。
          </p>
          <button
            className="text-button"
            onClick={async () => {
              if (!("Notification" in window)) {
                toast("此浏览器不支持通知");
                return;
              }
              const result = await Notification.requestPermission();
              toast(
                result === "granted"
                  ? "通知已开启（需要页面仍在运行）"
                  : "通知未开启，不影响计时",
              );
            }}
          >
            启用计时结束通知（可选）
          </button>
        </section>
        <div className="stack">
          <div className="stat-pair">
            <div className="panel">
              <small>今日专注</small>
              <strong>
                {Math.floor(today / 60000)}
                <span> 分钟</span>
              </strong>
            </div>
            <div className="panel">
              <small>本周累计</small>
              <strong>
                {Math.floor(week / 60000)}
                <span> 分钟</span>
              </strong>
            </div>
          </div>
          <Panel title="最近 7 天">
            <div className="bar-chart">
              {bars.map((b) => (
                <div key={b.date}>
                  <span>{Math.round(b.value)}</span>
                  <div className="bar-track">
                    <div style={{ height: `${(b.value / max) * 100}%` }} />
                  </div>
                  <small>{b.label}</small>
                </div>
              ))}
            </div>
            <p className="footnote">单位：分钟 · 仅包含已确认保存的专注记录</p>
          </Panel>
          <Panel title="计时时长">
            <div className="duration-settings">
              {(
                [
                  ["focusMinutes", "专注"],
                  ["shortMinutes", "短休息"],
                  ["longMinutes", "长休息"],
                ] as const
              ).map(([k, l]) => (
                <label key={k}>
                  {l}
                  <input
                    aria-label={`${l}分钟`}
                    type="number"
                    min="1"
                    max="180"
                    value={data.preferences[k]}
                    disabled={!!timer}
                    onChange={(e) => {
                      const inputValue = e.target.value;

                      const n = Number(inputValue);
                      if (n >= 1 && n <= 180)
                        void update((d) => ({
                          ...d,
                          preferences: { ...d.preferences, [k]: n },
                        }));
                    }}
                  />
                  分钟
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Panel title="最近专注记录">
        {data.focus.length ? (
          <div className="record-list">
            {data.focus
              .slice()
              .reverse()
              .slice(0, 30)
              .map((f) => (
                <div key={f.id} className="list-row">
                  <span>
                    <strong>{f.subject || "自由专注"}</strong>
                    <small>
                      {f.date} ·{" "}
                      {new Date(f.start).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      —{" "}
                      {new Date(f.end).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </span>
                  <span className="badge">
                    {Math.floor(f.duration / 60000)} 分{" "}
                    {Math.floor(f.duration / 1000) % 60} 秒
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <Empty
            title="专注的每一分钟，都值得记录"
            description="完成一次计时并保存后，在这里查看学习记录。"
          />
        )}
      </Panel>
    </>
  );
}
