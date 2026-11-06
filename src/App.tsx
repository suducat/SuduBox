import { Author } from "./components/Author";
import { Onboarding, GUIDE_KEY } from "./components/Onboarding";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Menu,
  X,
  ChevronRight,
  Star,
  ArrowUpRight,
  Command,
} from "lucide-react";
import { tools } from "./data/tools";
import { useStore } from "./components/context";
import { PageHead, Empty } from "./components/UI";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import { Notes, Exams } from "./pages/NotesExams";
import Focus from "./pages/Focus";
import Words from "./pages/Words";
import Formulas from "./pages/Formulas";
import { RandomTool, TextTool } from "./pages/Utilities";
import { Preferences, Backup, About, ComingSoon } from "./pages/Settings";
function ToolCenter() {
  const { data, update } = useStore();
  return (
    <>
      <PageHead
        title="工具中心"
        description="简单的工具，解决具体的小事。选择一个，直接开始。"
      />
      {["学习中心", "实用工具"].map((group) => (
        <section key={group}>
          <div className="section-title">
            <h2>{group}</h2>
          </div>
          <div className="tool-grid">
            {tools
              .filter((t) => t.group === group)
              .map((t) => (
                <article className="panel tool-card" key={t.id}>
                  <div className="inline between">
                    <div className="quick-icon">
                      <t.icon size={24} />
                    </div>
                    <button
                      className={`icon-button ${data.favorites.includes(`tool:${t.id}`) ? "accent" : ""}`}
                      aria-label="固定常用工具"
                      onClick={() =>
                        void update((d) => ({
                          ...d,
                          favorites: d.favorites.includes(`tool:${t.id}`)
                            ? d.favorites.filter((x) => x !== `tool:${t.id}`)
                            : [...d.favorites, `tool:${t.id}`],
                        }))
                      }
                    >
                      <Star size={17} />
                    </button>
                  </div>
                  <a href={`#/${t.id}`}>
                    <h3>
                      {t.name}{" "}
                      {t.soon && <span className="badge">敬请期待</span>}
                    </h3>
                    <p>{t.keywords.split(" ").slice(0, 3).join(" · ")}</p>
                    <span className="subtle-link">
                      {t.soon ? "了解规划" : "打开工具"}{" "}
                      <ArrowUpRight size={15} />
                    </span>
                  </a>
                </article>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
export default function App() {
  const { data } = useStore();
  const [route, setRoute] = useState(location.hash.slice(2) || "home");
  const [guide, setGuide] = useState(
    () => localStorage.getItem(GUIDE_KEY) !== "1",
  );
  const closeGuide = () => {
    localStorage.setItem(GUIDE_KEY, "1");
    setGuide(false);
  };
  useEffect(() => {
    const open = () => setGuide(true);
    window.addEventListener("sudubox:show-guide", open);
    return () => window.removeEventListener("sudubox:show-guide", open);
  }, []);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const searchDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (searching) {
      const el = searchDialog.current;
      el?.showModal();
      return () => el?.close();
    }
  }, [searching]);
  useEffect(() => {
    const fn = () => {
      setRoute(location.hash.slice(2) || "home");
      setMenu(false);
      setSearching(false);
      setQ("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", fn);
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearching(true);
      }
      if (e.key === "Escape") {
        setSearching(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("hashchange", fn);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  const tool = tools.find((t) => t.id === route);
  useEffect(() => {
    document.title = `${tool?.name ?? "工具中心"} · 速度工具箱`;
  }, [tool]);
  const pages: Record<string, React.ReactNode> = {
    home: <Home />,
    schedule: <Schedule />,
    notes: <Notes />,
    exams: <Exams />,
    focus: <Focus />,
    words: <Words />,
    formulas: <Formulas />,
    random: <RandomTool />,
    text: <TextTool />,
    settings: <Preferences />,
    backup: <Backup />,
    about: <About />,
    author: <Author />,
    tools: <ToolCenter />,
  };
  const results = tools.filter((t) =>
    `${t.name} ${t.keywords}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="app-shell">
      {guide && <Onboarding close={closeGuide} />}
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="关闭导航"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a href="#/home" className="brand">
          <img src="./icon.svg" width="38" height="38" alt="" />
          <span>
            速度工具箱<small>学习工具箱</small>
          </span>
        </a>
        <div className="sidebar-caption">让学习更简单</div>
        <nav aria-label="主导航">
          {["主页", "学习中心", "实用工具", "设置"].map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {tools
                .filter((t) => t.group === group)
                .map((t) => (
                  <a
                    aria-current={route === t.id ? "page" : undefined}
                    className={route === t.id ? "active" : ""}
                    href={`#/${t.id}`}
                    key={t.id}
                  >
                    <t.icon size={18} />
                    <span>{t.name}</span>
                    {t.soon && <span className="nav-soon">即将</span>}
                  </a>
                ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="inline">
            <button
              aria-label="打开导航"
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <a href="#/home" className="breadcrumb-brand">
              速度工具箱
            </a>
            <ChevronRight size={14} />
            <span>{tool?.name ?? "工具中心"}</span>
          </div>
          <button
            aria-label="搜索所有工具"
            className="global-search"
            onClick={() => setSearching(true)}
          >
            <Search size={17} />
            <span>搜索工具，开始高效学习</span>
            <kbd>⌘ K</kbd>
          </button>
        </header>
        <main id="main" className="main-content" key={route}>
          {pages[route] ??
            (["gpa", "files", "ai"].includes(route) ? (
              <ComingSoon id={route} />
            ) : (
              <Empty
                title="没有找到这个页面"
                description="回到工具中心，选择需要的工具。"
                action={
                  <a href="#/tools" className="button primary">
                    返回工具中心
                  </a>
                }
              />
            ))}
        </main>
      </div>
      {searching && (
        <dialog
          ref={searchDialog}
          className="search-dialog"
          aria-label="搜索工具"
          onCancel={() => setSearching(false)}
          onClick={(e) => {
            if (e.target === searchDialog.current) setSearching(false);
          }}
        >
          <section className="search-modal">
            <div className="search-input">
              <Search size={22} />
              <input
                autoFocus
                placeholder="搜索名称、关键词或别名…"
                value={q}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  return setQ(inputValue);
                }}
              />
              <button
                className="icon-button"
                aria-label="关闭搜索"
                onClick={() => setSearching(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="search-results">
              {results.length ? (
                results.map((t) => (
                  <a
                    key={t.id}
                    href={`#/${t.id}`}
                    onClick={() => {
                      setSearching(false);
                      setQ("");
                    }}
                  >
                    <t.icon size={20} />
                    <span>
                      {t.name}
                      <small>
                        {t.group}
                        {t.soon ? " · 敬请期待" : ""}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </a>
                ))
              ) : (
                <Empty
                  title="没有找到对应工具"
                  description="试试“课表”“PDF”“SAT”或“专注”。"
                />
              )}
            </div>
            <div className="search-footer">
              <Command size={13} /> K 打开搜索 · Esc 关闭
            </div>
          </section>
        </dialog>
      )}
      {data.timer && route !== "focus" && (
        <a href="#/focus" className="floating-timer">
          ◷ {data.timer.started ? "计时进行中" : "计时已暂停"} · 返回番茄钟
        </a>
      )}
    </div>
  );
}
