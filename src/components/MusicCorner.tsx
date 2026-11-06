import { useEffect, useState } from "react";
import { Music2, RefreshCw, X, Pause, Play } from "lucide-react";
import { musicLines } from "../data/music-corner";

export function MusicCorner() {
  // Preserve the existing visibility preference; no learning data is changed.
  const [hidden, setHidden] = useState(
    () => localStorage.getItem("sudubox.hideEncouragement") === "1",
  );
  const [index, setIndex] = useState(0);
  const [automatic, setAutomatic] = useState(true);
  const next = () => setIndex((i) => (i + 1) % musicLines.length);
  useEffect(() => {
    if (hidden || !automatic) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % musicLines.length);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [hidden, automatic, index]);
  if (hidden) return null;
  return (
    <section className="music-corner" aria-labelledby="music-corner-title">
      <div className="music-corner-heading">
        <div className="music-corner-label">
          <Music2 size={20} aria-hidden="true" />
          <h2 id="music-corner-title">音乐角落</h2>
          <span>给努力一点回响，也给自己一点放松</span>
        </div>
        <button className="icon-button" aria-label="关闭音乐角落" onClick={() => {
          localStorage.setItem("sudubox.hideEncouragement", "1");
          setHidden(true);
        }}><X size={17} /></button>
      </div>
      <blockquote>{musicLines[index]}</blockquote>
      <div className="music-corner-footer">
        <small>{index + 1} / {musicLines.length} · {automatic ? "每 30 秒换一句" : "已暂停轮换"}</small>
        <div className="music-corner-actions">
          <button aria-label={automatic ? "暂停歌词轮换" : "继续歌词轮换"} onClick={() => setAutomatic((v) => !v)}>
            {automatic ? <Pause size={15} /> : <Play size={15} />}
            {automatic ? "暂停轮换" : "继续轮换"}
          </button>
          <button onClick={next}><RefreshCw size={15} />换一句</button>
        </div>
      </div>
    </section>
  );
}
