import { SafeForm } from "../components/SafeForm";
import { Feedback } from "../components/RoundTwo";
import { useState, useEffect } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  ArrowLeft,
  Construction,
} from "lucide-react";
import { useStore } from "../components/context";
import { PageHead, Panel, Modal } from "../components/UI";
import { download, validateBackup, localDate } from "../utils/logic";
import { type Data } from "../types";
import { tools } from "../data/tools";
export function Preferences() {
  const { data, update, toast } = useStore();
  const p = data.preferences;
  const [start, setStart] = useState(p.schoolStart);
  const [end, setEnd] = useState(p.schoolEnd);
  return (
    <>
      <PageHead
        title="外观与偏好"
        description="让速度工具箱更适合你的学习习惯。"
      />
      <div className="settings-stack">
        <Panel title="首页提示">
          <button
            onClick={() => {
              localStorage.removeItem("sudubox.hideBanner");
              toast("首页提示已恢复，返回工作台即可查看");
            }}
          >
            重新显示首页提示
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("sudubox.hideEncouragement");
              toast("鼓励语已恢复");
            }}
          >
            重新显示鼓励语
          </button>
        </Panel>

        <Panel title="外观主题">
          <div className="theme-options">
            {(
              [
                ["light", "浅色", "明亮、清爽的学习空间"],
                ["dark", "深色", "夜间学习，柔和舒适"],
                ["system", "跟随系统", "随设备外观自动切换"],
              ] as const
            ).map(([value, label, desc]) => (
              <button
                className={`theme-option ${p.theme === value ? "selected" : ""}`}
                key={value}
                onClick={() =>
                  void update((d) => ({
                    ...d,
                    preferences: { ...d.preferences, theme: value },
                  }))
                }
              >
                <div className={`theme-preview ${value}`}>
                  <i />
                  <i />
                  <i />
                </div>
                <strong>{label}</strong>
                <small>{desc}</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="学校作息">
          <SafeForm
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (start >= end) {
                toast("每日结束时间应晚于开始时间");
                return;
              }
              if (
                await update((d) => ({
                  ...d,
                  preferences: {
                    ...d.preferences,
                    schoolStart: start,
                    schoolEnd: end,
                  },
                }))
              )
                toast("作息已保存，作为新增课程的参考起始时间");
            }}
          >
            <div className="form-grid">
              <label>
                每日开始时间
                <input
                  required
                  type="time"
                  value={start}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setStart(inputValue);
                  }}
                />
              </label>
              <label>
                每日结束时间
                <input
                  required
                  type="time"
                  value={end}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    return setEnd(inputValue);
                  }}
                />
              </label>
            </div>
            <p className="footnote">
              学校作息用作参考；每节课时间可以单独设置，允许录入课后课程。
            </p>
            <button className="primary">保存学校作息</button>
          </SafeForm>
          <div className="callout">
            <strong>固定每周课表</strong>
            <p>第一版支持周一至周日固定课程。A/B Day 与单双周课表敬请期待。</p>
          </div>
        </Panel>
        <Panel title="数据保存在这里">
          <div className="inline">
            <ShieldCheck size={24} />
            <p>
              所有记录保存在当前浏览器的 IndexedDB
              中，不会上传服务器。更换设备、清除网站数据或隐私浏览可能导致记录丢失。
            </p>
          </div>
          <a className="button" href="#/backup">
            前往数据备份与恢复 →
          </a>
        </Panel>
      </div>
    </>
  );
}
export function Backup() {
  const { data, update, toast } = useStore();
  const [pending, setPending] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const count = (d: Data) =>
    d.courses.length +
    d.lessons.length +
    d.notes.length +
    d.exams.length +
    d.words.length +
    d.focus.length;
  return (
    <>
      <PageHead
        title="数据备份与恢复"
        description="把重要的积累，稳妥地留在自己手里。"
      />
      <div className="two-columns">
        <Panel title="导出全部数据">
          <div className="feature-icon">
            <Download size={28} />
          </div>
          <p>
            导出课程、课堂记录、便签、考试、单词、专注记录、收藏和偏好设置。
          </p>
          <p className="muted">
            当前共 {count(data)} 条学习记录。进行中的计时不会随备份恢复。
          </p>
          <button
            className="primary"
            onClick={async () => {
              const saved = await download(
                `速度工具箱-backup-${localDate()}.json`,
                JSON.stringify(
                  {
                    app: "SuduBox",
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    data: { ...data, timer: null },
                  },
                  null,
                  2,
                ),
              );
              if (saved) toast("备份文件已生成");
            }}
          >
            <Download size={17} />
            导出 JSON 备份
          </button>
        </Panel>
        <Panel title="从备份恢复">
          <div className="feature-icon">
            <Upload size={28} />
          </div>
          <p>
            选择 速度工具箱 JSON 备份。格式验证通过后，核对记录数量并确认覆盖。
          </p>
          <p className="muted">
            当前仅支持完整覆盖，不进行自动合并。请先导出当前数据。
          </p>
          <label className="button upload-button">
            <Upload size={17} />
            选择备份文件
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setError("");
                if (file.size > 20 * 1024 * 1024) {
                  setError("备份超过 20 MB，请使用较小的备份文件。");
                  return;
                }
                try {
                  setPending(validateBackup(JSON.parse(await file.text())));
                } catch (err) {
                  setError(
                    `导入失败：${err instanceof Error ? err.message : "文件不是有效 JSON"}。现有数据未更改。`,
                  );
                }
              }}
            />
          </label>
          {error && (
            <p role="alert" className="warning">
              {error}
            </p>
          )}
        </Panel>
      </div>
      <div className="callout">
        <HardDrive size={22} />
        <div>
          <strong>本地优先，定期备份</strong>
          <p>
            这里没有账号和云同步。建议每周备份，并将文件保存到可信的位置。备份可能包含私人笔记，请妥善保管。
          </p>
        </div>
      </div>
      {pending && (
        <Modal
          title="确认覆盖恢复"
          close={() => {
            if (!busy) setPending(null);
          }}
        >
          <p>备份中包含 {count(pending)} 条学习记录：</p>
          <div className="backup-counts">
            <span>{pending.courses.length} 门课程</span>
            <span>{pending.lessons.length} 条课堂笔记</span>
            <span>{pending.notes.length} 张便签</span>
            <span>{pending.exams.length} 场考试</span>
            <span>{pending.words.length} 个单词</span>
            <span>{pending.focus.length} 次专注</span>
          </div>
          <p className="warning">
            当前 {count(data)}{" "}
            条记录将被覆盖，进行中的计时也将清除。此操作不可撤销，请先备份现有数据。
          </p>
          <div className="form-actions">
            <button disabled={busy} onClick={() => setPending(null)}>
              取消
            </button>
            <button
              disabled={busy}
              className="danger"
              onClick={async () => {
                setBusy(true);
                if (await update(() => pending)) {
                  toast("数据已恢复");
                  setPending(null);
                }
                setBusy(false);
              }}
            >
              确认覆盖并恢复
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function OfflineStatus() {
  const [status, setStatus] = useState(
    import.meta.env.DEV
      ? "开发模式不启用离线缓存，请使用生产预览验证。"
      : "正在检查本设备的离线缓存…",
  );
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator)) {
      setStatus("此浏览器暂不支持 Service Worker，网页功能仍可正常使用。");
      return;
    }
    navigator.serviceWorker.ready
      .then(() => setStatus("离线缓存已就绪 · 此设备首次缓存完成"))
      .catch(() => setStatus("离线缓存暂不可用，请保持网络连接。"));
    const timer = setTimeout(
      () =>
        setStatus((current) =>
          current.includes("正在检查")
            ? "离线缓存尚未就绪，请保持联网并刷新重试。"
            : current,
        ),
      12000,
    );
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="callout" role="status">
      <ShieldCheck size={20} />
      <p>{status}</p>
    </div>
  );
}
export function About() {
  return (
    <>
      <PageHead
        title="关于 速度工具箱"
        description="速度工具箱 · 让学习更简单"
      />
      <section className="panel about-panel">
        <img src="./icon.svg" width="72" height="72" alt="速度工具箱 标志" />
        <h2>
          速度工具箱 <span className="badge">v1.0.0</span>
        </h2>
        <p>为中国国际高中学生打造的轻量学习效率工具箱。</p>
        <p>
          打开即用，无需登录。把课表、笔记、考试与专注放在一个安静的空间里。
        </p>
        <div className="about-values">
          <span>简单</span>
          <span>轻便</span>
          <span>实用</span>
          <span>本地优先</span>
        </div>
        <hr />
        <Feedback />
        <h3>你的数据，由你掌握</h3>
        <p>
          无需服务器、账号、数据库服务或 AI
          API。学习记录只存在当前浏览器；清除网站数据或更换设备可能丢失记录，请定期备份。
        </p>
        <h3>随时打开，安心使用</h3>
        <OfflineStatus />
        <p>
          所有必要资源随应用打包，无运行时字体或海外 CDN。HTTPS 或 localhost
          下可启用
          PWA；首次成功加载并缓存后，已实现工具可离线使用。浏览器可能回收离线缓存，首次使用仍需联网。
        </p>
        <h3>关于公式与规划功能</h3>
        <p>
          公式表为精选学习参考，不能替代课程教材。GPA、文件转换与 AI
          检测尚未实现，相关限制在各页面清晰说明。
        </p>
      </section>
    </>
  );
}
const planned: Record<
  string,
  { desc: string; items: string[]; notice: string }
