import { useState } from "react";
import { useStore } from "./context";
import { SafeForm } from "./SafeForm";
import { uid } from "../types";
import { localDate } from "../utils/logic";
export function SpecialDays() {
  const { data, update, toast } = useStore();
  const [date, setDate] = useState(localDate());
  const [closed, setClosed] = useState(false);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("09:40");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [evening, setEvening] = useState(false);
  return (
    <details>
      <summary>日期特殊安排与停课</summary>
      <p className="footnote">
        只影响选定日期，优先于每周规则。停课同时取消当日晚自习。保留周末手动课程。
      </p>
      <SafeForm
        className="form"
        onSubmit={async () => {
          if (!closed && !name.trim()) {
            toast("请填写课程名称或勾选停课");
            return;
          }
          if (!closed && start >= end) {
            toast("结束时间应晚于开始时间");
            return;
          }
          const entry = {
            id: uid(),
            specificDate: date,
            name: name.trim(),
            room,
            start,
            end,
            day: new Date(date + "T12:00:00").getDay() || 7,
            note: "日期特殊安排 " + date,
            color: "#8c6bd4",
          };
          if (
            await update((d) => {
              const existing = d.preferences.specialDays ?? [];
              const old = existing.find((x) => x.date === date);
              return {
                ...d,
                preferences: {
                  ...d.preferences,
                  specialDays: [
                    ...existing.filter((x) => x.date !== date),
                    {
                      date,
                      closed,
                      mode,
                      evening,
                      courses: closed ? [] : [...(old?.courses ?? []), entry],
                    },
                  ],
                },
              };
            })
          ) {
            setName("");
            toast("特殊安排已保存");
          }
        }}
      >
        <label>
          日期
          <input
            type="date"
            required
            value={date}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setDate(inputValue);
            }}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={closed}
            onChange={(e) => {
              const inputChecked = (e.target as HTMLInputElement).checked;
              return setClosed(inputChecked);
            }}
          />
          当天停课
        </label>
        {!closed && (
          <>
            <label>
              每周课程处理
              <select
                value={mode}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setMode(inputValue as "merge" | "replace");
                }}
              >
                <option value="merge">保留每周课程，追加安排</option>
                <option value="replace">仅使用当天特殊课程</option>
              </select>
            </label>
            <label>
              课程名称
              <input
                value={name}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setName(inputValue);
                }}
              />
            </label>
            <label>
              教室（可选）
              <input
                value={room}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setRoom(inputValue);
                }}
              />
            </label>
            <div className="form-grid">
              <label>
                开始
                <input
                  type="time"
                  required
                  value={start}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setStart(inputValue);
                  }}
                />
              </label>
              <label>
                结束
                <input
                  type="time"
                  required
                  value={end}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEnd(inputValue);
                  }}
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={evening}
                onChange={(e) => {
                  const inputChecked = (e.target as HTMLInputElement).checked;
                  return setEvening(inputChecked);
                }}
              />
              当天启用晚自习
            </label>
          </>
        )}
        <button>保存日期安排</button>
      </SafeForm>
      {data.preferences.specialDays?.map((s) => (
        <div className="list-row" key={s.date}>
          <span>
            {s.date} ·{" "}
            {s.closed
              ? "停课"
              : s.courses.map((c) => `${c.start} ${c.name}`).join("、")}
          </span>
          <button
            onClick={() => {
              if (confirm("移除当天特殊安排，恢复每周规则？"))
                void update((d) => ({
                  ...d,
                  preferences: {
                    ...d.preferences,
                    specialDays: d.preferences.specialDays?.filter(
                      (x) => x.date !== s.date,
                    ),
                  },
                }));
            }}
          >
            恢复周规则
          </button>
        </div>
      ))}
    </details>
  );
}
