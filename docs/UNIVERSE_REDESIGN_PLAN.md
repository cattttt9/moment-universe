# 《此刻宇宙》沉浸式升级诊断与实施计划

更新日期：2026-07-25

## 1. 诊断范围

本轮诊断覆盖用户提供的入口页、文字输入页、结果页截图，以及当前 `src/`、测试、构建与部署配置。
视觉证据保存在：

- `artifacts/audit/before/01-intro.png`
- `artifacts/audit/before/02-sentence.png`
- `artifacts/audit/before/03-result.png`

## 2. 当前技术栈

- React 19 + TypeScript + Vite 7
- Three.js 原生场景与 GLSL Shader
- GSAP 生成转场
- Canvas 2D 文字粒子与海报导出
- Vitest + Testing Library + ESLint
- localStorage 本地档案
- GitHub Actions / GitHub Pages 静态部署

项目已经具备单一 WebGL 舞台、确定性随机、八种宇宙原型、三档自动画质、海报导出和资源释放机制，
不需要更换框架或重建脚手架。

## 3. 当前页面与数据流

```text
intro
  → sentence
  → parameters
  → generating
  → universe
```

`App.tsx` 保存阶段、文字、三个参数、生成配置和本地档案。`UniverseStage` 在整个流程中持续存在，
由 `CameraRig`、远景星场、中景星尘、近景微粒、程序化星云和后期处理共同渲染。

生成数据路径为：

```text
文字 + 参数
  → buildUniverseSeed
  → UniverseConfig
  → UniverseVisualProfile
  → UniverseBlueprint
  → WebGL / 生成转场 / 海报 / 本地档案
```

## 4. 截图审计

### 入口页

优点是文学气质明确，暖黑和宋体建立了识别度；主要问题是亮度动态范围过窄，标题、星尘和背景被压在
同一平面。右侧斜切装饰没有空间功能，矩形按钮又把体验拉回普通落地页。

### 文字输入页

排版有秩序，但左右两栏与背景完全分离，输入行为只产生很弱的粒子回声。交互仍被理解为表单填写，
没有“仪器正在捕获一句话”的观测反馈。

### 结果页

主体只有一个发光球和扁平粒子环。天体材质、轨道系统、遮挡、星云体积与镜头景深不足，截图之间的
构图差异主要依赖色板和粒子分布；信息层过暗，用户也很难发现可交互对象。

### 可访问性风险

- 多处小字和轨道线对比度偏低。
- 主要提示依赖视觉和鼠标，键盘与触摸等价路径不足。
- 长动画虽支持 `prefers-reduced-motion`，但缺少可见的画质控制。
- 结果页按钮长期可见且尺寸偏小，既干扰画面，也不利于触摸。

截图只能确认可见的层级与对比度，焦点顺序、读屏标签、真实触摸手势和持续帧率需要运行态验收。

## 5. Three.js 使用方式与当前性能

当前版本使用原生 Three.js，而不是 React Three Fiber。共享舞台由一个 RAF 驱动，粒子位置由
`BufferGeometry` 预生成，连续运动放在 Shader 中；页面隐藏后暂停渲染，卸载时释放纹理、材质、
几何体、后期处理与 WebGL context。这些结构应保留。

现有性能风险：

- `preserveDrawingBuffer` 常开，便于截图但增加显存和带宽成本。
- 远景与中景粒子虽然分层，但色温、尺寸和分布差异不足，付出了粒子成本却没有得到足够纵深。
- 生成结果的多层雾化依赖径向 Sprite，重叠后容易形成平面光斑。
- 运行时降级只降低 DPR 并关闭后期处理，没有用户手动画质覆盖。
- 构建和测试在受限环境首次执行时出现 `esbuild spawn EPERM`；这是环境权限问题，不是项目代码错误。

## 6. 三天体拖动失败的根因

当前“校准”并不存在三颗可自由移动的天体。页面实际渲染三个独立 `OrbitDial`：

