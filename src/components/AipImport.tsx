import { electiveModel, chooseSubject } from "../utils/electives";
import { presetCourses, importPreset } from "../utils/school";
import { useRef } from "react";
import { useState } from "react";
import presets from "../data/aip-presets";
import { useStore } from "./context";
import { uid, type Course } from "../types";
import { Modal, Confirm } from "./UI";
import { download, localDate } from "../utils/logic";
export function AipImport() {
  const { data, update, toast } = useStore();
  const [restoring, setRestoring] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const group = data.preferences.aipGroup;
  const id =
    presets.find((p) => p.id === group)?.id ??
    (group?.startsWith("212 B") ? "212B" : group?.slice(0, 3));
  const preset = presets.find((p) => p.id === id);
  if (!preset) return null;
  const model = electiveModel(preset.id);
  const preview = presetCourses(preset.id, selected, () => "preview");
  return (
    <>
      <button
        onClick={() => {
          setSelected(data.preferences.aipSelections?.[preset.id] ?? {});
          setOpen(true);
        }}
      >
        预览真实课表 · {preset.id}
      </button>
      {data.preferences.scheduleRecovery && (
        <button onClick={() => setRestoring(true)}>恢复替换前课表</button>
      )}
      {restoring && (
        <Confirm
          title="恢复课表"
          description="恢复替换前的课程，课堂记录与便签保留。当前课程也会存成新的恢复点。"
          close={() => setRestoring(false)}
          onConfirm={async () => {
            if (lock.current) return;
            lock.current = true;
            try {
              if (
                await update((d) => {
                  const backup = d.preferences.scheduleRecovery;
                  if (!backup) return d;
                  const groups: Record<string, string> = {
                    "211": "211 · AP Accel",
                    "212": "212 · AP Prep",
                    "212B": "212 B 组 · AP Prep",
                    "213": "213 · AL Accel",
                    "214": "214 · AL Prep",
                  };
                  const group = backup.courses.find((c) => c.source)?.source
                    ?.templateId;
                  return {
                    ...d,
                    courses: backup.courses,
                    preferences: {
                      ...d.preferences,
                      aipGrade: group
                        ? (presets.find((p) => p.id === group)?.grade ??
                          d.preferences.aipGrade)
                        : d.preferences.aipGrade,
                      aipGroup: group
                        ? (groups[group] ?? group)
                        : d.preferences.aipGroup,
                      scheduleRecovery: {
                        courses: d.courses,
                        savedAt: Date.now(),
                      },
                    },
                  };
                })
              ) {
                setRestoring(false);
                toast("课表已恢复，原课堂记录仍保留");
              }
            } finally {
              lock.current = false;
            }
          }}
        />
      )}
      {open && (
        <Modal
          title="导入课表预览"
          close={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p>
            {preset.sheet} · 用户指定版本 {preset.version} · 结束日期未知。
            {preset.slots.length}
            个时段，午休另计。教师与原始备注保留在课程备注中。
          </p>
          <p>
            每个选修池选一次，整周同步；不选或该时段没有所选科目时为自习。选中一门会自动取消与它同时上课的其他科目。
          </p>
          {model.sets.map((keys, i) => (
            <fieldset key={keys.join(",")}>
              <legend>选修池 {i + 1}</legend>
              <div className="inline">
                {keys.map((key) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={!!selected["subject:" + key]}
                    onClick={() =>
                      setSelected((s) => chooseSubject(preset.id, s, key))
                    }
                  >
                    {selected["subject:" + key] ? "✓ " : ""}
                    {model.labels.get(key)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div style={{ maxHeight: 350, overflow: "auto" }}>
            {preset.slots.map((slot, index) => {
              const choices = slot.options;
              return (
                <div className="list-row" key={slot.cell}>
                  <div>
                    <strong>
                      周{slot.day} {slot.start}–{slot.end}
                    </strong>
                    <small>
                      {preset.sheet}!{slot.cell}
                    </small>
                    <strong>
                      安排：{preview[index].name} {preview[index].room}
                    </strong>
                    <details>
                      <summary>查看原表候选与备注</summary>
                      <p className="pre-wrap">{slot.raw || "原单元格为空"}</p>
                    </details>
                    {choices.length > 0 && (
                      <small>
                        此时段候选，按上方选修池统一安排；未开设所选科目则自习。
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => {
                const inputChecked = (e.target as HTMLInputElement).checked;
                return setReplace(inputChecked);
              }}
            />
            替换现有课程（否则合并；替换前下载完整备份）
          </label>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              try {
                if (replace)
                  download(
                    `速度工具箱-替换前备份-${localDate()}.json`,
                    JSON.stringify({ app: "SuduBox", version: 1, data }),
                  );
                const ok = await update((d) =>
                  importPreset(d, preset.id, selected, replace, uid),
                );
                if (ok) {
                  toast("已导入课表时段；原课堂记录与便签保留");
                  setOpen(false);
                }
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            确认导入 {preset.slots.length} 个时段
          </button>
          <small>
            同版本合并不会重复添加。修改选修池后可勾选替换重新生成；替换不删除笔记；新课程使用新
            ID，不自动关联旧记录。
          </small>
        </Modal>
      )}
    </>
  );
}
