import { describe, it, expect } from "vitest";
import { studyRoomData, studyRoomsAt, studyRoomsForSlot } from "./study-rooms";
const at = (date: string, time: string) =>
  studyRoomsAt(new Date(`${date}T${time}:00+08:00`));
describe("study rooms: source and Beijing boundaries", () => {
  it("covers exactly 17 rooms and all 850 cell statuses", () => {
    expect(studyRoomData.rooms).toEqual([
      "5201",
      "5202",
      "5204",
      "5206",
      "5207",
      "5209",
      "5210",
      "5301",
      "5302",
      "5304",
      "5306",
      "5307",
      "5310",
      "5311",
      "5601",
      "5602",
      "5603",
    ]);
    expect(
      Object.values(studyRoomData.days)
        .flat()
        .reduce((sum, s) => sum + s.available.length, 0),
    ).toBe(850);
    for (const slots of Object.values(studyRoomData.days)) {
      expect(slots.map((s) => s.id)).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "Lunch",
        "6",
        "7",
        "8",
        "9",
      ]);
      // The merged Lunch label blocks all rows 12–20, not just row 12.
      expect(slots[5].available).toEqual([
        ...Array(8).fill(true),
        ...Array(9).fill(false),
      ]);
    }
  });
  it("uses the device instant in Beijing regardless of device timezone", () => {
    expect(studyRoomsAt(new Date("2026-11-23T00:10:00Z"))).toEqual(
      at("2026-11-23", "08:10"),
    );
    expect(studyRoomsAt(new Date("2026-11-22T23:59:00Z")).weekday).toBe("周一");
  });
  it("distinguishes Monday's first lesson and the following break", () => {
    expect(at("2026-11-23", "08:00").slot).toBeUndefined();
    expect(at("2026-11-23", "08:10").slot?.id).toBe("1");
    expect(at("2026-11-23", "08:40").inBreak).toBe(false);
    expect(at("2026-11-23", "08:50").inBreak).toBe(true);
    expect(at("2026-11-24", "08:00").slot?.id).toBe("1");
    expect(at("2026-11-24", "08:40").inBreak).toBe(true);
    expect(at("2026-11-24", "08:40").slot?.id).toBe("2");
  });
  it("handles every day's slot starts and ends without losing a period", () => {
    Object.entries(studyRoomData.days).forEach(([day, slots]) => {
      const date = `2026-11-${22 + Number(day)}`;
      slots.forEach((s, i) => {
        const state = at(date, s.start);
        expect(state.slot?.id).toBe(s.id);
        expect(state.inBreak).toBe(false);
        expect(state.rooms.length).toBe(
          studyRoomData.audit.availablePerDay[
            day as keyof typeof studyRoomData.audit.availablePerDay
          ][i],
        );
        expect(at(date, s.end).slot?.id).toBe(slots[i + 1]?.id);
      });
    });
  });
  it("maps lunch and never treats weekends or uncovered hours as free", () => {
    expect(at("2026-11-24", "12:09").slot?.id).toBe("5");
    expect(at("2026-11-24", "12:10").slot?.id).toBe("Lunch");
    expect(
      at("2026-11-24", "14:09")
        .rooms.map((r) => r.id)
        .sort(),
    ).toEqual(studyRoomData.rooms.slice(0, 8));
    expect(at("2026-11-24", "14:10").slot?.id).toBe("6");
    for (const [date, time] of [
      ["2026-11-28", "09:00"],
      ["2026-11-29", "12:30"],
      ["2026-11-24", "07:59"],
      ["2026-11-24", "17:20"],
      ["2026-11-24", "23:59"],
    ]) {
      expect(at(date, time).slot).toBeUndefined();
      expect(at(date, time).rooms).toEqual([]);
    }
  });
  it("sorts by continuous availability and warns about the next occupied slot", () => {
    const state = at("2026-11-23", "08:10");
    expect(state.rooms).toEqual(
      [
        { id: "5311", until: "09:50", nextOccupied: false },
        { id: "5603", until: "09:50", nextOccupied: false },
        { id: "5210", until: "09:50", nextOccupied: false },
      ].sort((a, b) => a.id.localeCompare(b.id, "zh-CN", { numeric: true })),
    );
    const warning = at("2026-11-23", "09:00").rooms.find(
      (r) => r.id === "5210",
    );
    expect(warning).toMatchObject({ until: "09:50", nextOccupied: true });
    expect(
      at("2026-11-23", "16:40").rooms.every((r) => r.until === "17:20"),
    ).toBe(true);
  });
});

describe("weekday and period selection", () => {
  it("matches the source and automatic query for all 50 lesson slots", () => {
    Object.entries(studyRoomData.days).forEach(([day, slots]) => {
      slots.forEach((slot, index) => {
        const result = studyRoomsForSlot(Number(day), slot.id);
        expect(result.rooms).toEqual(
          at(`2026-11-${22 + Number(day)}`, slot.start).rooms,
        );
        expect(result.rooms).toHaveLength(
          studyRoomData.audit.availablePerDay[
            day as keyof typeof studyRoomData.audit.availablePerDay
          ][index],
        );
        expect(result.slot).toEqual(slot);
        expect(result.nextSlot).toEqual(slots[index + 1]);
      });
    });
  });
  it("uses Monday's distinct times and keeps merged lunch occupancy", () => {
    expect(studyRoomsForSlot(1, "1").slot?.start).toBe("08:10");
    expect(studyRoomsForSlot(2, "1").slot?.start).toBe("08:00");
    expect(
      studyRoomsForSlot(3, "Lunch")
        .rooms.map((r) => r.id)
        .sort(),
    ).toEqual(studyRoomData.rooms.slice(0, 8));
  });
  it("distinguishes next occupied, next available, and no following data", () => {
    const result = studyRoomsForSlot(1, "2");
    expect(result.rooms.find((r) => r.id === "5210")?.nextOccupied).toBe(true);
    expect(
      result.nextSlot?.available[studyRoomData.rooms.indexOf("5310")],
    ).toBe(true);
    expect(studyRoomsForSlot(1, "9").nextSlot).toBeUndefined();
  });
  it.each([
    [0, "1"],
    [6, "1"],
    [1.5, "1"],
    [1, "missing"],
  ])("does not invent data for day %s and slot %s", (day, period) => {
    const result = studyRoomsForSlot(Number(day), String(period));
    expect(result.slot).toBeUndefined();
    expect(result.nextSlot).toBeUndefined();
    expect(result.rooms).toEqual([]);
  });
});
