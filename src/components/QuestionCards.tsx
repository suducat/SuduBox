import { useState, useRef } from "react";
import { useStore } from "./context";
import { Panel, Modal, Confirm } from "./UI";
import { SafeForm } from "./SafeForm";
import { uid } from "../types";
import { draw } from "../utils/logic";
export function QuestionCards() {
  const { data, update, toast } = useStore();
  const bank = data.preferences.questionBank ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [used, setUsed] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const lock = useRef(false);
  const item = bank.find((x) => x.id === current);
  return (
    <Panel title="我的题库">
      {(data.preferences.legacyQuestions ?? []).some((s) => s.trim()) && (
        <button
          onClick={async () => {
            if (
              await update((d) => {
                const bank = d.preferences.questionBank ?? [];
                const seen = new Set(bank.map((q) => q.question));
                const rows = (d.preferences.legacyQuestions ?? [])
                  .map((x) => x.trim())
                  .filter((x) => x && !seen.has(x) && !!seen.add(x))
                  .map((question) => ({ id: uid(), question, answer: "" }));
                return {
                  ...d,
                  preferences: {
                    ...d.preferences,
                    questionBank: [...bank, ...rows],
                  },
                };
              })
            )
              toast("旧列表已导入为题目卡，答案留空，原列表保留");
          }}
        >
          将已保存列表转为题目卡
        </button>
      )}
      {!bank.length && <p>添加题目和答案，随时抽一题复习。</p>}
      <div className="inline">
        <button
          onClick={() => {
            setEditingId(null);
            setQuestion("");
            setAnswer("");
            setEdit(true);
          }}
        >
          添加题目卡
        </button>
        <button
          disabled={used.length >= bank.length}
          onClick={() => {
            const r = draw(
              bank.filter((x) => !used.includes(x.id)).map((x) => x.id),
              1,
            );
            if (r.picked[0]) {
              setCurrent(r.picked[0]);
              setUsed([...used, r.picked[0]]);
              setShow(false);
            }
          }}
        >
          {current ? "下一题" : "开始抽题"}
        </button>
        <button
          onClick={() => {
            setUsed([]);
            setCurrent(null);
            setShow(false);
          }}
        >
          重新开始
        </button>
      </div>
      <p>
        已抽 {used.length} · 剩余 {bank.length - used.length}
      </p>
      {item && (
        <>
          <p className="pre-wrap">{item.question}</p>
          <button onClick={() => setShow(!show)}>
            {show ? "收起答案" : "显示答案"}
          </button>
          {show && (
            <p className="pre-wrap">{item.answer || "这道题暂未填写答案"}</p>
          )}
        </>
      )}
      <details>
        <summary>题目列表（{bank.length}）</summary>
        {bank.map((q) => (
          <div className="list-row" key={q.id}>
            <span>{q.question.slice(0, 60)}</span>
            <div className="inline">
              <button
                aria-label="编辑题目卡"
                onClick={() => {
                  setEditingId(q.id);
                  setQuestion(q.question);
                  setAnswer(q.answer);
                  setEdit(true);
                }}
              >
                编辑
              </button>
              <button aria-label="删除题目卡" onClick={() => setDeleting(q.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </details>
      {deleting && (
        <Confirm
          title="删除题目卡"
          description="删除后不能撤销，请先确认已备份。"
          close={() => setDeleting(null)}
          onConfirm={async () => {
            if (
              await update((d) => ({
                ...d,
                preferences: {
                  ...d.preferences,
                  questionBank: d.preferences.questionBank?.filter(
                    (q) => q.id !== deleting,
                  ),
                },
              }))
            ) {
              setUsed((u) => u.filter((id) => id !== deleting));
              if (current === deleting) setCurrent(null);
              setDeleting(null);
            }
          }}
        />
      )}
      {edit && (
        <Modal title="添加题目卡" close={() => setEdit(false)}>
          <SafeForm
            className="form"
            onSubmit={async () => {
              if (lock.current || !question.trim()) return;
              lock.current = true;
              try {
                const entry = {
                  id: editingId ?? uid(),
                  question: question.trim(),
                  answer: answer.trim(),
                };
                if (
                  await update((d) => ({
                    ...d,
                    preferences: {
                      ...d.preferences,
                      questionBank: [
                        ...(d.preferences.questionBank ?? []).filter(
                          (q) => q.id !== entry.id,
                        ),
                        entry,
                      ],
                    },
                  }))
                ) {
                  setEdit(false);
                  toast("题目卡已保存");
                }
              } finally {
                lock.current = false;
              }
            }}
          >
            <label>
              题目
              <textarea
                required
                value={question}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setQuestion(inputValue);
                }}
              />
            </label>
            <label>
              参考答案／解析（选填）
              <textarea
                value={answer}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setAnswer(inputValue);
                }}
              />
            </label>
            <button className="primary">保存题目卡</button>
          </SafeForm>
        </Modal>
      )}
    </Panel>
  );
}
