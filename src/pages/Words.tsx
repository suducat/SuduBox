import { SafeForm, useAsyncGuard } from "../components/SafeForm";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Volume2,
  Download,
  RotateCw,
  Check,
} from "lucide-react";
import { useStore } from "../components/context";
import { PageHead, AddButton, Empty, Modal, Confirm } from "../components/UI";
import { uid, type Word } from "../types";
import { parseWords, download } from "../utils/logic";
export default function Words() {
  const { data, update, toast } = useStore();
  const bulk = useAsyncGuard();
  const [q, setQ] = useState("");
  const [library, setLibrary] = useState("全部词库");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("new");
  const [edit, setEdit] = useState<Word | null>(null);
  const [remove, setRemove] = useState<Word | null>(null);
  const [importing, setImporting] = useState(false);
  const [raw, setRaw] = useState("");
  const [target, setTarget] = useState("默认词库");
  const [preview, setPreview] = useState<
    { word: string; meaning: string; line: number }[]
  >([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [review, setReview] = useState<Word[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [newLib, setNewLib] = useState<string | null>(null);
  const libraries = [
    ...new Set([...data.libraries, ...data.words.map((w) => w.library)]),
  ];
  const list = data.words
    .filter(
      (w) =>
        (library === "全部词库" || w.library === library) &&
        (status === "all" ||
          (status === "mastered" ? w.mastered : !w.mastered)) &&
        `${w.word} ${w.meaning} ${w.note}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "az"
        ? a.word.localeCompare(b.word)
        : sort === "old"
          ? a.created - b.created
          : b.created - a.created,
    );
  const exportWords = (format: string) => {
    if (format === "json")
      download("速度工具箱-words.json", JSON.stringify(list, null, 2));
    else {
      const quote = (s: string) =>
        `"${s.replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`;
      download(
        "速度工具箱-words.csv",
        "\ufeff单词,释义,词库,备注,掌握状态\n" +
          list
            .map((w) =>
              [
                w.word,
                w.meaning,
                w.library,
                w.note,
                w.mastered ? "已掌握" : "需要复习",
              ]
                .map(quote)
                .join(","),
            )
            .join("\n"),
        "text/csv;charset=utf-8",
      );
    }
  };
  const parse = () => {
    const p = parseWords(
      raw,
      data.words.filter((w) => w.library === target).map((w) => w.word),
    );
    setPreview(p.rows);
    setErrors(p.errors);
    toast(`解析到 ${p.rows.length} 个新单词，忽略 ${p.duplicates} 个重复项`);
  };
  const add = () =>
    setEdit({
      id: uid(),
      word: "",
      meaning: "",
      library: library === "全部词库" ? "默认词库" : library,
      note: "",
      mastered: false,
      created: Date.now(),
    });
  return (
    <>
      <PageHead
        eyebrow="WORDS OPEN WORLDS"
        title="单词本"
        description="把遇到的生词收好，抽空复习"
        action={
          <div className="inline">
            <button
              onClick={() => {
                setImporting(true);
                setPreview([]);
                setErrors([]);
              }}
            >
              批量导入
            </button>
            <AddButton onClick={add}>添加单词</AddButton>
          </div>
        }
      />
      <div className="toolbar">
        <div className="inline">
          <select
            aria-label="词库"
            value={library}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setLibrary(inputValue);
            }}
          >
            <option>全部词库</option>
            {libraries.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button onClick={() => setNewLib("")}>
            <Plus size={16} />
            新词库
          </button>
          <select
            aria-label="掌握状态"
            value={status}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setStatus(inputValue);
            }}
          >
            <option value="all">全部状态</option>
            <option value="review">需要复习</option>
            <option value="mastered">已掌握</option>
          </select>
        </div>
        <div className="inline">
          <input
            aria-label="搜索单词"
            placeholder="搜索单词、释义…"
            value={q}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setQ(inputValue);
            }}
          />
          <select
            aria-label="单词排序"
            value={sort}
            onChange={(e) => {
              const inputValue = e.target.value;

              return setSort(inputValue);
            }}
          >
            <option value="new">最新优先</option>
            <option value="old">最早优先</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>
      <div className="word-summary">
        <span>
          <strong>{list.length}</strong> 个单词{" "}
          <span className="muted">
            · {list.filter((w) => w.mastered).length} 个已掌握
          </span>
        </span>
        <div className="inline">
          <button
            disabled={!list.length}
            onClick={() => {
              const shuffled = list
                .map((w) => ({ w, r: Math.random() }))
                .sort((a, b) => a.r - b.r)
                .map((x) => x.w);
              setReview(shuffled);
              setIndex(0);
              setFlipped(false);
            }}
          >
            <RotateCw size={16} />
            随机卡片复习
          </button>
          <button disabled={!list.length} onClick={() => exportWords("csv")}>
            <Download size={15} />
            CSV
          </button>
          <button disabled={!list.length} onClick={() => exportWords("json")}>
            JSON
          </button>
        </div>
      </div>
      {list.length ? (
        <div className="word-list panel">
          {list.map((w) => (
            <article key={w.id} className="list-row">
              <div className="word-main">
                <strong>{w.word}</strong>
                <span>{w.meaning}</span>
                <small>
                  {w.library}
                  {w.note ? ` · ${w.note}` : ""}
                </small>
              </div>
              <div className="inline">
                <button
                  className={`badge ${w.mastered ? "green" : ""}`}
                  onClick={() =>
                    void update((d) => ({
                      ...d,
                      words: d.words.map((x) =>
                        x.id === w.id ? { ...x, mastered: !x.mastered } : x,
                      ),
                    }))
                  }
                >
                  {w.mastered ? "已掌握" : "需要复习"}
                </button>
                <button
                  className="icon-button"
                  aria-label="朗读单词"
                  onClick={() => {
                    if (!("speechSynthesis" in window)) {
                      toast("设备不支持语音朗读");
                      return;
                    }
                    speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(w.word);
                    u.lang = "en-US";
                    speechSynthesis.speak(u);
                  }}
                >
                  <Volume2 size={17} />
                </button>
                <button
                  aria-label="编辑单词"
                  className="icon-button"
                  onClick={() => setEdit(w)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  aria-label="删除单词"
                  className="icon-button"
                  onClick={() => setRemove(w)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="从一个新单词开始"
          description="快速添加，或粘贴多行单词一次导入。无需在线词典。"
          action={<AddButton onClick={add}>添加单词</AddButton>}
        />
      )}
      <p className="footnote">
        导出当前筛选的单词。
      </p>
      {edit && (
        <Modal title="单词信息" close={() => setEdit(null)}>
          <SafeForm
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!edit.word.trim() || !edit.meaning.trim()) return;
              if (
                data.words.some(
                  (w) =>
                    w.id !== edit.id &&
                    w.library === edit.library &&
                    w.word.toLowerCase() === edit.word.trim().toLowerCase(),
                )
              ) {
                toast("当前词库已有这个单词，请编辑已有记录");
                return;
              }
              if (
                await update((d) => ({
                  ...d,
                  words: [
                    ...d.words.filter((w) => w.id !== edit.id),
                    {
                      ...edit,
                      word: edit.word.trim(),
                      meaning: edit.meaning.trim(),
                    },
                  ],
                }))
              )
                setEdit(null);
            }}
          >
            <label>
              英文单词
              <input
                required
                autoFocus
                value={edit.word}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, word: inputValue });
                }}
              />
            </label>
            <label>
              中文或英文释义
              <textarea
                required
                value={edit.meaning}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, meaning: inputValue });
                }}
              />
            </label>
            <label>
              所属词库
              <select
                value={edit.library}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, library: inputValue });
                }}
              >
                {libraries.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              备注
              <input
                value={edit.note}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setEdit({ ...edit, note: inputValue });
                }}
              />
            </label>
            <button className="primary">保存单词</button>
          </SafeForm>
        </Modal>
      )}
      {newLib !== null && (
        <Modal title="创建词库" close={() => setNewLib(null)}>
          <SafeForm
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newLib.trim();
              if (!name) return;
              if (libraries.includes(name)) {
                toast("词库已存在");
                return;
              }
              if (
                await update((d) => ({
                  ...d,
                  libraries: [...d.libraries, name],
                }))
              ) {
                setLibrary(name);
                setNewLib(null);
              }
            }}
          >
            <label>
              词库名称
              <input
                required
                autoFocus
                value={newLib}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setNewLib(inputValue);
                }}
                placeholder="例如 AP Physics"
              />
            </label>
            <button className="primary">创建词库</button>
          </SafeForm>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="删除单词"
          description={`确定删除 ${remove.word}？此操作不可撤销。`}
          close={() => setRemove(null)}
          onConfirm={async () => {
            if (
              await update((d) => ({
                ...d,
                words: d.words.filter((w) => w.id !== remove.id),
              }))
            )
              setRemove(null);
          }}
        />
      )}
      {importing && (
        <Modal title="单词清洗与批量导入" close={() => setImporting(false)}>
          <div className="form">
            <label>
              导入到词库
              <select
                value={target}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  setTarget(inputValue);
                  setPreview([]);
                }}
              >
                {libraries.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              粘贴单词文本
              <textarea
                rows={7}
                value={raw}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  setRaw(inputValue);
                  setPreview([]);
                }}
                placeholder={
                  "derive 推导\nequilibrium - 均衡\nelasticity: 弹性"
                }
              />
            </label>
            <button onClick={parse}>解析并预览</button>
            {errors.length > 0 && (
              <div role="alert" className="warning">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
                <p>
                  这些行尚未导入，请修改原文后重新解析；也可只导入下面有效项目。
                </p>
              </div>
            )}
            {preview.length > 0 && (
              <>
                <p>预览 {preview.length} 项 · 可直接修改后导入</p>
                <div className="import-preview">
                  {preview.map((r, i) => (
                    <div className="form-grid" key={r.line}>
                      <input
                        aria-label={`第${r.line}行单词`}
                        value={r.word}
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          return setPreview(
                            preview.map((x, j) =>
                              i === j ? { ...x, word: inputValue } : x,
                            ),
                          );
                        }}
                      />
                      <input
                        aria-label={`第${r.line}行释义`}
                        value={r.meaning}
                        onChange={(e) => {
                          const inputValue = e.target.value;

                          return setPreview(
                            preview.map((x, j) =>
                              i === j ? { ...x, meaning: inputValue } : x,
                            ),
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="primary"
                  disabled={bulk.busy}
                  onClick={() =>
                    bulk.run(async () => {
                      if (
                        preview.some((r) => !r.word.trim() || !r.meaning.trim())
                      ) {
                        toast("预览中存在空单词或释义，请补全");
                        return;
                      }
                      const seen = new Set(
                        data.words
                          .filter((w) => w.library === target)
                          .map((w) => w.word.trim().toLowerCase()),
                      );
                      const rows = preview.filter((r) => {
                        const key = r.word.trim().toLowerCase();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });
                      if (
                        await update((d) => ({
                          ...d,
                          words: [
                            ...d.words,
                            ...rows
                              .filter(
                                (r) =>
                                  !d.words.some(
                                    (w) =>
                                      w.library === target &&
                                      w.word.trim().toLowerCase() ===
                                        r.word.trim().toLowerCase(),
                                  ),
                              )
                              .map((r) => ({
                                id: uid(),
                                word: r.word.trim(),
                                meaning: r.meaning.trim(),
                                library: target,
                                note: "",
                                mastered: false,
                                created: Date.now(),
                              })),
                          ],
                        }))
                      ) {
                        toast(`已导入 ${rows.length} 个单词`);
                        setImporting(false);
                        setRaw("");
                      }
                    })
                  }
                >
                  确认导入 {preview.length} 项
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title={`卡片复习 · ${Math.min(index + 1, review.length)} / ${review.length}`}
          close={() => setReview(null)}
        >
          {index < review.length ? (
            <>
              <button
                className="flashcard"
                onClick={() => setFlipped(!flipped)}
              >
                <span className="eyebrow">
                  {flipped ? "DEFINITION" : "VOCABULARY"}
                </span>
                <strong>
                  {flipped ? review[index].meaning : review[index].word}
                </strong>
                <small>点击卡片{flipped ? "返回单词" : "翻转查看释义"}</small>
              </button>
              <div className="form-actions">
                {[false, true].map((mastered) => (
                  <button
                    key={String(mastered)}
                    className={mastered ? "primary" : ""}
                    onClick={async () => {
                      if (
                        await update((d) => ({
                          ...d,
                          words: d.words.map((w) =>
                            w.id === review[index].id ? { ...w, mastered } : w,
                          ),
                        }))
                      ) {
                        setIndex(index + 1);
                        setFlipped(false);
                      }
                    }}
                  >
                    {mastered ? <Check size={17} /> : <RotateCw size={17} />}{" "}
                    {mastered ? "已掌握" : "需要复习"}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Empty
              title="本轮复习完成"
              description="一点一滴，都是积累。"
              action={<button onClick={() => setReview(null)}>完成</button>}
            />
          )}
        </Modal>
      )}
    </>
  );
}
