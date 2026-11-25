import { DoorOpen, ArrowUpRight } from "lucide-react";
import { Empty, PageHead, Panel } from "../components/UI";
import { useStudyRooms } from "../components/useStudyRooms";
import { studyRoomData } from "../utils/study-rooms";

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

export default function StudyRooms() {
  const state = useStudyRooms();
  return (
    <>
      <PageHead
        title="自习室查询"
        description="Study Rooms · 自动查询当前可用自习室"
      />
      <div className="settings-stack study-rooms-stack">
        <Panel title="当前安排">
          <p>
            {state.weekday} · {state.time}（北京时间）
          </p>
          <p>
            {state.slot
              ? `${state.inBreak ? "当前处于课间 · 下一节：" : "当前时段："}${state.slot.id === "Lunch" ? "Lunch 午休" : `第 ${state.slot.id} 节`}（${state.slot.start}–${state.slot.end}）`
              : "当前时段暂无自习室安排数据"}
          </p>
          {state.slot && <h2>{state.rooms.length} 间可用自习室</h2>}
          {state.slot?.inferred && (
            <p className="footnote">
              Lunch 查询区间依据前后课时边界采用，原表未明确午休起止时间。
            </p>
          )}
          <p className="muted">
            每 15 秒自动更新 · 课表数据版本：{studyRoomData.version}
          </p>
        </Panel>
        {state.slot &&
          (state.rooms.length ? (
            <section>
              <div className="section-title">
                <h2>可用教室</h2>
              </div>
              <p className="muted">
                优先显示连续可用时间较长的教室 · 按编号标识
              </p>
              <div className="tool-grid">
                {state.rooms.map((room) => (
                  <article className="panel" key={room.id}>
                    <h3>
                      <DoorOpen size={20} aria-hidden="true" /> {room.id}
                    </h3>
                    <p>预计连续可用至 {room.until}</p>
                    {room.nextOccupied && (
                      <small className="warning">下一时段将被占用</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <Empty
              title="当前没有可用自习室"
              description="原表中当前时段的教室均有安排。"
            />
          ))}
        <Panel title="作息与数据说明">
          {studyRoomData.notes.map((note) => (
            <p className="footnote" key={note}>
              {note}
            </p>
          ))}
          <p className="footnote">
            连续可用时间仅覆盖表内时段，最晚显示至
            17:20；不表示学校正式放学时间。课间展示下一节课的安排，不保证教室在课间已开放。
          </p>
        </Panel>
        <p className="footnote">
          根据学校自习室安排表生成，非实时占用监测，临时调课及实际开放情况以学校通知为准。
        </p>
      </div>
    </>
  );
}
