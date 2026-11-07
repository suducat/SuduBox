import { validGpaSettings } from "./gpa-entry";
import { validGpaRows } from "./gpa";
import { emptyData, type Course, type Data, type Exam } from "../types";
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const minutes = (s: string) =>
  Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]);
export function schedule(courses: Course[], now = new Date()) {
  const day = now.getDay() || 7;
  const m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const today = courses
    .filter((c) => c.day === day)
    .sort((a, b) => minutes(a.start) - minutes(b.start));
  return {
    today,
    current: today.filter((c) => minutes(c.start) <= m && minutes(c.end) > m),
    next: today.find((c) => minutes(c.start) > m),
    completed: today.filter((c) => minutes(c.end) <= m).length,
    minute: m,
  };
}
export function conflicts(c: Course, all: Course[]) {
  return all.filter(
    (x) =>
      x.id !== c.id &&
      x.day === c.day &&
      minutes(c.start) < minutes(x.end) &&
      minutes(c.end) > minutes(x.start),
  );
}
export const examTimestamp = (e: Pick<Exam, "date" | "time">) =>
  new Date(`${e.date}T${e.time || "23:59"}:00`).getTime();
export function countdown(e: Pick<Exam, "date" | "time">, now = new Date()) {
  const ms = examTimestamp(e) - now.getTime();
  if (ms < 0) return "已结束";
  if (e.date === localDate(now)) {
    if (!e.time) return "今天考试";
    return `今天 · ${Math.floor(ms / 3600000)}小时 ${Math.floor(ms / 60000) % 60}分钟`;
  }
  const a = new Date(`${e.date}T12:00:00`);
  const b = new Date(`${localDate(now)}T12:00:00`);
  return `${Math.round((a.getTime() - b.getTime()) / 86400000)} 天`;
}
export interface CleanOptions {
  spaces: boolean;
  trim: boolean;
  pdf: boolean;
  cjk: boolean;
  punctuation: boolean;
  width: boolean;
  blank: boolean;
}
export const defaultClean: CleanOptions = {
  spaces: true,
  trim: true,
  pdf: false,
  cjk: false,
  punctuation: false,
  width: false,
  blank: true,
};
export function cleanText(text: string, o: CleanOptions) {
  let t = text.replace(/\r\n?/g, "\n");
  if (o.width)
    t = t
      .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/　/g, " ");
  if (o.spaces) t = t.replace(/[ \t]{2,}/g, " ");
  if (o.trim)
    t = t
      .split("\n")
      .map((s) => s.trim())
      .join("\n")
      .trim();
  if (o.pdf) t = t.replace(/([^\n。！？.!?:;：；])\n(?=[^\n])/g, "$1 ");
  if (o.cjk)
    t = t
      .replace(/([\u3400-\u9fff])([A-Za-z0-9])/g, "$1 $2")
      .replace(/([A-Za-z0-9])([\u3400-\u9fff])/g, "$1 $2");
  if (o.punctuation)
    t = t
      .replace(/([\u3400-\u9fff])[,]/g, "$1，")
      .replace(/([\u3400-\u9fff])[!]/g, "$1！")
      .replace(/([\u3400-\u9fff])[?]/g, "$1？")
      .replace(/([\u3400-\u9fff])[:]/g, "$1：")
      .replace(/([\u3400-\u9fff])[;]/g, "$1；");
  if (o.blank) t = t.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n");
  return t;
}
export function draw(pool: string[], count: number, random = Math.random) {
  const remaining = [...pool];
  const picked: string[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const at = Math.min(
      remaining.length - 1,
      Math.floor(random() * remaining.length),
    );
    picked.push(remaining.splice(at, 1)[0]);
  }
  return { picked, remaining };
}
export function parseWords(input: string, existing: string[] = []) {
  const seen = new Set(existing.map((x) => x.trim().toLowerCase()));
  const rows: { word: string; meaning: string; line: number }[] = [];
  const errors: string[] = [];
  let duplicates = 0;
  input.split(/\r?\n/).forEach((line, i) => {
    const s = line.trim();
    if (!s) return;
    const m = s.match(
      /^([A-Za-z][A-Za-z' -]*?)\s*(?:\s[-–—:]\s*|[:：]\s*|\s+)(.+)$/,
    );
    if (!m || !m[2].trim()) {
      errors.push(`第 ${i + 1} 行：无法识别单词与释义（${s}）`);
      return;
    }
    const word = m[1].trim().replace(/\s+/g, " ");
    if (seen.has(word.toLowerCase())) {
      duplicates++;
      return;
    }
    seen.add(word.toLowerCase());
    rows.push({ word, meaning: m[2].trim(), line: i + 1 });
  });
  return { rows, errors, duplicates };
}
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const validDate = (x: unknown) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  localDate(new Date(`${x}T12:00:00`)) === x;
const validTime = (x: unknown) =>
  typeof x === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);
export function validateBackup(value: unknown): Data {
  if (!record(value) || value.version !== 1 || !record(value.data))
    throw new Error("不支持的备份格式或版本");
  const d = value.data;
  if (d.gpa !== undefined && !validGpaRows(d.gpa))
    throw new Error("GPA 备份数据无效");
  if (d.gpaDraft !== undefined && !validGpaRows(d.gpaDraft))
    throw new Error("GPA 草稿备份数据无效");
  const fields: Record<string, string[]> = {
    courses: ["id", "name", "start", "end", "room", "note", "color"],
    lessons: [
      "id",
      "courseId",
      "courseName",
      "date",
      "content",
      "homework",
      "review",
      "note",
    ],
    notes: ["id", "text", "subject", "date"],
    exams: ["id", "name", "date", "time", "subject", "color"],
    words: ["id", "word", "meaning", "library", "note"],
    focus: ["id", "date", "subject"],
  };
  for (const [key, strings] of Object.entries(fields)) {
    if (!Array.isArray(d[key])) throw new Error(`缺少数据：${key}`);
    const ids = new Set();
    for (const r of d[key]) {
      if (
        !record(r) ||
        strings.some((k) => typeof r[k] !== "string") ||
        !r.id ||
        ids.has(r.id)
      )
        throw new Error(`${key} 记录无效或 ID 重复`);
      ids.add(r.id);
      if (key === "courses") {
        for (const k of ["teacher", "selectedCandidate"])
          if (r[k] !== undefined && typeof r[k] !== "string")
            throw new Error("课程扩展字段无效");
        if (r.specificDate !== undefined && !validDate(r.specificDate))
          throw new Error("特殊课程日期无效");
        if (
          r.candidates !== undefined &&
          (!Array.isArray(r.candidates) ||
            r.candidates.some((x) => typeof x !== "string"))
        )
          throw new Error("选修候选无效");
        if (
          r.source !== undefined &&
          (!record(r.source) ||
            ["templateId", "version", "sheet", "cell", "raw"].some(
              (k) =>
                typeof (r.source as Record<string, unknown>)[k] !== "string",
            ))
        )
          throw new Error("课程来源无效");
      }

      const bools =
        key === "lessons"
          ? ["confused", "resolved"]
          : key === "notes"
            ? ["pinned", "done"]
            : key === "exams"
              ? ["pinned", "done"]
              : key === "words"
                ? ["mastered"]
                : [];
      if (bools.some((k) => typeof r[k] !== "boolean"))
        throw new Error(`${key} 状态无效`);
      if (
        ["lessons", "notes", "exams", "focus"].includes(key) &&
        !validDate(r.date)
      )
        throw new Error("日期无效");
      if (
        key === "courses" &&
        (!Number.isInteger(r.day) ||
          Number(r.day) < 1 ||
          Number(r.day) > 7 ||
          !validTime(r.start) ||
          !validTime(r.end) ||
          minutes(String(r.end)) <= minutes(String(r.start)))
      )
        throw new Error("课程时间无效");
      if (key === "exams" && r.time !== "" && !validTime(r.time))
        throw new Error("考试时间无效");
      if (
        ["notes", "words"].includes(key) &&
        (!Number.isFinite(r.created) || Number(r.created) < 0)
      )
        throw new Error("创建时间无效");
      if (
        key === "focus" &&
        (["start", "end", "duration"].some(
          (k) => !Number.isFinite(r[k]) || Number(r[k]) < 0,
        ) ||
          Number(r.end) < Number(r.start) ||
          Number(r.duration) > Number(r.end) - Number(r.start))
      )
        throw new Error("专注记录无效");
    }
  }
  if (
    !Array.isArray(d.favorites) ||
    d.favorites.some((x) => typeof x !== "string") ||
    !Array.isArray(d.libraries) ||
    d.libraries.some((x) => typeof x !== "string")
  )
    throw new Error("收藏或词库无效");
  if (
    !record(d.preferences) ||
    !["light", "dark", "system"].includes(String(d.preferences.theme)) ||
    !validTime(d.preferences.schoolStart) ||
    !validTime(d.preferences.schoolEnd) ||
    ["focusMinutes", "shortMinutes", "longMinutes"].some(
      (k) =>
        !Number.isFinite((d.preferences as Record<string, unknown>)[k]) ||
        Number((d.preferences as Record<string, unknown>)[k]) < 1 ||
        Number((d.preferences as Record<string, unknown>)[k]) > 180,
    )
  )
    throw new Error("偏好设置无效");
  const p = d.preferences;
  if (p.gpaSettings !== undefined && !validGpaSettings(p.gpaSettings))
    throw new Error("GPA 计算设置无效");
  if (
    p.aipSelections !== undefined &&
    (!record(p.aipSelections) ||
      Object.values(p.aipSelections).some(
        (x) =>
          !record(x) || Object.values(x).some((v) => typeof v !== "string"),
      ))
  )
    throw new Error("选修池配置格式无效");
  for (const key of [
    "officialIgnored",
    "officialPinned",
    "officialFollowed",
    "legacyQuestions",
  ])
    if (
      p[key] !== undefined &&
      (!Array.isArray(p[key]) ||
        (p[key] as unknown[]).some((x) => typeof x !== "string"))
    )
      throw new Error("新增偏好列表格式无效");
  for (const key of ["officialHidden", "eveningEnabled"])
    if (p[key] !== undefined && typeof p[key] !== "boolean")
      throw new Error("偏好开关格式无效");
  if (
    p.aipIdentity !== undefined &&
    !["", "yes", "no"].includes(String(p.aipIdentity))
  )
    throw new Error("学生身份无效");
  for (const key of ["aipGrade", "aipGroup", "aipTimezone"])
    if (p[key] !== undefined && typeof p[key] !== "string")
      throw new Error("课表偏好格式无效");
  if (p.aipTimezone) {
    try {
      new Intl.DateTimeFormat("en", {
        timeZone: String(p.aipTimezone),
      }).format();
    } catch {
      throw new Error("课表时区无效");
    }
  }
  for (const key of ["eveningStart", "eveningEnd"])
    if (p[key] !== undefined && !validTime(p[key]))
      throw new Error("晚自习时间无效");
  if (
    p.eveningStart &&
    p.eveningEnd &&
    String(p.eveningStart) >= String(p.eveningEnd)
  )
    throw new Error("晚自习结束应晚于开始");
  if (
    p.eveningDays !== undefined &&
    (!Array.isArray(p.eveningDays) ||
      p.eveningDays.some(
        (x) => !Number.isInteger(x) || Number(x) < 1 || Number(x) > 7,
      ))
  )
    throw new Error("晚自习星期无效");
  if (p.questionBank !== undefined) {
    if (!Array.isArray(p.questionBank)) throw new Error("题库格式无效");
    const ids = new Set();
    for (const q of p.questionBank) {
      if (
        !record(q) ||
        typeof q.id !== "string" ||
        !q.id ||
        ids.has(q.id) ||
        typeof q.question !== "string" ||
        !q.question.trim() ||
        typeof q.answer !== "string"
      )
        throw new Error("题目卡内容无效");
      ids.add(q.id);
    }
  }
  const checkCourses = (courses: unknown) => {
    validateBackup({ version: 1, data: { ...emptyData(), courses } });
  };
  if (p.specialDays !== undefined) {
    if (!Array.isArray(p.specialDays)) throw new Error("特殊日期格式无效");
    const dates = new Set();
    for (const day of p.specialDays) {
      if (
        !record(day) ||
        !validDate(day.date) ||
        dates.has(day.date) ||
        typeof day.closed !== "boolean" ||
        !["merge", "replace"].includes(String(day.mode)) ||
        (day.evening !== undefined && typeof day.evening !== "boolean")
      )
        throw new Error("特殊日期记录无效");
      checkCourses(day.courses);
      dates.add(day.date);
    }
  }
  if (p.scheduleRecovery !== undefined) {
    if (
      !record(p.scheduleRecovery) ||
      !Number.isFinite(p.scheduleRecovery.savedAt)
    )
      throw new Error("课表恢复点无效");
    checkCourses(p.scheduleRecovery.courses);
  }
  return { ...emptyData(), ...d, timer: null } as Data;
}
export async function download(
  name: string,
  content: string,
  type = "application/json",
) {
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        defaultPath: name,
        filters: [
          { name: "导出文件", extensions: [name.split(".").pop() || "json"] },
        ],
      });
      if (!path) return false;
      await writeTextFile(path, content);
      return true;
    } catch (error) {
      alert(
        `保存失败，原有数据未更改：${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  return true;
}
export async function copy(text: string) {
  if ("__TAURI_INTERNALS__" in window) {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
    return;
  }
  if (!navigator.clipboard)
    throw new Error("当前环境不支持一键复制，请手动选择文本复制");
  await navigator.clipboard.writeText(text);
}
