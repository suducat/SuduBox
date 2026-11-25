import { useEffect, useState } from "react";
import { DoorOpen } from "lucide-react";
import { Modal } from "./UI";

export const STUDY_ROOMS_ANNOUNCEMENT_KEY =
  "sudubox.announcement.study-rooms.v1";
let shownThisSession = false;

export function StudyRoomsAnnouncement() {
  const [open, setOpen] = useState(() => {
    if (shownThisSession) return false;
    try {
      return localStorage.getItem(STUDY_ROOMS_ANNOUNCEMENT_KEY) !== "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!open) return;
    // Mark on display, so navigating away without dismissing cannot show it again.
    shownThisSession = true;
    try {
      localStorage.setItem(STUDY_ROOMS_ANNOUNCEMENT_KEY, "1");
    } catch {
      /* Still show at most once in this app session when storage is blocked. */
    }
  }, [open]);
  if (!open) return null;
  return (
    <Modal title="自习室查询已上线" close={() => setOpen(false)}>
      <div className="guide-heading">
        <DoorOpen size={26} />
        <h3>找间空教室，安心自习</h3>
      </div>
      <p>
        打开即可自动查看当前可用自习室，也可以选择星期和课表时段，查看空闲教室及下一时段安排。
      </p>
      <p className="footnote">
        支持离线使用。根据学校安排表生成，实际开放情况以学校通知为准。
      </p>
      <div className="form-actions">
        <button onClick={() => setOpen(false)}>知道了</button>
        <a
          className="button primary"
          href="#/study-rooms"
          onClick={() => setOpen(false)}
        >
          去查自习室
        </a>
      </div>
    </Modal>
  );
}
