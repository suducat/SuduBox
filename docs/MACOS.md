# 速度工具箱 macOS 桌面版

桌面版以 Tauri 2 封装现有前端，不运行本地 HTTP 服务器，不需要用户安装 Node.js，也不需要联网使用本地功能。首版面向 Apple Silicon，最低 macOS 14。Intel 安装包尚未构建验证。

## 安装和分享

构建成功后的统一输出目录为 `release/macos/`，其中：

- `速度工具箱.app`：独立应用。
- `速度工具箱.dmg`：用于分享和安装的磁盘映像。

双击 DMG，将应用拖到 Applications（应用程序），弹出磁盘映像后，从应用程序或 Launchpad 打开。分享整个 DMG 即可，不需分享项目源码、Node.js 或开发工具。只向 Apple Silicon Mac 用户分享本次构建。

测试构建仅使用本机 ad-hoc 签名，没有 Apple Developer 身份签名或公证。其他 Mac 可能受到 Gatekeeper 限制；核实文件来源后，可按系统“隐私与安全性”的提示处理，切勿关闭系统安全机制。要获得顺畅的公开分发体验，需要开发者证书及 Apple 公证。

## 数据迁移和持久化

网页版和桌面版拥有不同的存储空间，不会自动共享，也不会自动覆盖原浏览器数据。

1. 网页版进入“数据备份与恢复”，导出 JSON。
2. 桌面版进入同一页面，选择 JSON，检查数量并确认覆盖。
3. 关闭并重新打开桌面应用，确认记录仍在。
4. 在桌面版定期导出备份；备份含私人学习内容，请妥善保存。

继续使用原 IndexedDB `sudubox`（schema 1）及 localStorage。桌面配置使用固定的 WKWebView 数据存储标识，关闭应用不清空数据。更新应用时保持应用标识和存储标识不变；不要手动删除 Library 中的 WebKit 或应用数据目录。进行中的计时不会随 JSON 备份恢复。

桌面导出会显示 macOS 保存窗口；取消保存不会报告成功，课表替换前备份若取消则停止替换。导入继续使用原有文件选择、格式校验和确认覆盖流程。

## 权限

仅主窗口可以调用保存对话框，并向用户选择的路径写入文本。剪贴板仅允许写入，不读取已有内容。作者页仅授权通过系统浏览器打开 suducat 的 GitHub 主页和项目 Issues 两个固定地址，不允许打开任意网址或本地文件。未启用 shell、任意文件目录访问、摄像头、麦克风、位置、远程 API 或自动更新。CSP 限制页面资源为本地打包资源和 Tauri IPC。网页 Service Worker 在桌面环境不注册，离线资源由应用自身提供。

## 重新打包（开发者）

开发机需要 Node.js 22.12+、Rust stable 和 Xcode Command Line Tools；使用者无需安装。

```bash
npm ci
npm test
npm run desktop:build
```

项目专用 Rust 工具链（如已安装到 `.desktop-tools/`）会由构建脚本自动使用；否则使用系统 PATH 中的 Rust。`desktop:build` 会先构建前端，再由 Tauri 生成 APP、由 macOS 的 hdiutil 制作含 Applications 链接的标准只读 DMG，并复制到 `release/macos/`。原始 Tauri 输出在 `src-tauri/target/release/bundle/`。构建产物和工具链不提交 Git。

`npm run desktop:dev` 仅供开发调试；正式安装包不会连接该开发服务器。每次分享前请确认重新打包成功，勿误发旧版本。正式发版可同步更新 `package.json`、`src-tauri/Cargo.toml` 与 `src-tauri/tauri.conf.json` 的版本。

实际验收与限制见 [macOS 验收记录](MACOS-QA.md)。
