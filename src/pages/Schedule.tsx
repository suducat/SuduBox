import { schoolState, dayCourses } from "../utils/school";
import { SchoolStatus, SchoolSetup } from "../components/RoundTwo";
import { SafeForm } from "../components/SafeForm";
import { useState } from "react";
import {
  Copy,
  Pencil,
  Trash2,
  NotebookPen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../components/context";
import {
  PageHead,
  AddButton,
  Empty,
  Modal,
  Confirm,
  ColorInput,
} from "../components/UI";
import { localDate, schedule, conflicts } from "../utils/logic";
import { uid, type Course, type Lesson } from "../types";
const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
export default function Schedule() {
  const { data, update, toast, now } = useStore();
  const [setupOpen, setSetupOpen] = useState(false);
  const [view, setView] = useState("week");
  const [offset, setOffset] = useState(0);
  const [edit, setEdit] = useState<Course | null>(null);
  const [remove, setRemove] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [history, setHistory] = useState(false);
  const [error, setError] = useState("");
  const status = schoolState(data, now);
  const schoolNow = status.clock;
  const monday = new Date(schoolNow);
  monday.setDate(
    schoolNow.getDate() - (schoolNow.getDay() || 7) + 1 + offset * 7,
  );
  const dateFor = (day: number) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + day - 1);
    return localDate(d);
  };
  const add = (day = schoolNow.getDay() || 7) => {
    setError("");
    setEdit({
      id: uid(),
      name: "",
      day,
      start: data.preferences.schoolStart,
      end: (() => {
        const m = Math.min(
          1439,
          Number(data.preferences.schoolStart.slice(0, 2)) * 60 +
            Number(data.preferences.schoolStart.slice(3)) +
            45,
        );
        return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      })(),
      room: "",
      note: "",
      color: "#4979e8",
    });
  };
  const openLesson = (course: Course, date: string) => {
    setLesson(
      data.lessons.find((l) => l.courseId === course.id && l.date === date) ?? {
        id: uid(),
        courseId: course.id,
        courseName: course.name,
        date,
        content: "",
        homework: "",
        review: "",
        confused: false,
        resolved: false,
        note: "",
      },
    );
  };
  const saveCourse = async () => {
    if (!edit) return;
    if (!edit.name.trim() || edit.start >= edit.end) {
      setError(
        "请填写课程名称；结束时间必须晚于开始时间。跨午夜课程请拆成两天录入。",
      );
      return;
    }
    if (
      await update((d) => ({
        ...d,
        courses: edit.specificDate
          ? d.courses
          : [
              ...d.courses.filter((c) => c.id !== edit.id),
              { ...edit, name: edit.name.trim() },
            ],
        preferences: edit.specificDate
          ? {
              ...d.preferences,
              specialDays: d.preferences.specialDays?.map((s) =>
                s.date === edit.specificDate
                  ? {
                      ...s,
                      courses: s.courses.map((c) =>
                        c.id === edit.id ? edit : c,
                      ),
                    }
                  : s,
              ),
            }
          : d.preferences,
      }))
    ) {
      setEdit(null);
      toast("课程已保存");
    }
  };
  return (
    <>
      <PageHead
        eyebrow="PLAN YOUR WEEK"
        title="智能课表"
        description="看看现在上什么，下一节去哪儿"
        action={
          <div className="inline">
            <button
              onClick={async () => {
                if (
                  data.preferences.aipIdentity === "yes" ||
                  (await update((d) => ({
                    ...d,
                    preferences: { ...d.preferences, aipIdentity: "yes" },
                  })))
                )
                  setSetupOpen(true);
              }}
            >
              我是 AIP 学生
            </button>
            <AddButton onClick={() => add()}>添加课程</AddButton>
          </div>
        }
      />
      {setupOpen && (
        <Modal title="AIP 课表设置" close={() => setSetupOpen(false)}>
          <SchoolSetup />
        </Modal>
      )}
      <SchoolStatus />
      {data.preferences.aipIdentity !== "yes" && (
        <div className="status-strip">
          <span className="status-dot" />
          <strong>
            {status.current.length
              ? `正在上课 · ${status.current.map((c) => c.name).join(" / ")}`
              : status.next
                ? `下一节 · ${status.next.name}`
                : status.today.length
                  ? "今日课程已结束"
                  : "今天没有课程"}
          </strong>
          <span>
            {status.current.length
              ? `剩余 ${Math.ceil(Number(status.current[0].end.split(":")[0]) * 60 + Number(status.current[0].end.split(":")[1]) - status.minute)} 分钟`
              : status.next
                ? `${Math.ceil(Number(status.next.start.split(":")[0]) * 60 + Number(status.next.start.split(":")[1]) - status.minute)} 分钟后开始`
                : "给自己一点自由安排的时间"}
          </span>
        </div>
      )}
      <div className="toolbar">
        <div className="tabs">
          {[
            ["week", "周视图"],
            ["today", "今天"],
            ["history", "笔记历史"],
          ].map(([id, label]) => (
            <button
              className={view === id ? "active" : ""}
              key={id}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "week" && (
          <div className="inline">
            <button aria-label="上一周" onClick={() => setOffset(offset - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>
              {dateFor(1)} — {dateFor(7)}
            </span>
            <button aria-label="下一周" onClick={() => setOffset(offset + 1)}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setOffset(0)}>本周</button>
          </div>
        )}
      </div>
      {view === "history" ? (
        <div className="stack">
          {data.lessons.length ? (
            data.lessons
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((l) => (
                <button
                  key={l.id}
                  className="list-row text-left"
                  onClick={() => {
                    setHistory(true);
                    setLesson(l);
                  }}
                >
                  <span>
                    <strong>{l.courseName}</strong>
                    <small>
                      {l.date} · {l.content || l.review || "课堂记录"}
                    </small>
                  </span>
                  <span className="badge">
                    {l.confused && !l.resolved
                      ? "待复习"
                      : l.resolved
                        ? "已理解"
                        : "课堂笔记"}
                  </span>
                </button>
              ))
          ) : (
            <Empty
              title="还没有课堂记录"
              description="点击课表中的课程，开始第一条课堂速记。"
            />
          )}
        </div>
      ) : !data.courses.length && !data.preferences.specialDays?.length ? (
        <Empty
          title="把这一周，安排得更轻松"
          description="添加你的第一节课程。每周自动重复，笔记按上课日期独立保存。"
          action={<AddButton onClick={() => add()}>添加第一节课</AddButton>}
        />
      ) : (
        <div className={view === "week" ? "week-grid" : "today-grid"}>
          {(view === "week"
            ? [1, 2, 3, 4, 5, 6, 7]
            : [schoolNow.getDay() || 7]
          ).map((day) => {
            const date = view === "today" ? localDate(schoolNow) : dateFor(day);
            return (
              <section
                className={`day-column ${date === localDate(schoolNow) ? "is-today" : ""}`}
                key={day}
              >
                <header>
                  <strong>{days[day - 1]}</strong>
                  <small>
                    {date.slice(5)}
                    {date === localDate(schoolNow) ? " · 今天" : ""}
                  </small>
                </header>
                <div className="day-content">
                  {dayCourses(data, date)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((c) => (
                      <article
                        className={`course ${status.current.some((x) => x.id === c.id) && date === localDate(schoolNow) ? "in-progress" : ""}`}
                        key={c.id}
                        style={{ "--course": c.color } as React.CSSProperties}
                      >
                        <button
                          className="course-open"
                          onClick={() => openLesson(c, date)}
                        >
                          <small>
                            {c.start} – {c.end}
                          </small>
                          <strong>{c.name}</strong>
                          <span>{c.room || "未设置教室"}</span>
                          {c.teacher && <small>{c.teacher}</small>}
                          {c.note && !c.source && <small>{c.note}</small>}
                          {c.candidates?.length && !c.selectedCandidate ? (
                            <small>编辑课程以选择实际选修</small>
                          ) : null}
                          {data.lessons.some(
                            (l) => l.courseId === c.id && l.date === date,
                          ) && <span className="badge">已有速记</span>}
                        </button>
                        {conflicts(c, data.courses).length > 0 && (
                          <small className="warning">时间有冲突</small>
                        )}
                        <div className="course-actions">
                          <button
                            aria-label="课堂速记"
                            onClick={() => openLesson(c, date)}
                          >
                            <NotebookPen size={14} />
                          </button>
                          <button
                            aria-label="编辑课程"
                            onClick={() => {
                              setError("");
                              setEdit(c);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            aria-label="复制课程"
                            onClick={() => {
                              setError("");
                              setEdit({
                                ...c,
                                id: uid(),
                                name: c.name + "（副本）",
                              });
                            }}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            aria-label="删除课程"
                            onClick={() => setRemove(c)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                  <button className="day-add" onClick={() => add(day)}>
                    ＋ 添加课程
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {edit && (
        <Modal
          title={
            data.courses.some((c) => c.id === edit.id) ? "编辑课程" : "添加课程"
          }
          close={() => setEdit(null)}
        >
          <SafeForm
            onSubmit={(e) => {
              e.preventDefault();
              return saveCourse();
            }}
            className="form"
          >
            <label>
              课程名称
              <input
                autoFocus
                required
                value={edit.name}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, name: inputValue });
                }}
                placeholder="例如 AP Calculus"
              />
            </label>
            <div className="form-grid">
              <label>
                星期
                <select
                  value={edit.day}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, day: Number(inputValue) });
                  }}
                >
                  {days.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                教室（可选）
                <input
                  value={edit.room}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, room: inputValue });
                  }}
                />
              </label>
              <label>
                开始时间
                <input
                  type="time"
                  required
                  value={edit.start}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, start: inputValue });
                  }}
                />
              </label>
              <label>
                结束时间
                <input
                  type="time"
                  required
                  value={edit.end}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, end: inputValue });
                  }}
                />
              </label>
            </div>
            <label>
              备注
              <textarea
                value={edit.note}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, note: inputValue });
                }}
              />
            </label>
            <label>
              课程颜色
              <ColorInput
                value={edit.color}
                onChange={(c) => setEdit({ ...edit, color: c })}
              />
            </label>
            {conflicts(edit, data.courses).length > 0 && (
              <p className="warning">
                与{" "}
                {conflicts(edit, data.courses)
                  .map((c) => c.name)
                  .join("、")}{" "}
                时间重叠。仍可保存，请检查安排。
              </p>
            )}
            {error && (
              <p role="alert" className="warning">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="button" onClick={() => setEdit(null)}>
                取消
              </button>
              <button className="primary">保存课程</button>
            </div>
          </SafeForm>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="删除课程"
          description="课程将从每周课表中移除，已有课堂记录仍然保留。"
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (
              await update((d) => ({
                ...d,
                courses: d.courses.filter((c) => c.id !== remove.id),
                preferences: {
                  ...d.preferences,
                  specialDays: d.preferences.specialDays?.map((s) => ({
                    ...s,
                    courses: s.courses.filter((c) => c.id !== remove.id),
                  })),
                },
              }))
            )
              setRemove(null);
          }}
        />
      )}
      {lesson && (
        <Modal
          title={`${lesson.courseName} · 课堂速记`}
          close={() => {
            setLesson(null);
            setHistory(false);
          }}
        >
          <SafeForm
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await update((d) => ({
                  ...d,
                  lessons: [
                    ...d.lessons.filter((l) => l.id !== lesson.id),
                    lesson,
                  ],
                }))
              ) {
                setLesson(null);
                toast("课堂记录已保存");
              }
            }}
          >
            <p className="muted">{lesson.date} · 笔记仅关联本次课程</p>
            <label>
              课堂内容
              <textarea
                autoFocus
                value={lesson.content}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setLesson({ ...lesson, content: inputValue });
                }}
                placeholder="今天学到了什么？"
              />
            </label>
            <label>
              作业与事项
              <textarea
                value={lesson.homework}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setLesson({ ...lesson, homework: inputValue });
                }}
              />
            </label>
            {lesson.homework && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    await update((d) => ({
                      ...d,
                      notes: [
                        ...d.notes,
                        {
                          id: uid(),
                          text: lesson.homework,
                          subject: lesson.courseName,
                          date: localDate(),
                          pinned: false,
                          done: false,
                          created: Date.now(),
                        },
                      ],
                    }))
                  )
                    toast("作业已添加到今日便签");
                }}
              >
                添加作业到今日便签
              </button>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={lesson.confused}
                onChange={(e) => {
                  const inputChecked = (e.target as HTMLInputElement).checked;
                  return setLesson({
                    ...lesson,
                    confused: inputChecked,
                    resolved: false,
                  });
                }}
              />
              这节课有没听懂的地方
            </label>
            <label>
              需要复习的具体知识点
              <textarea
                value={lesson.review}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setLesson({ ...lesson, review: inputValue });
                }}
                placeholder="记录下来，稍后逐个解决"
              />
            </label>
            {lesson.confused && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={lesson.resolved}
                  onChange={(e) => {
                    const inputChecked = (e.target as HTMLInputElement).checked;
                    return setLesson({ ...lesson, resolved: inputChecked });
                  }}
                />
                已经理解了
              </label>
            )}
            <label>
              补充备注
              <input
                value={lesson.note}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setLesson({ ...lesson, note: inputValue });
                }}
              />
            </label>
            <div className="form-actions">
              {(history || data.lessons.some((l) => l.id === lesson.id)) && (
                <button
                  type="button"
                  className="danger-quiet"
                  onClick={() => {
                    if (confirm("删除这条课堂记录？此操作不可撤销。"))
                      void update((d) => ({
                        ...d,
                        lessons: d.lessons.filter((l) => l.id !== lesson.id),
                      })).then((ok) => {
                        if (ok) setLesson(null);
                      });
                  }}
                >
                  删除记录
                </button>
              )}
              <button className="primary">保存课堂记录</button>
            </div>
          </SafeForm>
        </Modal>
      )}
    </>
  );
}
