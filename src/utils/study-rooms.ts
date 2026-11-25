import timetable from "../data/study-rooms.json";

export interface RoomSlot {
  id: string;
  start: string;
  end: string;
  inferred: boolean;
  available: boolean[];
}
export interface RoomTimetable {
  rooms: string[];
  days: Record<string, RoomSlot[]>;
}
const minute = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const studyRoomData = timetable;

export function studyRoomsAt(now: Date, data: RoomTimetable = timetable) {
  // Fixed UTC+8, independent of the device's timezone; no date-string parsing.
  const beijing = new Date(now.getTime() + 8 * 3600000);
  const day = beijing.getUTCDay();
  const time = `${String(beijing.getUTCHours()).padStart(2, "0")}:${String(beijing.getUTCMinutes()).padStart(2, "0")}:${String(beijing.getUTCSeconds()).padStart(2, "0")}`;
  const current = beijing.getUTCHours() * 60 + beijing.getUTCMinutes();
  const slots = day >= 1 && day <= 5 ? (data.days[String(day)] ?? []) : [];
  let index = slots.findIndex(
    (s) => current >= minute(s.start) && current < minute(s.end),
  );
  let inBreak = false;
  if (index < 0) {
    index = slots.findIndex(
      (s, i) =>
        i > 0 &&
        current >= minute(slots[i - 1].end) &&
        current < minute(s.start),
    );
    inBreak = index >= 0;
  }
  const slot = slots[index];
  const rooms = slot
    ? data.rooms
        .flatMap((id, roomIndex) => {
          // Missing cells are unknown, never implicitly available.
          if (slot.available[roomIndex] !== true) return [];
          let last = index;
          while (
            last + 1 < slots.length &&
            slots[last + 1].available[roomIndex] === true
          )
            last++;
          const next = slots[last + 1];
          // Stop at the last covered end if a following status is unknown.
          const until =
            next?.available[roomIndex] === false ? next.start : slots[last].end;
          return [
            {
              id,
              until,
              nextOccupied: slots[index + 1]?.available[roomIndex] === false,
            },
          ];
        })
        .sort(
          (a, b) =>
            b.until.localeCompare(a.until) ||
            a.id.localeCompare(b.id, "zh-CN", { numeric: true }),
        )
    : [];
  return { weekday: weekdays[day], time, slot, inBreak, rooms };
}

/** Same-day Beijing range, with an exclusive end and breaks using the next slot. */
export function studyRoomsBetween(
  date: string,
  start: string,
  end: string,
  data: RoomTimetable = timetable,
) {
  const invalid = (message: string) => ({
    status: "invalid" as const,
    message,
    weekday: "",
    rooms: [] as ReturnType<typeof studyRoomsAt>["rooms"],
  });
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    ![start, end].every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))
  )
    return invalid("请选择有效的日期、开始时间和结束时间。");
  const instant = new Date(`${date}T${start}:00+08:00`);
  if (
    !Number.isFinite(instant.getTime()) ||
    new Date(instant.getTime() + 8 * 3600000).toISOString().slice(0, 10) !==
      date
  )
    return invalid("请选择有效日期。");
  if (start >= end)
    return invalid("结束时间应晚于开始时间；跨日查询请分天进行。");
  const day = new Date(instant.getTime() + 8 * 3600000).getUTCDay();
  const slots = day >= 1 && day <= 5 ? (data.days[String(day)] ?? []) : [];
  const state = studyRoomsAt(instant, data);
  if (
    !slots.length ||
    start < slots[0].start ||
    end > slots[slots.length - 1].end
  )
    return {
      status: "no-data" as const,
      message: "所选时间段暂无完整的自习室安排数据",
      weekday: state.weekday,
      rooms: [] as typeof state.rooms,
    };
  const covered = slots.filter(
    (slot, i) => start < slot.end && end > (i ? slots[i - 1].end : slot.start),
  );
  return {
    status: "ready" as const,
    message: "",
    inferred: covered.some((slot) => slot.inferred),
    weekday: state.weekday,
    rooms: state.rooms.filter((room) => {
      const index = data.rooms.indexOf(room.id);
      return covered.every((slot) => slot.available[index] === true);
    }),
  };
}
