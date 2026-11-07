import type { GpaCourse } from "./gpa-courses";

// Offered in the supplied AIP timetable as AP PSY. AP courses use Honors rules,
// but Psychology credits are absent from the supplied official Course List.
// Zero is a placeholder only: importing is blocked until the user confirms credits.
export const supplementalGpaCourses: GpaCourse[] = [
  {
    id: "supplement:AP:Psychology",
    name: "AP Psychology",
    grade: "Y11",
    track: "AP",
    category: "H",
    credits: [0, 0],
    included: true,
    passFail: false,
    needsCreditConfirmation: true,
    aliases: ["Psychology", "Psych", "AP PSY", "心理学", "AP 心理学"],
  },
];
