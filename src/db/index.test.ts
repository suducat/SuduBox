import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { load, mutate } from "./index";
import { emptyData } from "../types";
import { validateBackup } from "../utils/logic";
describe("IndexedDB 数据事务", () => {
  beforeEach(async () => {
    await mutate(() => emptyData());
  });
  it("保存并重新读取，独立修改不破坏其他实体", async () => {
    await mutate((d) => ({ ...d, libraries: ["默认词库", "AP Physics"] }));
    await mutate((d) => ({
      ...d,
      notes: [
        {
          id: "note-1",
          text: "作业",
          subject: "Physics",
          date: "2026-11-05",
          pinned: false,
          done: false,
          created: 1,
        },
      ],
    }));
    const result = await load();
    expect(result.libraries).toContain("AP Physics");
    expect(result.notes[0].text).toBe("作业");
  });
  it("并发写入串行读取最新值，不相互覆盖", async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        mutate((d) => ({ ...d, libraries: [...d.libraries, `词库${i}`] })),
      ),
    );
    expect((await load()).libraries).toHaveLength(9);
  });
  it("转换失败回滚，原数据可再次读取", async () => {
    await mutate((d) => ({ ...d, libraries: ["保留词库"] }));
    await expect(
      mutate(() => {
        throw new Error("模拟失败");
      }),
    ).rejects.toThrow();
    expect((await load()).libraries).toEqual(["保留词库"]);
  });
  it("备份校验失败不写入，合法恢复一次性覆盖", async () => {
    await mutate((d) => ({ ...d, libraries: ["当前数据"] }));
    expect(() => validateBackup({ version: 9, data: emptyData() })).toThrow();
    expect((await load()).libraries).toEqual(["当前数据"]);
    const restored = validateBackup({
      version: 1,
      data: { ...emptyData(), libraries: ["恢复词库"] },
    });
    await mutate(() => restored);
    expect((await load()).libraries).toEqual(["恢复词库"]);
  });
});

it("相同实体ID重复提交不会新增记录，题库与恢复点备份可校验恢复", async () => {
  const d = emptyData();
  d.preferences.questionBank = [{ id: "q", question: "旧题目", answer: "" }];
  d.preferences.scheduleRecovery = { savedAt: 1, courses: [] };
  await mutate(() => d);
  const note = {
    id: "same",
    text: "只写一次",
    subject: "",
    date: "2026-11-06",
    pinned: false,
    done: false,
    created: 1,
  };
  await Promise.all([
    mutate((d) => ({ ...d, notes: [...d.notes, note] })),
    mutate((d) => ({ ...d, notes: [...d.notes, note] })),
  ]);
  const result = await load();
  expect(result.notes).toHaveLength(1);
  expect(
    validateBackup({ version: 1, data: result }).preferences.questionBank?.[0]
      .answer,
  ).toBe("");
});

it("GPA成绩保存后重新读取并支持备份恢复，不影响便签",async()=>{
 const base=emptyData();
 base.gpa=[{id:"gpa-test",name:"Synthetic course",year:"2026–2027",grade:"Y11",period:"S1Final",category:"H",score:88,letter:"A-",credits:1,included:true,passFail:false}];
 base.notes=[{id:"synthetic-note",text:"Synthetic note",subject:"",date:"2026-11-07",pinned:false,done:false,created:1}];
 await mutate(()=>base);
 const restored=validateBackup(JSON.parse(JSON.stringify({version:1,data:await load()})));
 await mutate(()=>restored);
 expect((await load()).gpa?.[0].score).toBe(88);
 expect((await load()).notes[0].id).toBe("synthetic-note");
});
