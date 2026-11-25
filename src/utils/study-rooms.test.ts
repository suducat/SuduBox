import { describe, it, expect } from "vitest";
import { studyRoomData, studyRoomsAt, studyRoomsBetween } from "./study-rooms";
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

describe("manual study room ranges", () => {
  it("requires availability in every overlapping slot, not only the start", () => {
    const result = studyRoomsBetween("2026-11-23", "09:00", "10:00");
    expect(result.status).toBe("ready");
    expect(result.rooms.map((r) => r.id).sort()).toEqual(["5310"]);
    expect(result.rooms.some((r) => r.id === "5210")).toBe(false);
  });
  it("excludes the end boundary but applies next-period availability during a break", () => {
    expect(
      studyRoomsBetween("2026-11-23", "09:00", "09:40").rooms.some(
        (r) => r.id === "5210",
      ),
    ).toBe(true);
    expect(
      studyRoomsBetween("2026-11-23", "09:00", "09:41").rooms.some(
        (r) => r.id === "5210",
      ),
    ).toBe(false);
    expect(
      studyRoomsBetween("2026-11-23", "09:40", "09:45").rooms.map((r) => r.id),
    ).toEqual(at("2026-11-23", "09:40").rooms.map((r) => r.id));
  });
  it("handles lunch merged occupation and consecutive free periods", () => {
    const lunch = studyRoomsBetween("2026-11-24", "12:10", "14:10");
    expect(lunch.rooms.map((r) => r.id).sort()).toEqual(
      studyRoomData.rooms.slice(0, 8),
    );
    const across = studyRoomsBetween("2026-11-24", "12:00", "14:20");
    expect(
      across.rooms.every((r) => studyRoomData.rooms.indexOf(r.id) < 8),
    ).toBe(true);
    expect(
      studyRoomsBetween("2026-11-23", "15:50", "17:20").rooms,
    ).toHaveLength(17);
  });
  it.each([
    ["2026-11-28", "09:00", "10:00"],
    ["2026-11-29", "09:00", "10:00"],
    ["2026-11-23", "08:00", "09:00"],
    ["2026-11-24", "07:59", "09:00"],
    ["2026-11-24", "17:00", "17:21"],
  ])(
    "does not return partial data for uncovered range %s %s–%s",
    (date, start, end) => {
      expect(studyRoomsBetween(date, start, end)).toMatchObject({
        status: "no-data",
        rooms: [],
      });
    },
  );
  it.each([
    ["2026-02-30", "09:00", "10:00"],
    ["bad", "09:00", "10:00"],
    ["2026-11-23", "25:00", "26:00"],
    ["2026-11-23", "09:00", "09:00"],
    ["2026-11-23", "10:00", "09:00"],
    ["2026-11-23", "23:00", "01:00"],
  ])("rejects invalid or reversed range %s %s–%s", (date, start, end) => {
    expect(studyRoomsBetween(date, start, end)).toMatchObject({
      status: "invalid",
      rooms: [],
    });
  });
});
