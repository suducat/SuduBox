import { Github, Copy, MessageCircle } from "lucide-react";
import { PageHead } from "./UI";
import { useStore } from "./context";
import { copy } from "../utils/logic";
export function Author() {
  const { toast } = useStore();
  const openGithub = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    event.preventDefault();
    const url = event.currentTarget.href;
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } catch {
      toast("无法打开浏览器，请复制网址后访问");
    }
  };
  return (
    <>
      <section className="panel author-card">
        <img
          className="author-avatar"
          src="./author-suducat.png"
          width="112"
          height="112"
          alt="suducat 的 GitHub 头像"
        />
        <h3>suducat</h3>
        <a
          onClick={(event) => void openGithub(event)}
          href="https://github.com/suducat"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={18} /> github.com/suducat
        </a>
        <div className="author-contact">
          <h3>问题反馈</h3>
          <p>发现 Bug，或者有什么好用的功能建议？欢迎告诉我。</p>
          <p>
            <MessageCircle size={18} /> 微信：<strong>Alex_AAj</strong>
          </p>
          <button
            onClick={() =>
              void copy("Alex_AAj")
                .then(() => toast("微信号已复制"))
                .catch(() => toast("复制失败，请手动复制 Alex_AAj"))
            }
          >
            <Copy size={16} />
            复制微信号
          </button>
          <a
            onClick={(event) => void openGithub(event)}
            href="https://github.com/suducat/SuduBox/issues"
            target="_blank"
            rel="noreferrer"
          >
            在 GitHub 提交问题
          </a>
        </div>
      </section>
    </>
  );
}
