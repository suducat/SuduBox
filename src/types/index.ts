export interface Course {
  specificDate?: string;
  teacher?: string;
  candidates?: string[];
  selectedCandidate?: string;
  source?: {
    templateId: string;
    version: string;
    sheet: string;
    cell: string;
    raw: string;
  };
  id: string;
  name: string;
  day: number;
  start: string;
  end: string;
  room: string;
  note: string;
  color: string;
}
export interface Lesson {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  content: string;
  homework: string;
  review: string;
  confused: boolean;
  resolved: boolean;
  note: string;
}
export interface Note {
  id: string;
  text: string;
  subject: string;
  date: string;
  pinned: boolean;
  done: boolean;
  created: number;
}
export interface Exam {
  id: string;
  name: string;
  date: string;
  time: string;
  subject: string;
  color: string;
  pinned: boolean;
  done: boolean;
}
export interface Word {
  id: string;
  word: string;
  meaning: string;
  library: string;
  note: string;
  mastered: boolean;
  created: number;
}
export interface Focus {
  id: string;
  date: string;
  duration: number;
  subject: string;
  start: number;
  end: number;
}
export interface Timer {
  id: string;
  mode: "focus" | "short" | "long";
  total: number;
  remaining: number;
  started: number | null;
  originalStart: number;
  subject: string;
  elapsed: number;
}
export interface Preferences {
  aipSelections?: Record<string, Record<string, string>>;
  specialDays?: {
    date: string;
    closed: boolean;
    mode: "merge" | "replace";
    evening?: boolean;
    courses: Course[];
  }[];
  scheduleRecovery?: { courses: Course[]; savedAt: number };
  officialHidden?: boolean;
  officialIgnored?: string[];
  officialPinned?: string[];
  officialFollowed?: string[];
  legacyQuestions?: string[];
  questionBank?: { id: string; question: string; answer: string }[];
  aipIdentity?: "yes" | "no" | "";
  aipGrade?: string;
  aipGroup?: string;
  aipTimezone?: string;
  eveningEnabled?: boolean;
  eveningStart?: string;
  eveningEnd?: string;
  eveningDays?: number[];
  theme: "light" | "dark" | "system";
  schoolStart: string;
  schoolEnd: string;
  focusMinutes: number;
  shortMinutes: number;
  longMinutes: number;
}
export interface Data {
  courses: Course[];
  lessons: Lesson[];
  notes: Note[];
  exams: Exam[];
  words: Word[];
  focus: Focus[];
  favorites: string[];
  libraries: string[];
  preferences: Preferences;
  timer: Timer | null;
}
export const emptyData = (): Data => ({
  courses: [],
  lessons: [],
  notes: [],
  exams: [],
  words: [],
  focus: [],
  favorites: [],
  libraries: ["默认词库"],
  preferences: {
    theme: "light",
    schoolStart: "08:00",
    schoolEnd: "17:00",
    focusMinutes: 25,
    shortMinutes: 5,
    longMinutes: 15,
  },
  timer: null,
});
export const uid = () => crypto.randomUUID();
