import { useState } from "react";
import { trackUsage } from "../utils/analytics";
import { DoorOpen, ArrowUpRight, Clock3 } from "lucide-react";
import { Empty, PageHead } from "../components/UI";
import { useStudyRooms } from "../components/useStudyRooms";
import {
  studyRoomsForSlot,
  studyRoomData,
  type RoomSlot,
} from "../utils/study-rooms";

const days = ["周一", "周二", "周三", "周四", "周五"];
const slotLabel = (id: string) => (id === "Lunch" ? "午休" : `第 ${id} 节`);

export function StudyRoomsCard() {
  const state = useStudyRooms();
  return (
    <a href="#/study-rooms" className="panel tool-card">
      <div className="inline between">
        <div className="quick-icon">
          <DoorOpen size={24} />
        </div>
        <ArrowUpRight size={18} />
      </div>
      <h3>自习室查询</h3>
      <small>Study Rooms</small>
      <p>自动查询当前可用自习室</p>
      <strong>
        {state.slot ? `${state.rooms.length} 间可用` : "暂无安排"}
      </strong>
      {state.inBreak && <p className="muted">当前处于课间 · 显示下一节</p>}
    </a>
  );
}

function nextStatus(room: string, next?: RoomSlot) {
  const available = next?.available[studyRoomData.rooms.indexOf(room)];
  if (available === true) return { text: "下时段空闲，仍可用", kind: "free" };
  if (available === false) return { text: "下时段有安排", kind: "occupied" };
  return { text: "后续暂无安排数据", kind: "unknown" };
}

export default function StudyRooms() {
  const automatic = useStudyRooms();
  const [manual, setManual] = useState(false);
  const [day, setDay] = useState(() => {
    const value = new Date(Date.now() + 8 * 3600000).getUTCDay();
    return value >= 1 && value <= 5 ? value : 1;
  });
  const [period, setPeriod] = useState(() => automatic.slot?.id ?? "1");
  const selected = studyRoomsForSlot(day, period);
  const result = manual ? selected : automatic;
  const hasData = !!result.slot;
  const chooseDay = (value: number) => {
    setDay(value);
    trackUsage("study-rooms.manual-query");
  };
  const choosePeriod = (value: string) => {
    setPeriod(value);
    trackUsage("study-rooms.manual-query");
  };
  return (
    <div className="study-rooms-page">
      <PageHead title="自习室查询" description="找一间空教室，安心自习。" />
      <section className="panel study-rooms-controls" aria-label="查询设置">
        <div className="tabs" aria-label="查询方式">
          <button
            aria-pressed={!manual}
            className={!manual ? "active" : ""}
            onClick={() => setManual(false)}
          >
            自动查询
          </button>
          <button
            aria-pressed={manual}
            className={manual ? "active" : ""}
            onClick={() => {
              if (!manual) trackUsage("study-rooms.manual-query");
              setManual(true);
            }}
          >
            按课表查询
          </button>
        </div>
        {manual ? (
          <div className="study-rooms-pickers">
            <label>
              星期
              <select
                value={day}
                onChange={(e) => chooseDay(Number(e.target.value))}
              >
                {days.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              时段
              <select
                value={period}
                onChange={(e) => choosePeriod(e.target.value)}
              >
                {selected.periods.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slotLabel(slot.id)} · {slot.start}–{slot.end}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p className="study-rooms-clock">
            <Clock3 size={16} aria-hidden="true" />
            {automatic.weekday} · {automatic.time.slice(0, 5)}
            <span>北京时间</span>
          </p>
        )}
      </section>
      <section className="study-rooms-results" aria-label="自习室查询结果">
        <div className="study-rooms-result-head">
          <div>
            <h2>
              可用自习室{" "}
              {hasData && (
                <span className="study-rooms-count">
                  {result.rooms.length}
                  <small> 间</small>
                </span>
              )}
            </h2>
            <p>
              {result.weekday}
              {result.slot
                ? ` · ${!manual && automatic.inBreak ? "课间，显示下一节：" : ""}${slotLabel(result.slot.id)} · ${result.slot.start}–${result.slot.end}`
                : " · 暂无安排"}
            </p>
          </div>
          {!manual && <span className="badge">每 15 秒自动更新</span>}
        </div>
        {hasData ? (
          result.rooms.length ? (
            <div className="study-rooms-grid">
              {result.rooms.map((room) => {
                const status = nextStatus(room.id, result.nextSlot);
                return (
                  <article
                    className="panel study-room"
                    key={room.id}
                    aria-label={`教室 ${room.id}`}
                  >
                    <div className="study-room-heading">
                      <DoorOpen size={23} aria-hidden="true" />
                      <h3>{room.id}</h3>
                    </div>
                    <p className={`study-room-next ${status.kind}`}>
                      <span aria-hidden="true" />
                      {status.text}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="这个时段暂无可用自习室"
              description="可以选择其他星期或时段再看看。"
            />
          )
        ) : (
          <Empty
            title="当前时段暂无自习室安排数据"
            description="可切换“按课表查询”，查看上课时段的空闲教室。"
          />
        )}
      </section>
      <footer className="study-rooms-footer">
        {result.slot?.inferred && (
          <p className="footnote">
            午休查询区间依据前后课时采用，原表未明确午休起止时间。
          </p>
        )}
        <p className="footnote">
          根据学校自习室安排表生成，非实时占用监测，临时调课及实际开放情况以学校通知为准。
        </p>
        <small>
          课表版本 {studyRoomData.version} ·{" "}
          {manual ? "固定周课表" : "本地自动查询"}
        </small>
      </footer>
    </div>
  );
}
