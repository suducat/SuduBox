import type { OfficialExam } from "../data/exam-presets";
import { localDate } from "./logic";
export function officialStatus(e: OfficialExam, now = new Date()) {
  if (e.precision === "unknown" || !e.date) return "待官方公布／待核实";
  const today = localDate(now),
    end = e.end || e.date;
  if (today > end) return "已结束";
  if (e.precision === "range" && today >= e.date) return "考季进行中";
  if (today === e.date) return "今天考试";
  const days = Math.round(
    (new Date(e.date + "T12:00:00").getTime() -
      new Date(today + "T12:00:00").getTime()) /
      86400000,
  );
  return `${e.precision === "range" ? "距离考季开始" : "距考试日期"} ${days} 天`;
}
