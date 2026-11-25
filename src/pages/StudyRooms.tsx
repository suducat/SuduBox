import { useState } from "react";
import { SafeForm } from "../components/SafeForm";
import { trackUsage } from "../utils/analytics";
import { DoorOpen, ArrowUpRight } from "lucide-react";
import { Empty, PageHead, Panel } from "../components/UI";
import { useStudyRooms } from "../components/useStudyRooms";
import { studyRoomsBetween, studyRoomData } from "../utils/study-rooms";

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
  const [manual, setManual] = useState(false);
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  );
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [query, setQuery] = useState<{
    date: string;
    start: string;
    end: string;
    result: ReturnType<typeof studyRoomsBetween>;
  } | null>(null);
  const rooms = manual ? (query?.result.rooms ?? []) : state.rooms;
  const hasData = manual ? query?.result.status === "ready" : !!state.slot;
  return (
    <>
      <PageHead
        title="自习室查询"
        description="Study Rooms · 默认自动查询，也可查询指定时间段"
      />
      <div className="settings-stack study-rooms-stack">
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
            onClick={() => setManual(true)}
          >
            手动查询
          </button>
        </div>
        {manual ? (
          <Panel title="手动查询">
            <SafeForm
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                const result = studyRoomsBetween(date, start, end);
                setQuery({ date, start, end, result });
                if (result.status !== "invalid")
                  trackUsage("study-rooms.manual-query");
              }}
            >
              <div className="form-grid">
                <label>
                  查询日期
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  开始时间
                  <input
                    required
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  结束时间
                  <input
                    required
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
              </div>
              <p className="footnote">
                均为北京时间，按现有固定每周课表匹配；只展示整个所选时间段都可用的教室。课间沿用下一节的安排，不含临时调课与节假日调整。
              </p>
              <button className="primary" type="submit">
                查询自习室
              </button>
            </SafeForm>
            {query && (
              <div role="status">
                {query.result.status === "invalid" ? (
                  <p className="warning">{query.result.message}</p>
                ) : (
                  <>
                    <p>
                      查询结果：{query.date} {query.result.weekday} ·{" "}
                      {query.start}–{query.end}（北京时间）
                    </p>
                    {hasData ? (
                      <h2>{rooms.length} 间在所选时间段内均可用</h2>
                    ) : (
                      <p>{query.result.message}</p>
                    )}
                    {query.result.status === "ready" &&
                      query.result.inferred && (
                        <p className="footnote">
                          本次查询包含 Lunch，12:10–14:10
                          依据前后课时边界采用，原表未明确午休起止时间。
                        </p>
                      )}
                  </>
                )}
              </div>
            )}
            <p className="muted">课表数据版本：{studyRoomData.version}</p>
          </Panel>
        ) : (
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
        )}
        {hasData &&
          (rooms.length ? (
            <section>
              <div className="section-title">
                <h2>可用教室</h2>
              </div>
              <p className="muted">
                优先显示连续可用时间较长的教室 · 按编号标识
              </p>
              <div className="tool-grid">
                {rooms.map((room) => (
                  <article className="panel" key={room.id}>
                    <h3>
                      <DoorOpen size={20} aria-hidden="true" /> {room.id}
                    </h3>
                    <p>预计连续可用至 {room.until}</p>
                    {!manual && room.nextOccupied && (
                      <small className="warning">下一时段将被占用</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <Empty
              title={
                manual ? "所选时间段没有连续可用的自习室" : "当前没有可用自习室"
              }
              description={
                manual
                  ? "没有教室能覆盖整个查询时间段，可以尝试缩短时间段。"
                  : "原表中当前时段的教室均有安排。"
              }
            />
          ))}
        <p className="footnote">
          根据学校自习室安排表生成，非实时占用监测，临时调课及实际开放情况以学校通知为准。
        </p>
      </div>
    </>
  );
}
