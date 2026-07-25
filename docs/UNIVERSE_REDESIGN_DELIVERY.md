# 《此刻宇宙》沉浸式升级交付说明

## 运行命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

质量检查：

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

项目不依赖环境变量或密钥，因此不需要 `.env.example`。

## 主要交互

1. 入口页移动指针可产生多层视差，激活观测坐标后进入文字输入。
2. 输入文字时，共享 WebGL 舞台保持连续，不发生普通页面硬切。
3. 校准页直接拖动“记忆 / 此刻 / 尚未发生”三颗天体：
   - Pointer Capture 保证拖动不中断；
   - 抓取偏移避免天体跳到指针中心；
   - 松手后保留速度并指数衰减；
   - 边界和回心力防止天体永久离场；
   - 距离改变引力曲线、粒子流、波纹、稳定指数和三个生成参数。
4. 稳定指数达到阈值后，长按中心核心 1.2 秒完成校准；Enter / Space 是键盘等价路径。
5. 生成过程分九个视觉阶段，与共享场景形成进度同步。
6. 结果页支持镜头扰动、缩放、脉冲、静谧模式、环境音、画质切换、保存、分享和重新校准。
7. 结果 HUD 在停止操作后自动淡出，移动指针、触摸或键盘操作后恢复。

## 生成算法

`createUniverseConfig` 将规范化文字、三体校准参数和当前时刻变体哈希为 8 位 seed。
同一个保存下来的 seed 对应同一宇宙；每次新的“此刻”会生成新的变体。

seed 驱动：

- 8 种宇宙 archetype；
- 8 套低饱和色板；
- 粒子数量、密度、扩散、对称、湍流、脉冲和发射；
- 6 种镜头构图预设；
- 0–6 颗程序化行星；
- 岩石、气态、冰、火山、海洋五种材质倾向；
- 大气层、星环、卫星、轨道半径、倾角、相位、自转与公转；
- 彗星、引力透镜、裂隙、黑洞、超新星余辉、星尘风和轨道共振；
- 主恒星、引力倾向、稳定指数和未观测区域等观测记录。

生产生成路径不使用散落的 `Math.random()`；所有结构变化集中由 `createSeededRandom` 派生。

## 性能优化

- 一个共享 Three.js renderer 和 RAF 贯穿所有页面阶段。
- 大量恒星、星尘和星云使用 BufferGeometry / Shader，不在 JavaScript 中逐粒子更新。
- 高、中、低三档限制粒子数和 DPR；用户可手动切换。
- 低画质关闭后期处理，高/中画质使用克制 Bloom。
- 连续低帧率窗口会降低 DPR 并关闭后期处理。
- 页面隐藏后取消 RAF，恢复时重置时间基准。
- 生成新宇宙时释放旧几何体、材质和纹理；卸载时释放 composer、renderer 和 WebGL context。
- 移动端缩减校准场景尺度、粒子数量和触摸命中成本。

## GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 中选择
GitHub Actions 后，推送到 `main` 即可构建并发布。

Vite 会从 `GITHUB_REPOSITORY` 推导子路径；自定义域名可设置：

```text
VITE_BASE_PATH=/
```

完整部署说明见 `docs/DEPLOYMENT.md`。

## 已知问题

- 尚未在真实 iPhone Safari 与 Android Chrome 硬件上完成触摸、双指缩放和 PNG 落盘矩阵。
- 程序化环境音默认关闭，首次开启必须来自用户手势。
- `preserveDrawingBuffer` 为截图保留，长时间运行的显存成本高于纯观看模式。
- 当前导出仍以 3:4 海报为主，尚未提供 1:1、9:16 和 16:9 模板。

## 后续扩展

- selective bloom 与更严格的发光分层；
- 体积星云的 3D 噪声纹理或 KTX2 体积切片；
- 多比例海报和短视频录制模式；
- 真实设备性能遥测与自动档位记忆；
- 完整视觉回归矩阵；
- 可选 WebGPU 渲染器，不替换 WebGL 兼容路径。

## 修改文件清单

核心新增：

- `src/engine/gravityCalibration.ts`
- `src/scene/GravityCalibrationField.ts`
- `src/scene/GalaxyBackdrop.ts`
- `src/hooks/useCosmicAudio.ts`
- `src/tests/gravityCalibration.test.ts`
- `docs/UNIVERSE_REDESIGN_PLAN.md`
- `design-qa.md`

主要重构：

- `src/App.tsx`
- `src/types/universe.ts`
- `src/engine/universeGenerator.ts`
- `src/scene/UniverseStage.ts`
- `src/scene/ProceduralNebula.ts`
- `src/scene/CameraRig.ts`
- `src/components/UniverseStage/*`
- `src/components/UniverseControls/*`
- `src/components/GenerationTransition/*`
- `src/components/IntroScreen/*`
- `src/components/UniverseInfo/*`
- `src/components/UniverseResult/*`
- `src/styles/global.css`
- `src/tests/engine.test.ts`
- `README.md`
- `CHANGELOG.md`
