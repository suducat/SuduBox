# GitHub Pages 与手机安装

正式网址：https://suducat.github.io/SuduBox/

只使用公开仓库 `suducat/SuduBox` 的 GitHub Pages，无服务器、登录、数据库服务或收费云资源。

## 安装

- iPhone / iPad：用 Safari 打开正式网址，分享 → 添加到主屏幕 → 添加。如出现“作为网页 App 打开”，保持开启。站内浏览器缺少此菜单时，请转到 Safari。
- Android：用 Chrome 等支持的浏览器打开，在“关于 → 安装到主屏幕”选择“安装应用”；若没有按钮，使用浏览器菜单的“安装应用 / 添加到主屏幕”。具体名称由浏览器决定。
- 已安装后从主屏幕打开为独立窗口，不再显示安装步骤。普通浏览器也能完整使用，无强制安装弹窗。

## 离线与数据

首次联网完整打开，等待“关于”页显示缓存就绪。课表、GPA、便签、公式、单词本、倒计时、番茄钟、随机抽题和文本整理使用本地资源，可离线运行。GitHub 链接需联网；系统发音、通知及后台执行取决于设备。手机锁屏可能暂停网页运行，不保证后台闹铃。

新版就绪时显示非阻塞提示。保存好当前输入后再点“保存并刷新”；其他标签激活更新不会刷新正在编辑的标签。Service Worker 只更新当前路径的静态缓存，不清理 IndexedDB 或 localStorage，也不干预同域其他项目缓存。

学习数据在每个浏览器/主屏幕应用本地保存，不自动同步。隐私模式、清理网站数据、系统存储回收可能导致数据丢失；Safari 与主屏幕应用可能使用独立存储，需通过设置中的 JSON 备份迁移。更换设备或安装入口前建议先备份。GitHub Pages 的网络可达性因地区和网络而异，不能保证所有国内网络均可访问；本项目没有外部 API 或必要 CDN。

## 自动部署

`.github/workflows/deploy.yml` 在 main 推送时执行，也支持 Actions → Deploy SuduBox to GitHub Pages → Run workflow。

依赖安装后运行测试，再运行含 TypeScript 检查的正式构建；从 `actions/configure-pages` 的 `base_path` 获取真实子路径，然后上传 dist，通过 `actions/deploy-pages` 发布。部署串行执行，不会同时互相覆盖；只有部署任务具有 Pages 写入和 OIDC 权限，使用 GitHub 自动令牌，不需个人 Token。

Vite 默认 `base: './'` 保留给桌面/通用静态构建；Pages 工作流通过构建参数指定 `/SuduBox/`。Hash 路由如 `/SuduBox/#/gpa` 刷新仍请求项目首页。Manifest 的 scope/start_url/id 和图标相对项目根解析；SW 注册路径使用构建的 BASE_URL。

本地验证 Pages 构建：

```bash
npm ci
npm test
npm run build -- --base /SuduBox/
node scripts/check-offline.mjs
npm run preview
```

Mac 版继续运行 `npm run desktop:build`，默认相对路径不变，不经过 Pages 工作流。

如需手动设置：仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions；无需添加域名或付款信息。

依据：[GitHub 官方 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Vite 部署说明](https://vite.dev/guide/static-deploy)、[Apple 主屏幕说明](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)、[Android Chrome 网页应用](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid)。
