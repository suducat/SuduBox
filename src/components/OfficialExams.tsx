import { useState } from "react";
import { officialExams } from "../data/exam-presets";
import { officialStatus } from "../utils/exams";
import { useStore } from "./context";
import { Panel } from "./UI";
export function OfficialExams({ home = false }: { home?: boolean }) {
  const { data, update, now } = useStore();
  const p = data.preferences;
  const [board, setBoard] = useState("全部考试局");
  const [season, setSeason] = useState("全部考季");
  const [subject, setSubject] = useState("全部科目");
  const [region, setRegion] = useState("");
  const [history, setHistory] = useState(false);
  const [focused, setFocused] = useState(false);
  const toggle = (
    key: "officialIgnored" | "officialPinned" | "officialFollowed",
    id: string,
  ) =>
    void update((d) => ({
      ...d,
      preferences: {
        ...d.preferences,
        [key]: (d.preferences[key] ?? []).includes(id)
          ? d.preferences[key]?.filter((x) => x !== id)
          : [...(d.preferences[key] ?? []), id],
      },
    }));
  if (home) {
    const rows = officialExams
      .filter(
        (e) =>
          p.officialPinned?.includes(e.id) &&
          !p.officialIgnored?.includes(e.id) &&
          officialStatus(e, now) !== "已结束",
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    return rows.length ? (
      <Panel title="关注的官方考试日期">
        {rows.map((e) => (
          <a className="exam-mini" href="#/exams" key={e.id}>
            <span>
              {e.name}
              <small>
                {e.board} · {e.region}
              </small>
            </span>
            <b>{officialStatus(e, now)}</b>
          </a>
        ))}
      </Panel>
    ) : null;
  }
  if (p.officialHidden)
    return (
      <button
        onClick={() =>
          void update((d) => ({
            ...d,
            preferences: { ...d.preferences, officialHidden: false },
          }))
        }
      >
        显示官方考试预设
      </button>
    );
  const rows = officialExams
    .filter(
      (e) =>
        (board === "全部考试局" || e.board === board) &&
        (season === "全部考季" || e.season === season) &&
        (subject === "全部科目" || e.subject === subject) &&
        (e.board !== "Cambridge International" || region === "Zone 5") &&
        !p.officialIgnored?.includes(e.id) &&
        (!focused || p.officialFollowed?.includes(e.id)) &&
        (history
          ? officialStatus(e, now) === "已结束"
          : officialStatus(e, now) !== "已结束"),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Panel title="官方考试预设">
      <p>
        已核对 2026 年尚未结束与 2027
        年部分安排。先选考试局、科目和区域；这里不是个人准考证，不会覆盖自定义考试。具体到场时间以学校通知为准。
      </p>
      <div className="toolbar">
        <select
          aria-label="官方考试局"
          value={board}
          onChange={(e) => {
            const inputValue = e.target.value;

            setBoard(inputValue);
            setSeason("全部考季");
            setSubject("全部科目");
          }}
        >
          {[
            "全部考试局",
            "College Board",
            "Cambridge International",
            "Pearson Edexcel",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="官方考季"
          value={season}
          onChange={(e) => {
            const inputValue = e.target.value;

            return setSeason(inputValue);
          }}
        >
          <option>全部考季</option>
          {[
            ...new Set(
              officialExams
                .filter((e) => board === "全部考试局" || e.board === board)
                .map((e) => e.season),
            ),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="官方考试科目"
          value={subject}
          onChange={(e) => {
            const inputValue = e.target.value;

            return setSubject(inputValue);
          }}
        >
          <option>全部科目</option>
          {[
            ...new Set(
              officialExams
                .filter((e) => board === "全部考试局" || e.board === board)
                .map((e) => e.subject),
            ),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {board === "Cambridge International" && (
          <select
            aria-label="学校行政区"
            value={region}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setRegion(inputValue);
            }}
          >
            <option value="">请选择行政区</option>
            <option value="Zone 5">Zone 5（本版本已收录）</option>
            <option value="other">其他区域（具体日期待核实）</option>
          </select>
        )}
      </div>
      {board === "Cambridge International" && region !== "Zone 5" && (
        <p>
          已发布 November 2026 与 June 2027
          各行政区官方表。尚未选择或未收录的区域不显示个人日期，请到
          <a
            href="https://www.cambridgeinternational.org/timetables"
            target="_blank"
            rel="noreferrer"
          >
            考试局官网
          </a>
          核对。
        </p>
      )}
      <div className="inline">
        <button onClick={() => setHistory(!history)}>
          {history ? "返回未来考试" : "查看已结束预设"}
        </button>
        <button onClick={() => setFocused(!focused)}>
          {focused ? "显示全部" : "仅看关注"}
        </button>
        <button
          onClick={() =>
            void update((d) => ({
              ...d,
              preferences: { ...d.preferences, officialHidden: true },
            }))
          }
        >
          隐藏预设区域
        </button>
        <button
          onClick={() =>
            void update((d) => ({
              ...d,
              preferences: { ...d.preferences, officialIgnored: [] },
            }))
          }
        >
          恢复不关注项目
        </button>
      </div>
      <div className="official-list">
        {rows
          .filter(
            (e) =>
              subject !== "全部科目" ||
              e.precision === "range" ||
              (board !== "全部考试局" && subject !== "全部科目"),
          )
          .map((e) => (
            <article className="list-row" key={e.id}>
              <div>
                <strong>
                  {e.name} · {e.kind}
                </strong>
                <small>
                  {e.board} · {e.season} · {e.region}
                </small>
                <small>
                  {e.date}
                  {e.end ? " — " + e.end : ""} · {e.session} · 日期精度：
                  {e.precision === "range" ? "范围" : "日"} ·{" "}
                  {officialStatus(e, now)}
                </small>
                <small>
                  最后核对 {e.checked} ·{" "}
                  <a href={e.source} target="_blank" rel="noreferrer">
                    官方来源
                  </a>
                </small>
                <div className="inline">
                  <button onClick={() => toggle("officialFollowed", e.id)}>
                    {p.officialFollowed?.includes(e.id)
                      ? "取消关注"
                      : "关注科目/单元"}
                  </button>
                  <button onClick={() => toggle("officialPinned", e.id)}>
                    {p.officialPinned?.includes(e.id)
                      ? "从首页移除"
                      : "固定到首页"}
                  </button>
                  <button onClick={() => toggle("officialIgnored", e.id)}>
                    不关注
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
      {subject === "全部科目" && (
        <p className="footnote">
          选择科目后显示已核实的具体试卷日期；当前仅展示考季概览。未收录科目与考季的具体日期待核实，不估算。AP
          补考与常规日期分开，Session 时刻依地区与学校确认。
        </p>
      )}
    </Panel>
  );
}
