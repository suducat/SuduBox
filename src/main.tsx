import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Provider } from "./components/Store";
import "./styles/global.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider>
        <App />
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);

import { registerOffline } from "./utils/pwa";
registerOffline();

// Resize scrollable dialogs to the area above an on-screen keyboard.
if (!("__TAURI_INTERNALS__" in window) && window.visualViewport) {
  const viewport = window.visualViewport;
  const resize = () => {
    document.documentElement.style.setProperty(
      "--visible-height",
      `${viewport.height}px`,
    );
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active.matches("input,textarea,select") &&
      active.getBoundingClientRect().bottom > viewport.height - 24
    )
      active.scrollIntoView({ block: "nearest", behavior: "auto" });
  };
  viewport.addEventListener("resize", resize);
  resize();
}
