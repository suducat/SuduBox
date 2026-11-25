import { useEffect, useState } from "react";
import { studyRoomsAt } from "../utils/study-rooms";

export function useStudyRooms() {
  const [state, setState] = useState(() => studyRoomsAt(new Date()));
  useEffect(() => {
    const refresh = () => setState(studyRoomsAt(new Date()));
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return state;
}
