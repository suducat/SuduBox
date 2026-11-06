import { OfficialExams } from "../components/OfficialExams";
import { SafeForm } from "../components/SafeForm";
import { useState, useEffect, useRef } from "react";
import { Pin, Trash2, Pencil, Check } from "lucide-react";
import { useStore } from "../components/context";
import {
  PageHead,
  AddButton,
  Empty,
  Modal,
  Confirm,
  ColorInput,
} from "../components/UI";
import { localDate, countdown, examTimestamp } from "../utils/logic";
import { uid, type Note, type Exam } from "../types";
function NoteCard({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const { update } = useStore();
  const [text, setText] = useState(note.text);
  const latest = useRef(note.text);
  latest.current = text;
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (document.activeElement !== area.current) setText(note.text);
  }, [note.text]);
  const save = () => {
    if (latest.current !== note.text)
      void update((d) => ({
        ...d,
        notes: d.notes.map((n) =>
          n.id === note.id ? { ...n, text: latest.current } : n,
        ),
      }));
  };
  const change = (patch: Partial<Note>) =>
    void update((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === note.id ? { ...n, ...patch } : n)),
    }));
  return (
    <article className={`note-card ${note.done ? "done" : ""}`}>
      <div className="note-top">
        <button
          aria-label={note.done ? "恢复未完成" : "标记完成"}
          className={`checkbox-button ${note.done ? "checked" : ""}`}
          onClick={() => change({ done: !note.done })}
        >
          {note.done && <Check size={14} />}
        </button>
        <span>{note.date}</span>
        <button
          className={`icon-button ${note.pinned ? "accent" : ""}`}
          aria-label="置顶便签"
          onClick={() => change({ pinned: !note.pinned })}
        >
          <Pin size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="删除便签"
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <textarea
        ref={area}
        autoFocus={!note.text && Date.now() - note.created < 5000}
        aria-label="便签内容（自动保存）"
        placeholder="直接写下想做的事…"
        value={text}
        onChange={(e) => {
          const inputValue = e.target.value;

          const value = inputValue;
          setText(value);
          latest.current = value;
          void update((d) => ({
            ...d,
            notes: d.notes.map((n) =>
              n.id === note.id ? { ...n, text: value } : n,
            ),
          }));
        }}
        onBlur={save}
      />
      <div className="note-bottom">
        <input
          aria-label="关联科目"
          placeholder="＋ 关联科目"
          value={note.subject}
          onChange={(e) => {
            const inputValue = e.target.value;

            return change({ subject: inputValue });
          }}
        />
        <span>自动保存</span>
      </div>
    </article>
  );
}
export function Notes() {
  const { data, update, toast } = useStore();
  const [view, setView] = useState("today");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [remove, setRemove] = useState<Note | null>(null);
  const adding = useRef(false);
  const add = async () => {
    if (adding.current) return;
    adding.current = true;
    const ok = await update((d) => ({
      ...d,
      notes: [
        {
          id: uid(),
          text: "",
          subject: "",
          date: localDate(),
          done: false,
          pinned: false,
          created: Date.now(),
        },
        ...d.notes,
      ],
    }));
    adding.current = false;
    if (ok) toast("便签已创建，直接输入即可");
  };
  const list = data.notes
    .filter(
      (n) =>
        (view === "all" || n.date === localDate()) &&
        `${n.text} ${n.subject}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        Number(a.done) - Number(b.done) ||
        (sort === "new" ? b.created - a.created : a.created - b.created),
    );
  return (
    <>
      <PageHead
        eyebrow="CLEAR YOUR MIND"
        title="每日便签"
        description="作业、提醒，随手记下来"
        action={<AddButton onClick={() => void add()}>添加便签</AddButton>}
      />
      <div className="toolbar">
        <div className="tabs">
          <button
            className={view === "today" ? "active" : ""}
            onClick={() => setView("today")}
          >
            今日便签
          </button>
          <button
            className={view === "all" ? "active" : ""}
            onClick={() => setView("all")}
          >
            全部便签
          </button>
        </div>
        <div className="inline">
          <input
            placeholder="搜索便签或科目"
            value={q}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setQ(inputValue);
            }}
          />
          <select
            aria-label="排序"
            value={sort}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setSort(inputValue);
            }}
          >
            <option value="new">最新优先</option>
            <option value="old">最早优先</option>
          </select>
        </div>
      </div>
      {list.length ? (
        <div className="notes-grid">
          {list.map((n) => (
            <NoteCard key={n.id} note={n} onDelete={() => setRemove(n)} />
          ))}
        </div>
      ) : (
        <Empty
          title="给今天留一点空间"
          description="不用标题，不用分类。直接记下第一件想做的事。"
          action={<AddButton onClick={() => void add()}>写一张便签</AddButton>}
        />
      )}
      {remove && (
        <Confirm
          title="删除便签"
          description="删除后无法撤销，确定移除这张便签吗？"
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (
              await update((d) => ({
                ...d,
                notes: d.notes.filter((n) => n.id !== remove.id),
              }))
            )
              setRemove(null);
          }}
        />
      )}
    </>
  );
}
export function Exams() {
  const { data, update, now, toast } = useStore();
  const [edit, setEdit] = useState<Exam | null>(null);
  const [remove, setRemove] = useState<Exam | null>(null);
  const [history, setHistory] = useState(false);
  const list = data.exams
    .filter((e) =>
      history
        ? e.done || examTimestamp(e) < now.getTime()
        : !e.done && examTimestamp(e) >= now.getTime(),
    )
    .sort((a, b) => examTimestamp(a) - examTimestamp(b));
  return (
    <>
      <PageHead
        eyebrow="MAKE EVERY DAY COUNT"
        title="考试倒计时"
        description="离考试还有多久，一眼就知道"
        action={
          <AddButton
            onClick={() =>
              setEdit({
                id: uid(),
                name: "",
                date: localDate(),
                time: "",
                subject: "",
                color: "#4979e8",
                pinned: true,
                done: false,
              })
            }
          >
            添加考试
          </AddButton>
        }
      />
      <OfficialExams />
      <div className="section-title">
        <h2>我的自定义考试</h2>
      </div>
      <div className="toolbar">
        <div className="tabs">
          <button
            className={!history ? "active" : ""}
            onClick={() => setHistory(false)}
          >
            即将到来
          </button>
          <button
            className={history ? "active" : ""}
            onClick={() => setHistory(true)}
          >
            历史考试
          </button>
        </div>
        <span className="muted">日期按设备本地时区计算</span>
      </div>
      {list.length ? (
        <div className="exam-grid">
          {list.map((e) => (
            <article
              key={e.id}
              className="exam-card"
              style={{ "--course": e.color } as React.CSSProperties}
            >
              <div className="inline between">
                <span className="badge">{e.subject || "自定义考试"}</span>
                <button
                  aria-label="固定到首页"
                  className={`icon-button ${e.pinned ? "accent" : ""}`}
                  onClick={() =>
                    void update((d) => ({
                      ...d,
                      exams: d.exams.map((x) =>
                        x.id === e.id ? { ...x, pinned: !x.pinned } : x,
                      ),
                    }))
                  }
                >
                  <Pin size={16} />
                </button>
              </div>
              <h2>{e.name}</h2>
              <div className="countdown">
                {e.done ? "已完成" : countdown(e, now)}
              </div>
              <p>
                {new Date(`${e.date}T12:00:00`).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}{" "}
                {e.time}
              </p>
              <div className="course-actions">
                <button onClick={() => setEdit(e)}>
                  <Pencil size={15} />
                  编辑
                </button>
                <button
                  onClick={() =>
                    void update((d) => ({
                      ...d,
                      exams: d.exams.map((x) =>
                        x.id === e.id ? { ...x, done: !x.done } : x,
                      ),
                    }))
                  }
                >
                  <Check size={15} />
                  {e.done ? "恢复" : "完成"}
                </button>
                <button aria-label="删除考试" onClick={() => setRemove(e)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={history ? "还没有历史考试" : "下一站，你来决定"}
          description="添加任何一场考试，为自己的目标做好准备。"
        />
      )}
      {edit && (
        <Modal title="考试信息" close={() => setEdit(null)}>
          <SafeForm
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!edit.name.trim()) return;
              if (
                await update((d) => ({
                  ...d,
                  exams: [
                    ...d.exams.filter((x) => x.id !== edit.id),
                    { ...edit, name: edit.name.trim() },
                  ],
                }))
              ) {
                setEdit(null);
                toast("考试已保存");
              }
            }}
          >
            <label>
              考试名称
              <input
                required
                autoFocus
                value={edit.name}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, name: inputValue });
                }}
              />
            </label>
            <div className="form-grid">
              <label>
                考试日期
                <input
                  required
                  type="date"
                  value={edit.date}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, date: inputValue });
                  }}
                />
              </label>
              <label>
                时间（可选）
                <input
                  type="time"
                  value={edit.time}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEdit({ ...edit, time: inputValue });
                  }}
                />
              </label>
            </div>
            <label>
              科目（可选）
              <input
                value={edit.subject}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, subject: inputValue });
                }}
              />
            </label>
            <ColorInput
              value={edit.color}
              onChange={(color) => setEdit({ ...edit, color })}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={edit.pinned}
                onChange={(e) => {
                  const inputChecked = (e.target as HTMLInputElement).checked;
                  return setEdit({ ...edit, pinned: inputChecked });
                }}
              />
              固定到首页
            </label>
            <button className="primary">保存考试</button>
          </SafeForm>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="删除考试"
          description="此操作不可撤销。"
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (
              await update((d) => ({
                ...d,
                exams: d.exams.filter((e) => e.id !== remove.id),
              }))
            )
              setRemove(null);
          }}
        />
      )}
    </>
  );
}
