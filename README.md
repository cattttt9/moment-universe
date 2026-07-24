# 此刻宇宙

> 把一句没有说出口的话，变成一片只属于你的星云。

《此刻宇宙》是一件纯前端互动数字艺术作品。用户输入一句此刻想留下的话，
自主调节能量、秩序与波动，网页会通过确定性算法生成一片可互动、可保存的动态星云。
它不是心理测试，也不会分析或上传用户的表达。

## 核心体验

```text
输入一句话 → 调节当前状态 → 文字碎裂为粒子 → 生成动态星云
→ 与星云互动 → 导出个人宇宙档案
```

## 功能预览

> 仓库保持纯文本与轻量源码；正式截图可在首次公开部署后补充到 `docs/images/`。

- 欢迎页：三层 WebGL 星空、镜头漂移与电影片尾式排版
- 文字输入：1–80 字本地输入与字符粒子回声
- 天体参数盘：能量、秩序、波动三个可拖动、可触摸的轨道控制器
- 生成转场：文字粒子采样、坍缩与星核出现
- 动态星云：八种确定性原型、程序化雾化、分层视差与触摸/鼠标交互
- 宇宙档案：Canvas 高分辨率 3:4 PNG 海报
- 本地档案：最近 20 条结果，仅保存在浏览器中

在线访问地址：`https://<your-name>.github.io/<repository>/`

## 技术栈

- Vite、React、TypeScript
- Three.js、GSAP、Canvas API
- localStorage
- Vitest、ESLint、Prettier

项目没有服务端、数据库、账号系统或需要密钥的第三方接口。

## 本地运行

需要 Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

Vite 会输出本地访问地址。

## 质量检查与构建

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

构建产物位于 `dist/`。

## GitHub Pages 部署

1. 把仓库推送到 GitHub。
2. 在仓库 `Settings → Pages → Build and deployment` 中选择 **GitHub Actions**。
3. 推送到 `main` 后，`.github/workflows/deploy.yml` 会执行测试、构建并发布 `dist/`。
4. 工作流会根据 `GITHUB_REPOSITORY` 自动使用仓库子路径，不假设仓库名称。
5. 自定义域名部署可将仓库变量 `VITE_BASE_PATH` 设置为 `/`。

完整说明见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## ZIP 静态分发

```bash
npm run build
npm run package:zip
```

ZIP 会生成到 `artifacts/`。解压后应通过任意静态文件服务器访问；部分浏览器不允许从
`file://` 直接运行 ES Module。

## 目录说明

```text
src/components/  页面阶段和可复用界面
src/engine/      哈希、随机数、星云生成与 Three.js 场景
src/scene/       共享舞台、三层空间、镜头、交互与后处理
src/hooks/       动态偏好、质量等级等 React hooks
src/stores/      本地档案与应用状态辅助
src/utils/       分享参数、海报与通用工具
src/tests/       单元与组件测试
docs/            计划、进度、决策、部署和技术总结
```

## 隐私

- 用户输入默认只在当前浏览器内处理。
- 不发送远程请求，不接入分析、广告或 AI 接口。
- 本地档案使用 `localStorage`，可随时清空。
- 分享链接默认只包含种子和参数，不包含原始文字。

## 浏览器兼容性

目标浏览器为当前主流 Chrome、Edge、Android Chrome，以及支持 WebGL 2 的移动 Safari。
WebGL 不可用时会显示明确降级说明；海报合成依赖 Canvas。

## 当前完成情况

版本 `0.1.0` 已完成 MVP，当前分支包含未发布的沉浸式视觉引擎更新。真实进度见
[docs/PROGRESS.md](docs/PROGRESS.md)，
已完成能力见 [docs/DONE.md](docs/DONE.md)，未完成事项见 [docs/TODO.md](docs/TODO.md)。

## 人工测试清单

- [x] 桌面端生成流程正常（1440×900 浏览器验收）
- [x] 手机端生成流程正常（390×844 浏览器验收）
- [x] 中文输入正常
- [x] 英文与数字由同一 Unicode 输入和哈希路径支持
- [x] 海报预览与 PNG 生成状态正常
- [x] 减少动态效果具备独立 JS 与 CSS 路径
- [x] WebGL 资源具备完整释放路径，页面切换无控制台错误
- [x] 返回修改后可以重新生成
- [x] 鼠标圆周拖动、轨道点击和键盘参数调整
- [x] 三个指定案例生成明显不同的原型、配色与构图
- [x] 页面全流程保持单一 WebGL Canvas

## 后续计划

- 更多海报比例和可选择的视觉主题
- 可选的无障碍高对比模式
- 更细致的离线性能基准和视觉回归测试

## 已知问题

- 尚未在真实 iPhone Safari 与 Android Chrome 硬件上验证触摸手势和 PNG 文件落盘。
- 自动质量等级暂不支持用户手动覆盖；运行时低帧率会自动降低像素比并关闭 Bloom。
- 仅提供 3:4 海报；分享链接解析保留在内部，界面只鼓励图片分享。

完整记录见 [docs/TODO.md](docs/TODO.md) 与
[docs/TECHNICAL_SUMMARY.md](docs/TECHNICAL_SUMMARY.md)。

## 开源协议

[MIT License](LICENSE)
