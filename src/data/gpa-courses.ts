import type { GpaCategory } from "./gpa-policy";
export interface GpaCourse {
  id: string;
  name: string;
  grade: "Y10" | "Y11" | "Y12";
  track: "AP" | "A-Level";
  category: GpaCategory;
  credits: [number, number];
  included: boolean;
  passFail: boolean;
  condition?: string;
}
export const policyInfo = {
  applies: "2023年秋季及以后入学",
  source:
    "用户提供的 AIP Course Information and Grading Policies 截图（2026-11-07核对）",
  revision: "截图未标注修订日期",
  note: "学校可调整课程安排；请核对实际修读课程和成绩单。",
};
export const gpaCourses: GpaCourse[] = [];
function add(
  track: GpaCourse["track"],
  grade: GpaCourse["grade"],
  category: GpaCategory,
  credits: [number, number],
  names: string[],
  passFail = false,
  condition?: string,
) {
  for (const name of names)
    gpaCourses.push({
      id: `${track}:${grade}:${name}`,
      name,
      track,
      grade,
      category,
      credits,
      included: !passFail,
      passFail,
      condition,
    });
}
for (const track of ["AP", "A-Level"] as const) {
  add(track, "Y10", "P", [1, 1], ["English Language Arts"]);
  add(track, "Y10", "P", [0, 0], ["College Readiness"], true);
  add(
    track,
    "Y10",
    "P",
    [0.25, 0.25],
    ["Drama", "Debate", "Public Speaking", "Critical Reading & Writing"],
  );
  add(track, "Y10", "CH", [0.5, 0.5], ["Chinese"]);
  add(
    track,
    "Y10",
    "CH",
    [0.25, 0.25],
    ["Mathematics", "Biology", "Chemistry", "Physics"],
  );
  add(track, "Y10", "CH", [0, 0.25], ["History", "Geography"]);
  add(
    track,
    "Y10",
    "CH",
    [0, 0],
    [
      "General Knowledge",
      "Information Technology",
      "Music & Arts",
      "Physical Education",
    ],
    true,
  );
  add(track, "Y11", "P", [1, 1], ["Y11 English Literature & Composition"]);
  add(track, "Y11", "H", [0.5, 0.5], ["Honors Debate"]);
  add(
    track,
    "Y11",
    "P",
    [0.5, 0.5],
    ["Drama", "Public Speaking", "Critical Reading & Writing"],
  );
  add(track, "Y11", "CH", [0.5, 0.5], ["Chinese"]);
  add(track, "Y11", "CH", [0.25, 0], ["Physics", "Politics"]);
  add(track, "Y11", "CH", [0, 0], ["Physical Education"], true);
  add(track, "Y12", "P", [1, 1], ["Y12 English Literature & Composition"]);
  add(
    track,
    "Y12",
    "P",
    [0.5, 0.5],
    ["Drama", "Public Speaking", "Critical Reading & Writing"],
  );
  add(track, "Y12", "CH", [0.5, 0], ["Chinese"]);
  add(track, "Y12", "CH", [0.25, 0], ["Mathematics"]);
  add(track, "Y12", "CH", [0, 0], ["Physical Education"], true);
}
add(
  "AP",
  "Y10",
  "P",
  [1, 1],
  ["Pre-AP Calculus", "Pre-AP Physics", "Pre-AP Economics"],
);
add("AP", "Y10", "P", [0.5, 0.5], ["Pre-AP Chemistry", "Pre-AP Biology"]);
add(
  "AP",
  "Y10",
  "H",
  [1, 1],
  [
    "Accelerated AP Calculus BC",
    "AP Macroeconomics",
    "AP Microeconomics",
    "Accelerated AP Physics 1 & 2",
  ],
);
add(
  "AP",
  "Y10",
  "H",
  [1, 1],
  ["English 10: Pre-AP Seminar", "AP Physics 1"],
  false,
  "2024年及以后入学",
);
add("AP", "Y10", "H", [0.5, 0.5], ["Pre-AP World History"]);
add("AP", "Y11", "H", [1.25, 1.25], ["English 11: AP Seminar"]);
add(
  "AP",
  "Y11",
  "H",
  [1, 1],
  [
    "AP Statistics",
    "AP Calculus BC",
    "AP Microeconomics",
    "AP Macroeconomics",
    "AP Physics 1 & 2",
    "AP Human Geography",
    "AP World History",
    "AP Chemistry",
    "AP Biology",
    "Integrated AP Physics C: Mech. & E&M",
  ],
);
add(
  "AP",
  "Y12",
  "H",
  [1, 1],
  [
    "AP Computer Science A",
    "AP Physics 2",
    "Advanced Math",
    "AP Environmental Science",
    "AP World History",
    "Integrated AP Physics C: Mech. & E&M",
    "AP Chemistry",
    "AP Microeconomics",
    "AP Macroeconomics",
  ],
);
add(
  "AP",
  "Y12",
  "H",
  [1.25, 1.25],
  ["AP English Language & Composition", "AP Research"],
);
add(
  "A-Level",
  "Y10",
  "P",
  [0.5, 0.5],
  ["Pre-A Level Chemistry", "Pre-A Level Biology", "Pre-A Level Economics"],
);
add(
  "A-Level",
  "Y10",
  "P",
  [1, 1],
  ["Pre-A Level Physics", "Pre-A Level Mathematics"],
);
add("A-Level", "Y10", "H", [1, 1], ["AS & A Level Mathematics"]);
add(
  "A-Level",
  "Y11",
  "H",
  [1, 1],
  [
    "AS Level Chemistry",
    "AS Level Biology",
    "AS Level Economics",
    "AS & A Level Mathematics",
    "AS Level Further Mathematics",
  ],
);
add(
  "A-Level",
  "Y12",
  "H",
  [1, 1],
  [
    "A Level Physics",
    "A Level Chemistry",
    "A Level Biology",
    "A Level Economics",
    "AS & A Level Further Mathematics",
    "A Level Further Mathematics",
  ],
);