> = {
  gpa: {
    desc: "让成绩规划更清晰，也让每一次计算有据可依。",
    items: [
      "0–100 成绩与学分权重录入",
      "按学校配置 GPA 转换规则",
      "自定义加权与目标 GPA 模拟",
    ],
    notice:
      "GPA 依赖学校官方规则，当前尚未核实，因此本版本不输出所谓真实 GPA。未来规则将作为独立配置模块接入。",
  },
  files: {
    desc: "常见学习文件，一站整理。先把可靠性做好。",
    items: [
      "图片转 PDF、PDF 转图片",
      "PDF 合并、拆分与页面重排",
      "研究 PPTX 与 PDF 转换的可行性",
    ],
    notice:
      "第一版不执行文件转换。未来优先实现本地图片与 PDF 处理；不承诺 PPTX 与 PDF 无损双向转换。",
  },
  ai: {
    desc: "谨慎理解文本检测，让判断回到证据。",
    items: [
      "研究第三方检测服务的适用范围",
      "展示检测依据与不确定性",
      "提供清晰的隐私与误判风险说明",
    ],
    notice:
      "AI 生成文本检测具有误判风险，不能作为学术不端认定的唯一证据。当前不调用任何 AI 服务，不收集或上传作文，也不提供虚构的 AI 率。",
  },
};
export function ComingSoon({ id }: { id: string }) {
  const item = tools.find((t) => t.id === id)!;
  const p = planned[id];
  const Icon = item.icon;
  return (
    <>
      <PageHead title={item.name} description="好工具，值得认真打磨。" />
      <section className="panel coming-soon">
        <span className="badge">规划中 · 敬请期待</span>
        <div className="soon-icon">
          <Icon size={38} />
        </div>
        <h2>{item.name}</h2>
        <p className="soon-desc">{p.desc}</p>
        <div className="planned-features">
          <h3>未来计划支持</h3>
          {p.items.map((i) => (
            <p key={i}>
              <Construction size={16} />
              {i}
            </p>
          ))}
        </div>
        <div className="callout">
          <p>{p.notice}</p>
        </div>
        <p className="footnote">当前状态：需求研究中。暂未提供上线日期。</p>
        <a className="button primary" href="#/tools">
          <ArrowLeft size={16} />
          返回工具中心
        </a>
      </section>
    </>
  );
}
