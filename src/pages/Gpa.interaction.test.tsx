// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Gpa from "./Gpa";
import { Store } from "../components/context";
import { emptyData, type Data } from "../types";
import { mutate, load } from "../db";
import { initialGpaSettings } from "../utils/gpa-entry";
let current: Data;
const toast = vi.fn();
function Harness({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  return (
    <Store.Provider
      value={{
        data,
        now: new Date(),
        message: "",
        toast,
        update: async (fn) => {
          const next = await mutate(fn);
          current = next;
          setData(next);
          return true;
        },
      }}
    >
      <Gpa />
    </Store.Provider>
  );
}
async function mount(data = emptyData()) {
  await mutate(() => data);
  current = data;
  return render(<Harness initial={data} />);
}
async function addCourse(name: string, score: string) {
  fireEvent.click(screen.getByRole("button", { name: "添加课程" }));
  const search = screen.getByRole("combobox", { name: "搜索课程" });
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: name } });
  fireEvent.click(
    screen.getByRole("option", {
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    }),
  );
  fireEvent.change(screen.getByPlaceholderText("例如 98、88/A- 或 A-"), {
    target: { value: score },
  });
  fireEvent.click(screen.getByRole("button", { name: "确认添加" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
  toast.mockClear();
});
afterEach(cleanup);
describe("GPA 简洁流程（真实 IndexedDB 写入）", () => {
  it("计算设置只显示年级与课程体系按钮，保留旧范围和已有成绩", async () => {
    const data = emptyData();
    data.preferences.gpaSettings = {
      year: "2025–2026",
      grade: "Y11",
      track: "AP",
      period: "S2Final",
      mode: "draft",
    };
    data.gpaDraft = [
      {
        id: "existing",
        name: "AP Biology",
        year: "2025–2026",
        grade: "Y11",
        period: "S2Final",
        category: "H",
        score: 98,
        letter: null,
        credits: 1,
        included: true,
        passFail: false,
      },
    ];
    await mount(data);
    fireEvent.click(screen.getByText("计算设置", { exact: true }));
    for (const label of ["学年", "成绩阶段", "查看内容", "快速估算草稿"])
      expect(screen.queryByText(label, { exact: true })).toBeNull();
    expect(
      screen.getByRole("button", { name: "高二" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "高一" }));
    await waitFor(() =>
      expect(current.preferences.gpaSettings?.grade).toBe("Y10"),
    );
    expect(current.gpaDraft?.[0].score).toBe(98);
    fireEvent.click(screen.getByRole("button", { name: "高二" }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "AP Biology 成绩" }),
      ).toBeTruthy(),
    );
  });
  it("Psychology 可搜索并自动使用已确认的 1 学分", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "添加课程" }));
    const picker = screen.getByRole("combobox", { name: "搜索课程" });
    fireEvent.focus(picker);
    fireEvent.change(picker, { target: { value: "psych" } });
    fireEvent.click(screen.getByRole("option", { name: /^AP Psychology/ }));
    fireEvent.change(screen.getByPlaceholderText("例如 98、88/A- 或 A-"), {
      target: { value: "86/B+" },
    });
    expect(
      (screen.getByRole("button", { name: "确认添加" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(screen.queryByLabelText("课程类别")).toBeNull();
    expect(screen.queryByLabelText("本学期学分")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "确认添加" }));
    await waitFor(() =>
      expect(current.gpaDraft?.[0]).toMatchObject({
        name: "AP Psychology",
        category: "H",
        credits: 1,
        score: 86,
        letter: "B+",
      }),
    );
  });
  it("中方课程类别在课程详情中显示中文，内部备份代码不变", async () => {
    await mount();
    await addCourse("Chinese", "90");
    fireEvent.click(screen.getByRole("button", { name: "Chinese" }));
    expect(
      (screen.getByRole("option", { name: "中方课程" }) as HTMLOptionElement)
        .value,
    ).toBe("CH");
    expect(current.gpaDraft?.[0].category).toBe("CH");
  });
  it("A/B/D/F：连续添加、直接改分、刷新恢复，正式记录不被草稿覆盖", async () => {
    const data = emptyData();
    data.gpa = [
      {
        id: "official",
        name: "AP Biology",
        year: "2026–2027",
        grade: "Y11",
        period: "S1Final",
        category: "H",
        score: 70,
        letter: null,
        credits: 1,
        included: true,
        passFail: false,
      },
    ];
    data.preferences.gpaSettings = initialGpaSettings(
      data.preferences,
      new Date(2026, 10, 7),
    );
    const view = await mount(data);
    await addCourse("AP Biology", "98");
    expect(
      within(screen.getByRole("region", { name: "当前 GPA" })).getByText(
        "4.30",
      ),
    ).toBeTruthy();
    await addCourse("AP Calculus BC", "88");
    await addCourse("AP Physics 2", "90/A");
    await addCourse("AP Chemistry", "A-");
    expect(current.gpaDraft).toHaveLength(4);
    expect(current.gpa?.[0].score).toBe(70);
    expect(screen.getByText("已计算 4 门课程 · 共 4.00 学分")).toBeTruthy();
    const field = screen.getByRole("textbox", { name: "AP Calculus BC 成绩" });
    fireEvent.change(field, { target: { value: "94" } });
    await waitFor(() =>
      expect(
        current.gpaDraft?.find((r) => r.name === "AP Calculus BC")?.score,
      ).toBe(94),
    );
    expect(
      within(screen.getByRole("region", { name: "当前 GPA" })).getByText(
        "4.08",
      ),
    ).toBeTruthy();
    view.unmount();
    const restored = await load();
    render(<Harness initial={restored} />);
    expect(
      (
        screen.getByRole("textbox", {
          name: "AP Calculus BC 成绩",
        }) as HTMLInputElement
      ).value,
    ).toBe("94");
    expect(current.gpa?.[0].score).toBe(70);
  });
  it("C：批量只要求未知课程补齐信息，重复和错误行可见，确认才写入", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "粘贴多门成绩" }));
    fireEvent.change(screen.getByRole("textbox", { name: "多门成绩" }), {
      target: {
        value:
          "AP Biology 98/A+\nAP Calculus BC 88/A-\nAP Physics 2 90/A\nMy Elective 86/B+\nAP Biology 98/A+\n错误行",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "预览成绩" }));
    expect(current.gpaDraft ?? []).toHaveLength(0);
    expect(screen.getByText(/第 5 行课程重复/)).toBeTruthy();
    expect(screen.getByText(/第 6 行/)).toBeTruthy();
    const submit = screen.getByRole("button", {
      name: "确认导入 4 门课程",
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    const unknown = screen
      .getByText("My Elective", { exact: true })
      .closest(".gpa-preview")!;
    fireEvent.change(
      within(unknown as HTMLElement).getByLabelText("课程类别"),
      { target: { value: "H" } },
    );
    const credits = within(unknown as HTMLElement).getByLabelText("本学期学分");
    await userEvent.setup().type(credits, "0.5");
    expect((unknown.querySelector("details") as HTMLDetailsElement).open).toBe(
      true,
    );
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(current.gpaDraft).toHaveLength(4));
    expect(
      current.gpaDraft?.find((r) => r.name === "My Elective")?.credits,
    ).toBe(0.5);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("E：课程详情和显式保存，重复确认不增加记录，学校等级优先", async () => {
    await mount();
    await addCourse("AP Calculus BC", "88/A+");
    fireEvent.click(screen.getByRole("button", { name: "AP Calculus BC" }));
    expect(screen.getByText(/按分数换算为 A-，学校等级为 A\+/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("本学期学分"), {
      target: { value: "0.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "应用修改" }));
    await waitFor(() => expect(current.gpaDraft?.[0].credits).toBe(0.5));
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    fireEvent.click(screen.getByRole("button", { name: "保存本次成绩" }));
    expect(current.gpa ?? []).toHaveLength(0);
    const save = screen.getByRole("button", { name: "确认保存" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(current.gpa).toHaveLength(1));
    expect(current.gpaDraft).toHaveLength(1);
    fireEvent.change(
      screen.getByRole("textbox", { name: "AP Calculus BC 成绩" }),
      { target: { value: "50" } },
    );
    await waitFor(() => expect(current.gpaDraft?.[0].score).toBe(50));
    expect(current.gpa?.[0].letter).toBe("A+");
    expect(current.gpa?.[0].score).toBe(88);
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    fireEvent.click(screen.getByRole("button", { name: "保存本次成绩" }));
    fireEvent.click(screen.getByRole("button", { name: "确认保存" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(current.gpa?.[0].score).toBe(88);
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    fireEvent.click(screen.getByRole("button", { name: "保存本次成绩" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: /更新 1 门同名正式成绩/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "确认保存" }));
    await waitFor(() => expect(current.gpa?.[0].score).toBe(50));
    expect(current.gpa).toHaveLength(1);
  });
  it("课程搜索支持键盘，非法分数不覆盖上次有效成绩", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "添加课程" }));
    const user = userEvent.setup();
    const picker = screen.getByRole("combobox", { name: "搜索课程" });
    await user.type(picker, "AP Biology");
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    fireEvent.change(screen.getByPlaceholderText("例如 98、88/A- 或 A-"), {
      target: { value: "98" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认添加" }));
    await waitFor(() => expect(current.gpaDraft).toHaveLength(1));
    const field = screen.getByRole("textbox", { name: "AP Biology 成绩" });
    fireEvent.change(field, { target: { value: "101" } });
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(current.gpaDraft?.[0].score).toBe(98);
  });
});
