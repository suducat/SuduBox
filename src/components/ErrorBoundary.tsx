import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="loading">
        <h1>页面暂时遇到问题</h1>
        <p>
          已保存的本地记录仍保留在浏览器。请刷新重试；若问题持续，请先尝试在设置中导出备份。
        </p>
        <button className="primary" onClick={() => location.reload()}>
          刷新重试
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
