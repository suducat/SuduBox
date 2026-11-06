import { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Star, Eye, EyeOff } from "lucide-react";
import { formulas, type Formula } from "../data/formulas";
import { useStore } from "../components/context";
import { PageHead, Empty, Modal } from "../components/UI";
function MathView({ value }: { value: string }) {
  return (
    <div
      className="math"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(value, {
          throwOnError: false,
          displayMode: true,
          trust: false,
        }),
      }}
    />
  );
}
export default function Formulas() {
  const { data, update } = useStore();
  const [system, setSystem] = useState("AP");
  const [subject, setSubject] = useState("全部学科");
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [selected, setSelected] = useState<Formula | null>(null);
  const [topic, setTopic] = useState("全部主题");
  const topics = [
    ...new Set(
      formulas
        .filter((f) => subject === "全部学科" || f.subject === subject)
        .map((f) => f.topic),
    ),
  ];
  const list = formulas.filter(
    (f) =>
      f.systems.includes(system) &&
      (subject === "全部学科" || f.subject === subject) &&
      (topic === "全部主题" || f.topic === topic) &&
      (!onlyFav || data.favorites.includes(f.id)) &&
      `${f.name} ${f.variables} ${f.keywords} ${f.topic}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const favorite = (id: string) =>
    void update((d) => ({
      ...d,
      favorites: d.favorites.includes(id)
        ? d.favorites.filter((x) => x !== id)
        : [...d.favorites, id],
    }));
  return (
    <>
      <PageHead
        eyebrow="SMALL FORMULAS, BIG IDEAS"
        title="学术公式表"
        description="常用公式，按科目快速查"
      />
      <div className="toolbar">
        <div className="tabs">
          {["AP", "A-Level"].map((s) => (
            <button
              className={system === s ? "active" : ""}
              onClick={() => setSystem(s)}
              key={s}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          aria-label="搜索公式"
          placeholder="搜索公式、变量或关键词…"
          value={q}
          onChange={(e) => {
            const inputValue = e.target.value;

            return setQ(inputValue);
          }}
        />
      </div>
      <div className="toolbar">
        <div className="inline">
          <select
            aria-label="学科"
            value={subject}
            onChange={(e) => {
              const inputValue = e.target.value;

              setSubject(inputValue);
              setTopic("全部主题");
            }}
          >
            {["全部学科", "Mathematics", "Physics", "Economics"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="主题"
            value={topic}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setTopic(inputValue);
            }}
          >
            <option>全部主题</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button
            className={onlyFav ? "active" : ""}
            onClick={() => setOnlyFav(!onlyFav)}
          >
            <Star size={16} />
            仅看收藏
          </button>
        </div>
        <button onClick={() => setHidden(!hidden)}>
          {hidden ? <Eye size={16} /> : <EyeOff size={16} />}{" "}
          {hidden ? "显示公式" : "隐藏公式自测"}
        </button>
      </div>
      {list.length ? (
        <div className="formula-grid">
          {list.map((f) => (
            <article className="panel formula-card" key={f.id}>
              <div className="inline between">
                <span className="badge">
                  {f.subject} · {f.topic}
                </span>
                <button
                  aria-label="收藏公式"
                  className={`icon-button ${data.favorites.includes(f.id) ? "accent" : ""}`}
                  onClick={() => favorite(f.id)}
                >
                  <Star
                    size={18}
                    fill={
                      data.favorites.includes(f.id) ? "currentColor" : "none"
                    }
                  />
                </button>
              </div>
              <h2>{f.name}</h2>
              {hidden ? (
                <button
                  className="hidden-formula"
                  onClick={() => setSelected(f)}
                >
                  回忆一下，再点击查看
                </button>
              ) : (
                <MathView value={f.expression} />
              )}
              <p>{f.description}</p>
              <button className="text-button" onClick={() => setSelected(f)}>
                查看变量与适用条件 →
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="暂时没有匹配的公式"
          description="试试其他关键词或分类，更多章节内容持续完善中。"
        />
      )}
      <p className="footnote">
        当前收录 {formulas.length} 条学习公式，用于辅助学习，不代表完整覆盖 AP
        或 A-Level 官方课程。A-Level
        标为通用参考，不代表任何考试局完整考纲，也不是可携入考场的材料。
      </p>
      {selected && (
        <Modal title={selected.name} close={() => setSelected(null)}>
          <MathView value={selected.expression} />
          <dl className="formula-detail">
            <dt>课程归属</dt>
            <dd>{selected.course}</dd>
            <dt>核对来源</dt>
            <dd>
              <a href={selected.source?.url} target="_blank" rel="noreferrer">
                {selected.source?.title}
              </a>{" "}
              · {selected.checked}
            </dd>
            <dt>变量含义</dt>
            <dd>{selected.variables}</dd>
            <dt>单位</dt>
            <dd>{selected.units}</dd>
            <dt>适用条件</dt>
            <dd>{selected.conditions}</dd>
            {selected.example && (
              <>
                <dt>原创例题</dt>
                <dd>{selected.example}</dd>
              </>
            )}
            <dt>理解与提醒</dt>
            <dd>{selected.description}</dd>
            {selected.variation && (
              <>
                <dt>相关形式</dt>
                <dd>
                  <MathView value={selected.variation} />
                </dd>
              </>
            )}
          </dl>
          <button onClick={() => favorite(selected.id)}>
            <Star size={16} />
            {data.favorites.includes(selected.id) ? "取消收藏" : "收藏公式"}
          </button>
        </Modal>
      )}
    </>
  );
}
