import { electiveModel, subjectKey } from "./electives";
import type { Course, Data, Preferences } from "../types";
import presets from "../data/aip-presets";
import { minutes, localDate, schedule } from "./logic";
function validZone(zone?: string) {
  try {
    new Intl.DateTimeFormat("en", {
      timeZone: zone || "Asia/Shanghai",
    }).format();
    return zone || "Asia/Shanghai";
  } catch {
    return "Asia/Shanghai";
  }
}
export function schoolClock(now: Date, p: Preferences) {
  if (p.aipIdentity !== "yes") return now;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: validZone(p.aipTimezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const n = (key: string) => Number(parts.find((x) => x.type === key)?.value);
  return new Date(
    n("year"),
    n("month") - 1,
    n("day"),
    n("hour"),
    n("minute"),
    n("second"),
  );
}
export function dayCourses(data: Data, date: string): Course[] {
  const day = new Date(date + "T12:00:00").getDay() || 7;
  const special = data.preferences.specialDays?.find((x) => x.date === date);
  if (special?.closed) return [];
  const base = data.courses.filter((c) => c.day === day);
  return (
    special?.mode === "replace"
      ? special.courses
      : [...base, ...(special?.courses ?? [])]
  )
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));
}
export function schoolState(data: Data, now: Date) {
  const p = data.preferences;
  const clock = schoolClock(now, p),
    date = localDate(clock),
    day = clock.getDay() || 7,
    m = clock.getHours() * 60 + clock.getMinutes() + clock.getSeconds() / 60;
  const courses = dayCourses(data, date);
  const s = schedule(
    courses.map((c) => ({ ...c, day })),
    clock,
  );
  const special = p.specialDays?.find((x) => x.date === date);
  const evening =
    !special?.closed &&
    (special?.evening ??
      ((p.eveningEnabled ?? true) &&
        (p.eveningDays ?? [1, 2, 3, 4, 5]).includes(day)));
  const es = minutes(p.eveningStart ?? "19:00"),
    ee = minutes(p.eveningEnd ?? "22:00");
  let label = "今日安排已结束";
  if (special?.closed) label = "今日停课";
  else if (s.current.length)
    label = s.current
      .map(
        (c) =>
          `${c.name}${c.room ? " · " + c.room : ""} · 剩余 ${Math.ceil(minutes(c.end) - m)} 分钟`,
      )
      .join(" / ");
  else if (day >= 6 && !courses.length && !evening) label = "周末休息";
  else if (evening && m >= es && m < ee) label = "晚自习";
  else if (m >= 730 && m < 850) label = "午休";
  else if (s.next && m < minutes(courses[0].start)) label = "尚未上课";
  else if (s.next) label = "课间休息";
  else if (m >= 990 && evening && m < es) label = "已放学";
  else if (m >= 990 && m < 1320 && !evening) label = "已放学";
  return {
    ...s,
    clock,
    date,
    label,
    evening,
    nextText: s.next
      ? `${s.next.start} ${s.next.name}${s.next.room ? " · " + s.next.room : ""}`
      : evening && m < es
        ? `${p.eveningStart ?? "19:00"} 晚自习`
        : "暂无下一项安排",
  };
}
export function electiveOptions(raw: string) {
  if (!raw.includes("/") || /Assembly\s*\/\s*Clubs/i.test(raw)) return [];
  const prefix = raw.startsWith("ENREACH") ? "ENREACH · " : "";
  return raw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => prefix + s.replace(/^ENREACH\s*/, ""));
}
export function presetCourses(
  id: string,
  selection: Record<string, string>,
  makeId: () => string,
): Course[] {
  const preset = presets.find((p) => p.id === id);
  if (!preset) throw new Error("找不到课表模板，请重新选择分组");
  const model = electiveModel(id);
  const selected = new Set(
    Object.keys(selection)
      .filter((k) => k.startsWith("subject:") && selection[k])
      .map((k) => k.slice(8)),
  );
  for (const key of selected) {
    if (!model.labels.has(key)) throw new Error("科目不属于当前班级");
    for (const other of model.conflicts.get(key) ?? [])
      if (selected.has(other)) throw new Error("同一时段只能选择一门课程");
  }
  return preset.slots.map((slot) => {
    const choices: string[] = slot.options;
    const matches = choices.filter((c) => selected.has(subjectKey(c)));
    const chosen = matches[0];
    const belongs = model.labels.has(subjectKey(slot.name));
    const study =
      (choices.length > 0 && !chosen) ||
      (choices.length === 0 && belongs && !selected.has(subjectKey(slot.name)));
    const raw = study
      ? "自习课"
      : chosen || `${slot.name} (${slot.teacher})【${slot.room}】`;
    const pending = false;
    return {
      id: makeId(),
      name: pending
        ? "待选择课程"
        : raw
            .trim()
            .split(/[\n(（【]/)[0]
            .trim() || "未命名课程",
      day: slot.day,
      start: slot.start,
      end: slot.end,
      room:
        study || pending
          ? ""
          : (raw.match(/【([^】]+)】/)?.[1] ??
            (/阶梯教室/.test(raw) ? "阶梯教室" : "")),
      note: `预设:${preset.id}:${preset.version}:${slot.cell}\n原表 ${preset.sheet}!${slot.cell}\n${raw}`,
      color: "#4979e8",
      teacher:
        study || pending ? "" : (raw.match(/[（(]([^）)]+)[）)]/)?.[1] ?? ""),
      source: {
        templateId: id,
        version: preset.version,
        sheet: preset.sheet,
        cell: slot.cell,
        raw: slot.raw,
      },
      candidates: choices,
      selectedCandidate: chosen ?? "",
    };
  });
}
export function importPreset(
  data: Data,
  id: string,
  selection: Record<string, string>,
  replace: boolean,
  makeId: () => string,
): Data {
  if (
    !replace &&
    data.courses.some(
      (c) =>
        c.source?.templateId === id &&
        c.source.version === presets.find((p) => p.id === id)?.version,
    )
  )
    throw new Error(
      "这份课表已导入。若要更新选修池，请勾选替换重新生成，原课堂笔记会保留。",
    );
  const rows = presetCourses(id, selection, makeId);
  return {
    ...data,
    courses: replace ? rows : [...data.courses, ...rows],
    preferences: {
      ...data.preferences,
      aipSelections: { ...data.preferences.aipSelections, [id]: selection },
      scheduleRecovery: replace
        ? { courses: data.courses, savedAt: Date.now() }
        : data.preferences.scheduleRecovery,
    },
  };
}
