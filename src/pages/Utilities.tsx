import { QuestionCards } from "../components/QuestionCards";
import { useState } from "react";
import { Shuffle, Copy, RotateCcw, ArrowRight } from "lucide-react";
import { PageHead, Panel } from "../components/UI";
import { useStore } from "../components/context";
import {
  cleanText,
  defaultClean,
  draw,
  copy,
  type CleanOptions,
} from "../utils/logic";
export function RandomTool() {
  const { toast, data, update } = useStore();
  const [mode, setMode] = useState("range");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(30);
  const [text, setText] = useState(
    (data.preferences.legacyQuestions ?? []).join("\n"),
  );
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(true);
  const [pool, setPool] = useState<string[] | null>(null);
  const [initial, setInitial] = useState(0);
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [drawn, setDrawn] = useState(0);
  const reset = () => {
    setPool(null);
    setResult([]);
    setDrawn(0);
    setInitial(0);
    setError("");
  };
  const pick = () => {
    let all = pool;
    if (!all) {
      if (mode === "range") {
        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          end < start ||
          end - start > 9999
        ) {
          setError("请输入有效整数范围，最多 10,000 道题。");
          return;
        }
        all = Array.from({ length: end - start + 1 }, (_, i) =>
          String(start + i),
        );
      } else
        all = [
          ...new Set(
            text
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ];
      if (!all.length) {
        setError("请先输入题目范围或题目列表。");
        return;
      }
      setInitial(all.length);
    }
    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      setError("抽取数量需为 1–1,000 的整数。");
      return;
    }
    if (!all.length) {
      setError("题池已抽完，请重新开始。");
      return;
    }
    setError("");
    if (unique) {
      const r = draw(all, count);
      setPool(r.remaining);
      setResult(r.picked);
      setDrawn((n) => n + r.picked.length);
      if (count > all.length) toast(`剩余不足，已抽取全部 ${all.length} 项`);
    } else {
      setPool(all);
      setResult(
        Array.from(
          { length: count },
          () => all![Math.floor(Math.random() * all!.length)],
        ),
      );
      setDrawn((n) => n + count);
    }
  };
  return (
    <>
      <PageHead
        eyebrow="A LITTLE RANDOMNESS"
        title="随机抽题器"
        description="抽一道练练，想好再看答案"
      />
      <div className="tabs random-modes" aria-label="抽题方式">
        {[
          ["range", "按题号抽"],
          ["list", "粘贴题目"],
          ["cards", "我的题库"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={mode === value ? "active" : ""}
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              reset();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "cards" ? (
        <QuestionCards />
      ) : (
        <div className="two-columns random-workspace">
          <Panel title="抽题设置">
            <div className="form">
              {mode === "range" ? (
                <div className="form-grid">
                  <label>
                    起始题号
                    <input
                      type="number"
                      value={start}
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        setStart(Number(inputValue));
                        reset();
                      }}
                    />
                  </label>
                  <label>
                    结束题号
                    <input
                      type="number"
                      value={end}
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        setEnd(Number(inputValue));
                        reset();
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label>
                  每行一个项目
                  <textarea
                    rows={9}
                    placeholder="粘贴题目或知识点，每行一项"
                    value={text}
                    onChange={(e) => {
                      const inputValue = e.target.value;

                      setText(inputValue);
                      const lines = inputValue.split("\n");
                      void update((d) => ({
                        ...d,
                        preferences: {
                          ...d.preferences,
                          legacyQuestions: lines,
                        },
                      }));
                      reset();
                    }}
                  />
                </label>
              )}
              <label>
                每次抽取
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setCount(Number(inputValue));
                  }}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={unique}
                  onChange={(e) => {
                    const inputChecked = (e.target as HTMLInputElement).checked;
                    setUnique(inputChecked);
                    reset();
                  }}
                />
                不重复抽取
              </label>
              {error && (
                <p role="alert" className="warning">
                  {error}
                </p>
              )}
              <div className="inline">
                <button
                  className="primary"
                  disabled={unique && pool?.length === 0}
                  onClick={pick}
                >
                  <Shuffle size={18} />
                  {count === 1 ? "抽一题" : `抽 ${count} 题`}
                </button>
                <button onClick={reset}>
                  <RotateCcw size={16} />
                  重新开始
                </button>
              </div>
            </div>
          </Panel>
          <section className="panel draw-panel">
            <h2>抽取结果</h2>
            <div className="draw-results">
              {result.length ? (
                result.map((r, i) => <span key={i}>{r}</span>)
              ) : (
                <span className="draw-placeholder">?</span>
              )}
            </div>
            <p className="muted">
              已抽 {drawn} 项 ·{" "}
              {pool === null
                ? "输入题号或题目后开始抽取"
                : unique
                  ? `剩余 ${pool.length} / ${initial} 项`
                  : `可选 ${initial} 项（允许重复）`}
            </p>
            <button
              disabled={!result.length}
              onClick={() =>
                void copy(result.join("\n"))
                  .then(() => toast("结果已复制"))
                  .catch((e) => toast(String(e)))
              }
            >
              <Copy size={16} />
              复制结果
            </button>
          </section>
        </div>
      )}
    </>
  );
}
const labels: Record<keyof CleanOptions, string> = {
  spaces: "去除多余连续空格",
  trim: "清理首尾空格",
  pdf: "合并 PDF 多余换行（请核对）",
  cjk: "规范中英文间空格",
  punctuation: "规范中文语境常见标点",
  width: "全角转半角（含标点）",
  blank: "清理重复空行",
};
export function TextTool() {
  const { toast } = useStore();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState(defaultClean);
  const [previous, setPrevious] = useState<{
    input: string;
    output: string;
  } | null>(null);
  return (
    <>
      <PageHead
        eyebrow="LESS CLUTTER, MORE CLARITY"
        title="文本与中英文标点整理"
        description="整理标点、空格和换行，文字只在本地处理"
      />
      <section className="panel">
        <div className="clean-options">
          {(Object.keys(labels) as (keyof CleanOptions)[]).map((k) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={options[k]}
                onChange={(e) => {
                  const inputChecked = (e.target as HTMLInputElement).checked;
                  return setOptions({ ...options, [k]: inputChecked });
                }}
              />
              {labels[k]}
            </label>
          ))}
        </div>
        <p className="footnote">
          默认保守处理。PDF
          换行、全半角与标点转换需手动开启；代码、公式和特殊排版请保留原文并核对结果。
        </p>
      </section>
      <div className="text-workspace">
        <section className="panel">
          <div className="panel-head">
            <h2>原文</h2>
            <span className="muted">{input.length} 字符</span>
          </div>
          <textarea
            aria-label="原文"
            placeholder="把需要整理的文字粘贴到这里…"
            value={input}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setInput(inputValue);
            }}
          />
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>整理结果</h2>
            <span className="muted">{output.length} 字符</span>
          </div>
          <textarea
            aria-label="整理结果"
            placeholder="整理后的内容将在这里显示"
            value={output}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setOutput(inputValue);
            }}
          />
        </section>
      </div>
      <div className="toolbar">
        <div className="inline">
          <button
            className="primary"
            onClick={() => {
              setPrevious({ input, output });
              setOutput(cleanText(input, options));
              toast("整理完成，请核对后复制");
            }}
          >
            开始整理 <ArrowRight size={17} />
          </button>
          <button
            disabled={!output}
            onClick={() =>
              void copy(output)
                .then(() => toast("已复制整理结果"))
                .catch((e) => toast(String(e)))
            }
          >
            <Copy size={16} />
            复制结果
          </button>
        </div>
        <div className="inline">
          <button
            disabled={!previous}
            onClick={() => {
              if (previous) {
                setInput(previous.input);
                setOutput(previous.output);
                setPrevious(null);
              }
            }}
          >
            撤销
          </button>
          <button
            onClick={() => {
              setPrevious({ input, output });
              setInput("");
              setOutput("");
            }}
          >
            清空
          </button>
        </div>
      </div>
    </>
  );
}
