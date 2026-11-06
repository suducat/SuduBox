import { MusicCorner } from "../components/MusicCorner";
import { OfficialExams } from "../components/OfficialExams";
import { schoolState } from "../utils/school";
import { SchoolStatus } from "../components/RoundTwo";
import {
  ArrowUpRight,
  Sun,
  CalendarDays,
  Clock3,
  BookOpen,
  Timer,
  Check,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../components/context";
import { Panel, Empty, Modal } from "../components/UI";
import {
  schedule,
  localDate,
  countdown,
  examTimestamp,
  minutes,
} from "../utils/logic";
import { tools } from "../data/tools";
import { type Lesson } from "../types";
export default function Home() {
  const { data, now, update, toast } = useStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [banner, setBanner] = useState(
    localStorage.getItem("sudubox.hideBanner") !== "1",
  );
  const s = schoolState(data, now);
  const exams = data.exams
    .filter((e) => e.pinned && !e.done && examTimestamp(e) >= now.getTime())
    .sort((a, b) => examTimestamp(a) - examTimestamp(b))
    .slice(0, 3);
  const review = data.lessons.filter((l) => l.confused && !l.resolved);
  const notes = data.notes
    .filter((n) => n.date === localDate(now) && !n.done)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const focus = data.focus
    .filter((f) => f.date === localDate(now))
    .reduce((n, f) => n + f.duration, 0);
  const quick = tools.filter(
    (t) =>
      ["schedule", "notes", "words", "focus"].includes(t.id) ||
      data.favorites.includes(`tool:${t.id}`),
  );
  const h = now.getHours();
  const greeting =
    h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好";
  return (
    <>
      <div className="home-heading">
        <div>
          <h1>
            {greeting}，继续向前 <Sun size={28} />
          </h1>
        </div>
        <div className="date-label">
          <CalendarDays size={16} />
          {now.toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </div>
      </div>
      {banner && (
        <section className="welcome-banner">
          <button
            className="banner-close icon-button"
            aria-label="关闭首页提示"
            onClick={() => {
              localStorage.setItem("sudubox.hideBanner", "1");
              setBanner(false);
            }}
          >
            <X size={20} />
          </button>
          <div>
            <span className="banner-tag">
              <Sparkles size={14} /> 速度工具箱 · 让学习更简单
            </span>
            <h2>
              把计划装进盒子，
              <br />
              把时间留给成长。
            </h2>
            <a className="button" href="#/schedule">
              安排我的课程 <ArrowRight size={16} />
            </a>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="art-grid" />
            <div className="art-card art-back">
              <span />
              <span />
              <span />
            </div>
            <div className="art-card art-front">
              <div className="art-check">
                <Check size={22} />
              </div>
              <i />
              <i />
              <i />
              <div className="art-line" />
            </div>
            <div className="floating-icon">
              <BookOpen size={25} />
            </div>
            <div className="art-spark">✦</div>
          </div>
        </section>
      )}
      <MusicCorner />
      <SchoolStatus />
      <OfficialExams home />
      <div className="dashboard-stats">
        {[
          {
            icon: CalendarDays,
            label: "今日课程",
            number: s.today.length,
            unit: "节",
            caption: s.today.length
              ? `已完成 ${s.completed} 节`
              : "等待你的第一份课表",
            color: "blue",
          },
          {
            icon: Clock3,
            label: "近期考试",
            number: data.exams.filter(
              (e) => !e.done && examTimestamp(e) >= now.getTime(),
            ).length,
            unit: "场",
            caption: "按自己的目标稳步前进",
            color: "purple",
          },
          {
            icon: BookOpen,
            label: "待复习知识点",
            number: review.length,
            unit: "条",
            caption: review.length ? "一点点弄懂，就在进步" : "暂无待复习内容",
            color: "orange",
          },
          {
            icon: Timer,
            label: "今日专注",
            number: Math.floor(focus / 60000),
            unit: "分钟",
            caption: "记录每一次认真投入",
            color: "green",
          },
        ].map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="inline between">
              <span>{c.label}</span>
              <div className={`stat-icon ${c.color}`}>
                <c.icon size={19} />
              </div>
            </div>
            <strong>
              {c.number}
              <small>{c.unit}</small>
            </strong>
            <p>{c.caption}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="今天的课程" link="schedule">
          {s.today.length ? (
            <>
              <div className="current-course">
                <span className="badge">
                  {s.current.length
                    ? "当前安排"
                    : s.next
                      ? "下一节课"
                      : "今天辛苦了"}
                </span>
                <h3>
                  {data.preferences.aipIdentity === "yes"
                    ? s.label
                    : s.current.map((c) => c.name).join(" / ") ||
                      s.next?.name ||
                      "今日课程已结束"}
                </h3>
                <p>
                  {data.preferences.aipIdentity === "yes"
                    ? `下一项：${s.nextText}`
                    : s.next
                      ? `${s.next.start} ${s.next.name}`
                      : "今天没有后续课程"}
                </p>
              </div>
              <div className="mini-schedule">
                {s.today.map((c) => (
                  <a href="#/schedule" key={c.id}>
                    <span
                      className="course-dot"
                      style={{ background: c.color }}
                    />
                    <span className="time-range">
                      {c.start}
                      <small>{c.end}</small>
                    </span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>{c.room || "未设置教室"}</small>
                    </span>
                    {minutes(c.end) <= s.minute ? (
                      <Check size={16} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                  </a>
                ))}
              </div>
              <div className="progress">
                <div
                  style={{ width: `${(s.completed / s.today.length) * 100}%` }}
                />
              </div>
              <small className="muted">
                今日课程进度 {s.completed} / {s.today.length}
              </small>
            </>
          ) : (
            <Empty
              title="今天还没有课程"
              description="添加课表，自动掌握当前与下一节课程。"
              action={
                <a href="#/schedule" className="text-button">
                  创建我的课表 →
                </a>
              }
            />
          )}
        </Panel>
        <Panel title="近期考试" link="exams">
          {exams.length ? (
            <div className="stack">
              {exams.map((e) => (
                <a href="#/exams" className="exam-mini" key={e.id}>
                  <span>
                    <strong>{e.name}</strong>
                    <small>
                      {e.date} · {e.subject || "自定义考试"}
                    </small>
                  </span>
                  <b style={{ color: e.color }}>{countdown(e, now)}</b>
                </a>
              ))}
            </div>
          ) : (
            <Empty
              title="还没有考试"
              description="添加考试并固定到首页，让准备更有方向。"
              action={
                <a href="#/exams" className="text-button">
                  添加考试 →
                </a>
              }
            />
          )}
        </Panel>
        <Panel title="待复习 · 把没听懂的弄懂" link="schedule">
          {review.length ? (
            <div className="stack">
              {review.slice(0, 5).map((l) => (
                <button
                  className="review-row"
                  key={l.id}
                  onClick={() => setLesson(l)}
                >
                  <span className="review-square">
                    <BookOpen size={17} />
                  </span>
                  <span>
                    <strong>
                      {l.review || l.content || "这节课需要再复习"}
                    </strong>
                    <small>
                      {l.courseName} · {l.date}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="暂时没有待复习内容"
              description="课堂速记中标记“没听懂”，就会自动汇总到这里。"
            />
          )}
        </Panel>
        <Panel title="今日便签" link="notes">
          {notes.length ? (
            <div className="stack">
              {notes.slice(0, 5).map((n) => (
                <div className="home-note" key={n.id}>
                  <button
                    aria-label="完成便签"
                    className="checkbox-button"
                    onClick={() =>
                      void update((d) => ({
                        ...d,
                        notes: d.notes.map((x) =>
                          x.id === n.id ? { ...x, done: true } : x,
                        ),
                      }))
                    }
                  />
                  <a href="#/notes">
                    <strong>{n.text || "空白便签"}</strong>
                    {n.subject && <small>{n.subject}</small>}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="还没有今日便签"
              description="随手写下作业、灵感，或今天想完成的小事。"
              action={
                <a href="#/notes" className="text-button">
                  写下第一张便签 →
                </a>
              }
            />
          )}
        </Panel>
      </div>
      <div className="section-title">
        <h2>常用工具</h2>
        <a href="#/tools">
          全部工具 <ArrowRight size={15} />
        </a>
      </div>
      <div className="quick-tools">
        {quick.map((t) => (
          <a href={`#/${t.id}`} key={t.id}>
            <div className="quick-icon">
              <t.icon size={22} />
            </div>
            <span>
              <strong>{t.name}</strong>
              <small>{t.keywords.split(" ")[0]} · 打开工具</small>
            </span>
            <ArrowUpRight size={17} />
          </a>
        ))}
      </div>
      {lesson && (
        <Modal
          title={`${lesson.courseName} · 待复习`}
          close={() => setLesson(null)}
        >
          <div className="form">
            <p className="muted">{lesson.date}</p>
            <h3>{lesson.review || "需要复习的课堂内容"}</h3>
            <p className="pre-wrap">{lesson.content}</p>
            {lesson.note && <p>{lesson.note}</p>}
            <button
              className="primary"
              onClick={async () => {
                if (
                  await update((d) => ({
                    ...d,
                    lessons: d.lessons.map((l) =>
                      l.id === lesson.id ? { ...l, resolved: true } : l,
                    ),
                  }))
                ) {
                  setLesson(null);
                  toast("已标记理解，历史记录仍然保留");
                }
              }}
            >
              <Check size={17} />
              我已经理解了
            </button>
            <a href="#/schedule" onClick={() => setLesson(null)}>
              前往课表查看完整历史 →
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
