# Mac v1.1.1 本地构建记录

2026-11-07，为 GPA 极简改版重新生成安装包。npm、Tauri、Rust 和应用内版本统一为 1.1.1；保留旧 v1.1.0 的具名安装包。

- 87 项测试通过。实际执行 `npm run desktop:build`，包含 TypeScript 检查、Vite 构建、Rust/Tauri 编译、应用签名及 DMG 制作。
- APP 与 DMG 输出在 `release/macos/`。最新分享文件为 `SuduBox-1.1.1-macos-arm64.dmg`，另保留通用名 `速度工具箱.dmg`。
- 应用版本读取为 1.1.1，原生可执行文件为 arm64；`codesign --verify --deep --strict` 和 `hdiutil verify` 通过。
- 包内图标与当前猫咪 Logo 的 ICNS 校验值一致。实际启动到 `tauri://localhost`，关于页显示 1.1.1，GPA 页面为单结果卡片、折叠设置与两步课程输入的新界面。
- 未改动应用标识 `com.suducat.sudubox`、WKWebView 存储标识或 IndexedDB 名称/版本，构建脚本不触及用户数据目录。未进行重置、覆盖恢复或删除个人记录。
- 本次未在桌面端提交新的验收成绩，也未重新执行全量数据迁移；草稿保存/恢复与正式记录隔离已由前一轮浏览器和真实 IndexedDB 测试覆盖。

版本要求仍为 Apple Silicon / macOS 14+。使用 ad-hoc 测试签名，没有 Apple Developer 身份签名或公证；未在另一台 Mac 上安装验证。没有上传 GitHub Release，本次交付为本地安装包。

安装：退出旧版，打开 DMG，将“速度工具箱”拖入 Applications；若同名应用已存在，选择替换，再从应用程序打开。更新前建议用应用内备份导出 JSON。分享整个具名 DMG 即可。不要删除应用数据目录或关闭 macOS 安全机制。
