import presets from "../data/aip-presets";
import { schoolState } from "../utils/school";
import { SpecialDays } from "./SpecialDays";
import { AipImport } from "./AipImport";
import { useStore } from "./context";
import { Panel } from "./UI";
export function SchoolSetup() {
  const { data, update, toast } = useStore();
  const p = data.preferences;
  const selectedGroup = p.aipGroup?.startsWith("212 B")
    ? "212B"
    : presets.some((item) => item.id === p.aipGroup)
      ? p.aipGroup
      : p.aipGroup?.slice(0, 3);
  return (
    <Panel title="选择你的班级">
      <fieldset className="choice-fieldset">
        <legend>年级</legend>
        <div className="choice-buttons">
          {["高一", "高二", "高三"].map((grade) => (
            <button
              key={grade}
              aria-pressed={p.aipGrade?.startsWith(grade) ?? false}
              onClick={() =>
                void update((d) => ({
                  ...d,
                  preferences: {
                    ...d.preferences,
                    aipIdentity: "yes",
                    aipGrade: grade,
                    aipGroup: "",
                  },
                }))
              }
            >
              {grade}
            </button>
          ))}
        </div>
      </fieldset>
      {p.aipGrade && (
        <fieldset className="choice-fieldset">
          <legend>班级</legend>
          <div className="choice-buttons">
            {presets
              .filter(
                (item) =>
                  item.grade ===
                  (p.aipGrade?.startsWith("高二") ? "高二" : p.aipGrade),
              )
              .map((item) => (
                <button
                  key={item.id}
                  aria-pressed={selectedGroup === item.id}
                  onClick={() =>
                    void update((d) => ({
                      ...d,
                      preferences: { ...d.preferences, aipGroup: item.id },
                    }))
                  }
                >
                  {item.id}
                </button>
              ))}
          </div>
        </fieldset>
      )}
      {p.aipGroup && <AipImport key={p.aipGroup} />}
      <details className="school-advanced">
        <summary>作息与特殊日期</summary>
        <div className="form">
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
          <small>国内学校填写 Asia/Shanghai。</small>
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
            启用晚自习
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
        <button
          onClick={async () => {
            if (
              await update((d) => ({
                ...d,
                preferences: { ...d.preferences, aipIdentity: "no" },
              }))
            )
              toast("已改用手动课表，现有课程保留");
          }}
        >
          改用手动课表
        </button>
      </details>
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
