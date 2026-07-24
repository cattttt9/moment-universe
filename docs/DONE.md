# 已完成能力

所有日期均为 2026-07-24。

## 工程与质量工具

- 状态：已完成
- 文件：`package.json`、`vite.config.ts`、`eslint.config.js`、`tsconfig.app.json`
- 验证：`npm run lint`、`npm run test`、`npm run typecheck`、`npm run build` 通过

## 欢迎、输入与参数流程

- 状态：已完成
- 文件：
  - `src/components/IntroScreen/`
  - `src/components/SentenceInput/`
  - `src/components/UniverseControls/`
- 验证：
  - 桌面 1440×900 与手机 390×844 浏览器流程通过
  - 空输入有明确错误，文本限制为 80 字
  - 参数控件提供语义化 range、当前数值和键盘操作说明

## 确定性生成引擎

- 状态：已完成
- 文件：
  - `src/engine/textHash.ts`
  - `src/engine/seededRandom.ts`
  - `src/engine/universeGenerator.ts`
- 验证：
  - 相同文本和参数生成相同种子与粒子蓝图
  - 不同文本通常产生不同哈希
  - 相关单元测试通过

## 文字粒子转场

- 状态：已完成
- 文件：
  - `src/engine/textParticleSampler.ts`
  - `src/components/GenerationTransition/`
- 验证：
  - 中文原句可被离屏 Canvas 采样为粒子
  - GSAP 时间线可完成并可跳过
  - 减少动态偏好使用 0.55 秒简化时间线

## Three.js 动态星云

- 状态：已完成
- 文件：
  - `src/components/UniverseCanvas/UniverseCanvas.tsx`
  - `src/engine/particleSystem.ts`
  - `src/engine/interactionController.ts`
- 验证：
  - 桌面与手机视口正常渲染
  - 鼠标移动、双击、滚轮和主星回显人工验证无错误
  - 切换页面和刷新无重复 RAF 或控制台错误
  - 卸载代码释放 geometry、material、texture、renderer 和 WebGL context

## 海报导出

- 状态：已完成
- 文件：
  - `src/components/PosterExporter/`
  - `src/utils/posterExporter.ts`
  - `src/tests/posterModel.test.ts`
- 验证：
  - 浏览器成功生成 1800×2400 Canvas 预览
  - 所需档案字段测试完整
  - 页面报告 PNG 已交给浏览器下载
  - 内置验收浏览器未暴露下载事件，真实移动设备落盘仍列为 P1 复验

## 本地档案与恢复

- 状态：已完成
- 文件：
  - `src/stores/historyStore.ts`
  - `src/components/HistoryDrawer/`
- 验证：
  - 保存后刷新，欢迎页显示 1 条档案
  - 从抽屉恢复后配置、原句和星体编号一致
  - 非法 JSON 和非法记录测试安全返回空数组

## 静态部署与 ZIP

- 状态：已完成
- 文件：
  - `.github/workflows/deploy.yml`
  - `scripts/package-dist.mjs`
  - `docs/DEPLOYMENT.md`
- 验证：
  - 生产构建成功，Three.js 延迟分包
  - ZIP 命令生成约 1.06 MiB 的静态分发包
  - Actions 配置包含安装、lint、test、build 和 Pages 发布
