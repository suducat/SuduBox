import { useEffect, useState } from "react";
import { Music2, X } from "lucide-react";
import { musicLines } from "../data/music-corner";
import { randomMusicIndex } from "../utils/music";
export function MusicCorner() {
  const [hidden, setHidden] = useState(
    () => localStorage.getItem("sudubox.hideEncouragement") === "1",
  );
  const [index, setIndex] = useState(() => randomMusicIndex(musicLines.length));
  useEffect(() => {
    if (hidden) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setIndex((current) => randomMusicIndex(musicLines.length, current));
    }, 30000);
    return () => window.clearInterval(timer);
  }, [hidden]);
  if (hidden) return null;
  const line = musicLines[index];
  return (
    <section className="music-corner" aria-labelledby="music-corner-title">
      <div className="music-corner-heading">
        <div className="music-corner-label">
          <Music2 size={20} aria-hidden="true" />
          <h2 id="music-corner-title">音乐角落</h2>
        </div>
        <button
          className="icon-button"
          aria-label="关闭音乐角落"
          onClick={() => {
            localStorage.setItem("sudubox.hideEncouragement", "1");
            setHidden(true);
          }}
        >
          <X size={17} />
        </button>
      </div>
      <blockquote>{line.text}</blockquote>
      <cite className="music-credit">
        {line.artist} ·《{line.song}》
      </cite>
    </section>
  );
}
