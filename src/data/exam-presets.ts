export interface OfficialExam {
  id: string;
  name: string;
  board: "College Board" | "Cambridge International" | "Pearson Edexcel";
  year: number;
  season: string;
  region: string;
  subject: string;
  paper: string;
  session: string;
  precision: "day" | "range" | "unknown";
  date: string;
  end: string;
  source: string;
  checked: string;
  kind: "常规" | "补考" | "考季概览";
}
const ap =
  "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates";
const late = ap + "/late-testing-dates";
const cam =
  "https://www.cambridgeinternational.org/Images/766283-june-2027-zone-5-timetable.pdf";
const cam26 =
  "https://www.cambridgeinternational.org/Images/757650-november-2026-zone-5-timetable.pdf";
const pearson =
  "https://qualifications.pearson.com/content/dam/pdf/Support/Examination-timetables-for-International-Advanced-Levels/ial-january-2027-final.pdf";
const apRows: [string, string, string, string][] = [
  ["mechanics", "Physics C: Mechanics", "05-03", "Session 1"],
  ["biology", "Biology", "05-03", "Session 2"],
  ["micro", "Microeconomics", "05-04", "Session 2"],
  ["physics1", "Physics 1: Algebra-Based", "05-05", "Session 2"],
  ["electricity", "Physics C: Electricity and Magnetism", "05-05", "Session 2"],
  ["physics2", "Physics 2: Algebra-Based", "05-06", "Session 1"],
  ["world", "World History: Modern", "05-06", "Session 1"],
  ["chemistry", "Chemistry", "05-06", "Session 2"],
  ["macro", "Macroeconomics", "05-07", "Session 2"],
  ["calculus-ab", "Calculus AB", "05-10", "Session 1"],
  ["calculus-bc", "Calculus BC", "05-10", "Session 1"],
  ["statistics", "Statistics", "05-11", "Session 2"],
  ["csa", "Computer Science A", "05-12", "Session 2"],
  ["psychology", "Psychology", "05-14", "Session 2"],
];
const apLate: Record<string, [string, string]> = {
  mechanics: ["05-20", "Session 2"],
  biology: ["05-19", "Session 1"],
  micro: ["05-19", "Session 1"],
  physics1: ["05-19", "Session 1"],
  electricity: ["05-20", "Session 1"],
  physics2: ["05-21", "Session 2"],
  world: ["05-18", "Session 2"],
  chemistry: ["05-20", "Session 1"],
  macro: ["05-21", "Session 1"],
  "calculus-ab": ["05-20", "Session 2"],
  "calculus-bc": ["05-20", "Session 2"],
  statistics: ["05-21", "Session 1"],
  csa: ["05-20", "Session 1"],
  psychology: ["05-21", "Session 1"],
};
export const officialExams: OfficialExam[] = [
  ...apRows.flatMap(([id, name, date, session]) =>
    (["常规", "补考"] as const).map((kind) => ({
      id: `ap-2027-${id}-${kind}`,
      name: `AP ${name}`,
      board: "College Board" as const,
      year: 2027,
      season: "2027 年 5 月",
      region: "官方全球日期表；开考时刻须按学校所在地区另核对",
      subject: name,
      paper: "整科考试",
      session: kind === "常规" ? session : apLate[id][1],
      precision: "day" as const,
      date: "2027-" + (kind === "常规" ? date : apLate[id][0]),
      end: "",
      source: kind === "常规" ? ap : late,
      checked: "2026-11-06",
      kind,
    })),
  ),
  ...(
    [
      ["2026-11-11", "Economics", "9708/32", "PM"],
      ["2026-11-11", "Chemistry", "9701/13", "AM"],
      ["2026-11-12", "Biology", "9700/13", "AM"],
      ["2027-04-28", "Mathematics", "9709/13", "AM"],
      ["2027-05-05", "Economics", "9708/22", "PM"],
      ["2027-05-10", "Physics", "9702/42", "PM"],
      ["2027-05-12", "Physics", "9702/22", "PM"],
      ["2027-06-07", "Economics", "9708/12", "PM"],
      ["2027-06-10", "Physics", "9702/12", "PM"],
    ] as const
  ).map(([date, subject, paper, session]) => ({
    id: `caie-${date.slice(0, 4)}-${paper}`,
    name: `${subject} · ${paper}`,
    board: "Cambridge International" as const,
    year: Number(date.slice(0, 4)),
    season: date.startsWith("2026") ? "2026 November" : "2027 June",
    region: "Administrative Zone 5（必须核对学校行政区）",
    subject,
    paper,
    session,
    precision: "day" as const,
    date,
    end: "",
    source: date.startsWith("2026") ? cam26 : cam,
    checked: "2026-11-06",
    kind: "常规" as const,
  })),
  ...(
    [
      ["01-08", "Mathematics", "WMA11 01", "P1", "Morning"],
      ["01-11", "Economics", "WEC11 01", "Unit 1", "Afternoon"],
      ["01-11", "Physics", "WPH11 01", "Unit 1", "Afternoon"],
      ["01-11", "Chemistry", "WCH11 01", "Unit 1", "Morning"],
      ["01-13", "Economics", "WEC12 01", "Unit 2", "Morning"],
      ["01-13", "Physics", "WPH12 01", "Unit 2", "Afternoon"],
      ["01-13", "Mathematics", "WMA12 01", "P2", "Afternoon"],
      ["01-15", "Mathematics", "WMA13 01", "P3", "Afternoon"],
      ["01-19", "Mathematics", "WMA14 01", "P4", "Morning"],
      ["01-20", "Economics", "WEC14 01", "Unit 4", "Afternoon"],
    ] as const
  ).map(([date, subject, code, paper, session]) => ({
    id: `ial-2027-jan-${code}`,
    name: `${subject} · ${paper} (${code})`,
    board: "Pearson Edexcel" as const,
    year: 2027,
    season: "2027 January IAL",
    region: "International centres；AM/PM 不是中国本地具体时刻",
    subject,
    paper: code,
    session,
    precision: "day" as const,
    date: "2027-" + date,
    end: "",
    source: pearson,
    checked: "2026-11-06",
    kind: "常规" as const,
  })),
  {
    id: "ap-2027-season",
    name: "AP 常规考季概览",
    board: "College Board",
    year: 2027,
    season: "2027 年 5 月",
    region: "全球官方日期表；具体时间以学校通知为准",
    subject: "考季概览",
    paper: "非个人考试",
    session: "",
    precision: "range",
    date: "2027-05-03",
    end: "2027-05-14",
    source: ap,
    checked: "2026-11-06",
    kind: "考季概览",
  },
];
