import presets from "../data/aip-presets";
import { schoolState } from "../utils/school";
import { SpecialDays } from "./SpecialDays";
import { AipImport } from "./AipImport";
import { useState } from "react";
import { useStore } from "./context";
import { Panel, Modal } from "./UI";
import { copy } from "../utils/logic";
export function Feedback() {
  const [open, setOpen] = useState(false);
  const { toast } = useStore();
  return (
    <>
      <button onClick={() => setOpen(true)}>问题反馈</button>
      {open && (
        <Modal title="问题反馈" close={() => setOpen(false)}>
          <p>添加微信时请备注‘速度工具箱反馈’。</p>
          <input
            aria-label="反馈微信号，可手动选择复制"
            readOnly
            value="Alex_AAj"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() =>
              void copy("Alex_AAj")
                .then(() => toast("微信号已复制"))
                .catch(() => toast("无法使用剪贴板，请选中微信号手动复制"))
            }
          >
            复制微信号
          </button>
          <p>
            可以描述问题、操作步骤、设备及浏览器。截图由你决定，不会自动上传任何学习数据。
          </p>
        </Modal>
      )}
    </>
  );
}
export function SchoolSetup() {
  const { data, update, toast } = useStore();
  const p = data.preferences;
  return (
    <Panel title="AIP 身份与作息">
      <label>
        是否为 AIP 学生
        <select
          value={p.aipIdentity ?? ""}
          onChange={(e) => {
            const inputValue = e.target.value;

            return void update((d) => ({
              ...d,
              preferences: {
                ...d.preferences,
                aipIdentity: inputValue as "yes" | "no" | "",
              },
            }));
          }}
        >
          <option value="">请选择身份</option>
          <option value="yes">是</option>
          <option value="no">否，使用手动课表</option>
        </select>
      </label>
      {p.aipIdentity === "yes" && (
        <div className="form">
          <label>
            年级
            <select
              value={
                p.aipGrade?.startsWith("高二")
                  ? "高二（原表 S2）"
                  : (p.aipGrade ?? "")
              }
              onChange={(e) => {
                const inputValue = e.target.value;

                return void update((d) => ({
                  ...d,
                  preferences: {
                    ...d.preferences,
                    aipGrade: inputValue,
                    aipGroup: "",
                  },
                }));
              }}
            >
              <option value="">请选择年级</option>
              <option>高一</option>
              <option>高二（原表 S2）</option>
              <option>高三</option>
            </select>
          </label>
          {p.aipGrade ? (
            <>
              <label>
                班级／分组
                <select
                  value={
                    p.aipGroup?.startsWith("212 B")
                      ? "212B"
                      : presets.some((x) => x.id === p.aipGroup)
                        ? p.aipGroup
                        : (p.aipGroup?.slice(0, 3) ?? "")
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return void update((d) => ({
                      ...d,
                      preferences: {
                        ...d.preferences,
                        aipGroup: inputValue,
                      },
                    }));
                  }}
                >
                  <option value="">请选择分组</option>
                  {presets
                    .filter(
                      (preset) =>
                        preset.grade ===
                        (p.aipGrade?.startsWith("高二") ? "高二" : p.aipGrade),
                    )
                    .map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.id}
                      </option>
                    ))}
                </select>
              </label>
              <p>
                按所选班级显示原表版本和课程，确认预览后导入。选修池只需选择一次。
              </p>
            </>
          ) : (
            p.aipGrade && <p>该年级课表尚未提供，可手动创建。</p>
          )}
          {p.aipGrade && <AipImport key={p.aipGroup} />}
          <SpecialDays />
          <label>
            课表时区
            <input
              key={p.aipTimezone ?? "Asia/Shanghai"}
              defaultValue={p.aipTimezone ?? "Asia/Shanghai"}
              onBlur={(e) => {
                const zone = e.target.value.trim();
                try {
                  new Intl.DateTimeFormat("en", { timeZone: zone }).format();
                  void update((d) => ({
                    ...d,
                    preferences: { ...d.preferences, aipTimezone: zone },
                  }));
                } catch {
                  toast("时区无效，未保存。请填写 Asia/Shanghai 等 IANA 时区");
                  e.target.value = p.aipTimezone ?? "Asia/Shanghai";
                }
              }}
            />
          </label>
          <small>
            使用 IANA 时区，例如 Asia/Shanghai。午休 12:10—14:10 为推导配置。
          </small>
          <label className="check">
            <input
              type="checkbox"
              checked={p.eveningEnabled ?? true}
              onChange={(e) => {
                const inputChecked = (e.target as HTMLInputElement).checked;
                return void update((d) => ({
                  ...d,
                  preferences: {
                    ...d.preferences,
                    eveningEnabled: inputChecked,
                  },
                }));
              }}
            />
            启用晚自习（产品设置，非 Excel 原内容）
          </label>
          <div className="form-grid">
            {(["eveningStart", "eveningEnd"] as const).map((k, i) => (
              <label key={k}>
                {i ? "晚自习结束" : "晚自习开始"}
                <input
                  type="time"
                  value={p[k] ?? (i ? "22:00" : "19:00")}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return void update((d) => ({
                      ...d,
                      preferences: (() => {
                        const start =
                          k === "eveningStart"
                            ? inputValue
                            : (d.preferences.eveningStart ?? "19:00");
                        const end =
                          k === "eveningEnd"
                            ? inputValue
                            : (d.preferences.eveningEnd ?? "22:00");
                        if (start >= end)
                          throw new Error(
                            "晚自习结束应晚于开始，请先调整另一端时间",
                          );
                        return { ...d.preferences, [k]: inputValue };
                      })(),
                    }));
                  }}
                />
              </label>
            ))}
          </div>
          <div className="inline">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <label className="check" key={day}>
                <input
                  type="checkbox"
                  checked={(p.eveningDays ?? [1, 2, 3, 4, 5]).includes(day)}
                  onChange={(e) => {
                    const inputChecked = (e.target as HTMLInputElement).checked;
                    return void update((d) => ({
                      ...d,
                      preferences: {
                        ...d.preferences,
                        eveningDays: inputChecked
                          ? [
                              ...new Set([
                                ...(d.preferences.eveningDays ?? [
                                  1, 2, 3, 4, 5,
                                ]),
                                day,
                              ]),
                            ]
                          : (
                              d.preferences.eveningDays ?? [1, 2, 3, 4, 5]
                            ).filter((x) => x !== day),
                      },
                    }));
                  }}
                />
                周{["一", "二", "三", "四", "五", "六", "日"][day - 1]}
              </label>
            ))}
          </div>
          <button
            onClick={() => {
              try {
                new Intl.DateTimeFormat("zh-CN", {
                  timeZone: p.aipTimezone ?? "Asia/Shanghai",
                }).format();
                toast("作息设置已保存");
              } catch {
                toast("时区无效，请填写 Asia/Shanghai 等 IANA 时区");
              }
            }}
          >
            检查时区
          </button>
        </div>
      )}
    </Panel>
  );
}
export function SchoolStatus() {
  const { data, now } = useStore();
  if (data.preferences.aipIdentity !== "yes") return null;
  try {
    const s = schoolState(data, now);
    return (
      <div className="status-strip">
        <strong>{s.label}</strong>
        <span>下一项：{s.nextText}</span>
        <small>{data.preferences.aipTimezone || "Asia/Shanghai"}</small>
      </div>
    );
  } catch {
    return <p role="alert">课表时区无效，请到设置中修正。</p>;
  }
}