- 每个控件只能把一个值映射到固定圆周角度；
- 三个控件之间没有共享坐标、距离、速度或引力关系；
- 没有 Raycaster、拖拽平面、抓取偏移或二维投影；
- 松手后没有速度状态，因此不可能产生惯性；
- 背景 WebGL 舞台设置了 `pointer-events: none`，不能命中场景天体；
- 参数页的按钮会直接开始生成，不存在稳定结构与长按核心完成条件。

因此这不是局部事件 Bug，而是交互模型与需求不一致，必须重构。

## 7. 保留范围

- React 阶段流和本地隐私原则
- 共享 `UniverseStage` 与单 RAF 架构
- `CameraRig`、三层基础粒子和低帧率降级思路
- 哈希、种子随机和八种 archetype builder
- 文字粒子转场、海报导出、本地档案、GitHub Pages
- 既有测试和严格 TypeScript / ESLint 约束

## 8. 重构范围

- 用 WebGL 三体引力校准替换三个 `OrbitDial`
- 让共享 Canvas 在校准和结果阶段接收指针事件
- 增加抓取偏移、Pointer Capture、触摸阻滚、惯性和边界
- 增加曲线引力线、粒子流、引力波纹、核心稳定判定与长按完成
- 将校准关系映射到能量、秩序和波动，并进入 seed
- 增加程序化银河极远景与更明显的近中远视差
- 扩展蓝图为恒星、行星、轨道、星云和稀有现象
- 结果页 HUD 改为活动时出现、静止后淡出
- 增加手动画质控制、环境音开关、截图与分享入口
- 生成过程改为与场景形成同步的九阶段演出，移除虚假百分比

## 9. 新组件与模块结构

```text
src/
├─ components/
│  ├─ GravityCalibration/
│  │  ├─ GravityCalibration.tsx
│  │  └─ GravityCalibration.module.css
│  ├─ IntroScreen/
│  ├─ GenerationTransition/
│  ├─ UniverseInfo/
│  └─ UniverseResult/
├─ engine/
│  ├─ universeGenerator.ts
│  ├─ seededRandom.ts
│  └─ particleSystem.ts
├─ scene/
│  ├─ UniverseStage.ts
│  ├─ GravityCalibrationField.ts
│  ├─ GalaxyBackdrop.ts
│  ├─ ProceduralNebula.ts
│  ├─ CameraRig.ts
│  └─ PostProcessing.ts
├─ hooks/
│  ├─ useCosmicAudio.ts
│  └─ useQualityLevel.ts
└─ types/
   └─ universe.ts
```

## 10. 实施顺序

1. 先完成三天体 WebGL 交互和状态回写，并为投影、稳定判定与 seed 增加测试。
2. 再提高极远景、远景、中景、近景的速度、亮度、尺寸和色温差。
3. 扩展确定性蓝图和最终天体系统，保证连续十个 seed 有构图级差异。
4. 重写生成演出和结果 HUD，补齐画质、声音、截图、分享与移动端路径。
5. 执行 lint、typecheck、test、build；在桌面和移动视口完整走通流程并检查控制台。
6. 保存前后截图，完成 `design-qa.md`，只在无 P0/P1/P2 问题时交付。

## 11. 验收重点

- 校准页三颗天体都能被鼠标和触摸拖动，抓取时不跳跃，松手有受限惯性。
- 天体距离即时改变曲线亮度、粒子流、脉冲和稳定指数。
- 稳定后长按中心核心进入生成，不再依赖普通“下一步”按钮。
- 同一 seed 完整复现；不同 seed 至少在主体位置、镜头、行星、轨道、星云和现象中出现多项差异。
- 入口、输入、校准、生成、结果共享同一空间并通过镜头连续过渡。
- 平衡画质优先接近 60 FPS，后台暂停，低性能设备减少粒子与后期效果。
