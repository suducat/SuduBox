// @vitest-environment jsdom
import { StrictMode } from "react";
import { expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  StudyRoomsAnnouncement,
  STUDY_ROOMS_ANNOUNCEMENT_KEY,
} from "./StudyRoomsAnnouncement";
import { Store } from "./context";
import { emptyData } from "../types";
it("shows once in StrictMode, persists on display, and never returns after dismissal/remount", () => {
  localStorage.removeItem(STUDY_ROOMS_ANNOUNCEMENT_KEY);
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
  const mount = () =>
    render(
      <StrictMode>
        <Store.Provider
          value={{
            data: emptyData(),
            now: new Date(),
            message: "",
            toast: vi.fn(),
            update: async () => true,
          }}
        >
          <StudyRoomsAnnouncement />
        </Store.Provider>
      </StrictMode>,
    );
  const view = mount();
  expect(
    screen.getByRole("heading", { name: "自习室查询已上线" }),
  ).toBeTruthy();
  expect(localStorage.getItem(STUDY_ROOMS_ANNOUNCEMENT_KEY)).toBe("1");
  expect(
    screen.getByRole("link", { name: "去查自习室" }).getAttribute("href"),
  ).toBe("#/study-rooms");
  fireEvent.click(screen.getByRole("button", { name: "知道了" }));
  expect(
    screen.queryByRole("heading", { name: "自习室查询已上线" }),
  ).toBeNull();
  view.unmount();
  mount();
  expect(
    screen.queryByRole("heading", { name: "自习室查询已上线" }),
  ).toBeNull();
  cleanup();
  vi.restoreAllMocks();
});
