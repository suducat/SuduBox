import presets from "../data/aip-presets";
export function subjectKey(text: string) {
  let s = text
    .split(/[（(【]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
  s = s.replace(/^(pre\s*)?(ap|al|as)(?:\s+|$)/, "").trim();
  const map: Record<string, string> = {
    bio: "bio",
    biology: "bio",
    chem: "chem",
    che: "chem",
    chemistry: "chem",
    psy: "psy",
    psychology: "psy",
    macro: "macro",
    macroeconomics: "macro",
    ec: "macro",
    econ: "econ",
    economics: "econ",
    wh: "world history",
    "world history": "world history",
    csa: "csa",
    "computer science a": "csa",
    "ap buisness": "business",
    buisness: "business",
    business: "business",
  };
  return map[s] ?? s;
}
export function electiveModel(id: string) {
  const preset = presets.find((p) => p.id === id);
  if (!preset) throw new Error("找不到班级课表");
  const labels = new Map<string, string>();
  const sets: string[][] = [];
  for (const slot of preset.slots) {
    if (slot.options.length < 2) continue;
    const keys = [
      ...new Set(
        slot.options.map((x) => {
          const key = subjectKey(x);
          labels.set(key, x.split(/[（(【]/)[0].trim());
          return key;
        }),
      ),
    ];
    if (
      !sets.some(
        (s) => s.length === keys.length && s.every((k) => keys.includes(k)),
      )
    )
      sets.push(keys);
  }
  const conflicts = new Map<string, Set<string>>();
  for (const set of sets)
    for (const a of set)
      for (const b of set)
        if (a !== b) {
          if (!conflicts.has(a)) conflicts.set(a, new Set());
          conflicts.get(a)!.add(b);
        }
  for (const a of labels.keys())
    for (const b of labels.keys())
      if (
        a !== b &&
        /group [ab]$/.test(a) &&
        a.replace(/group [ab]$/, "") === b.replace(/group [ab]$/, "")
      ) {
        if (!conflicts.has(a)) conflicts.set(a, new Set());
        conflicts.get(a)!.add(b);
      }
  return {
    preset,
    labels,
    sets: sets.filter(
      (s) =>
        !sets.some((t) => t.length > s.length && s.every((k) => t.includes(k))),
    ),
    conflicts,
  };
}
export function chooseSubject(
  id: string,
  selection: Record<string, string>,
  key: string,
) {
  const model = electiveModel(id);
  if (!model.labels.has(key)) throw new Error("科目不属于当前班级");
  const next = { ...selection };
  if (next["subject:" + key]) {
    delete next["subject:" + key];
    return next;
  }
  for (const other of model.conflicts.get(key) ?? [])
    delete next["subject:" + other];
  next["subject:" + key] = "1";
  return next;
}
