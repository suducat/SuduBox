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
  return {
    ...studyRoomsForSlot(day, slots[index]?.id ?? "", data),
    time,
    inBreak,
  };
}

/** Query the exact source slot without constructing a date or guessing times. */
export function studyRoomsForSlot(
  day: number,
  id: string,
  data: RoomTimetable = timetable,
) {
  const periods =
    Number.isInteger(day) && day >= 1 && day <= 5
      ? (data.days[String(day)] ?? [])
      : [];
  const slots = periods;
  const index = slots.findIndex((slot) => slot.id === id);
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
  return {
    weekday: weekdays[day] ?? "",
    slot,
    nextSlot: slots[index >= 0 ? index + 1 : -1],
    periods,
    rooms,
  };
}
