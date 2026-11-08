import type { GpaCourse } from "./gpa-courses";

// Offered in the supplied AIP timetable as AP PSY. AP courses use Honors rules,
// Psychology credits confirmed by the user on 2026-11-08: 1 credit.
export const supplementalGpaCourses: GpaCourse[] = [
  {
    id: "supplement:AP:Psychology",
    name: "AP Psychology",
    grade: "Y11",
    track: "AP",
    category: "H",
    credits: [1, 1],
    included: true,
    passFail: false,
    aliases: ["Psychology", "Psych", "AP PSY", "心理学", "AP 心理学"],
  },
];
