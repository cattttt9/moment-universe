# Product Design QA — 《此刻宇宙》沉浸式升级

## Final result

final result: passed

## Comparison target

- Source visual truth:
  - `artifacts/audit/before/01-intro.png` — 用户提供的升级前入口页，2552 × 1274 px
  - `artifacts/audit/before/03-result.png` — 用户提供的升级前结果页，2552 × 1274 px
- Implementation evidence:
  - `artifacts/audit/after/01-intro.png` — 桌面入口页，1440 × 900 CSS px，deviceScaleFactor 1
  - `artifacts/audit/after/02-calibration.png` — 桌面校准页，1440 × 900 CSS px，deviceScaleFactor 1
  - `artifacts/audit/after/03-result-hud.png` — 桌面结果页，1440 × 900 CSS px，deviceScaleFactor 1
  - `artifacts/audit/after/04-mobile-intro.png` — 移动入口页，390 × 844 CSS px，deviceScaleFactor 1
  - `artifacts/audit/after/05-mobile-calibration.png` — 移动校准页，390 × 844 CSS px，deviceScaleFactor 1
- Combined comparison:
  - `artifacts/audit/after/compare-intro.png`
  - `artifacts/audit/after/compare-result.png`

用户提供的参考截图为 2552 × 1274 的超宽画幅，浏览器实现证据为 1440 × 900。对比图将左右证据分别
归一到 960 × 540，仅用于判断构图、层级、亮度关系和设计语言，不把归一化造成的非等比缩放当成布局缺陷。

## State

- 入口：初始苏醒状态，标题、银河光带和观测坐标可见。
- 校准：三颗天体处于稳定结构，中心核心可完成校准。
- 结果：HUD 显示，恒星、行星、轨道、星尘和银河极远景可见。
- 移动端：390 × 844 竖屏入口与校准状态。

## Full-view comparison evidence

### Entrance

升级后保留了暖黑、宋体、档案小字和非对称排版，但标题层级更明确；原先接近静态噪点的背景变为可识别的
银河带、远景星群和近中远视差。矩形主按钮被观测坐标替代。没有发现标题裁切、底部信息冲突或移动端溢出。

### Calibration

升级前没有同状态截图；运行态证据显示三颗差异化 WebGL 天体、弯曲引力线、粒子流、稳定指数、中心波纹和
实时参数处于同一画面。桌面拖拽后稳定指数从 91 变为 85，惯性衰减后变为 54，证明反馈不是静态装饰。

### Result

升级前主体为单一发光球与扁平粒子环。升级后同一画面包含主恒星、程序化表面行星、卫星/星环概率、不同倾角
轨道、银河极远景和可淡出的观测记录。主体从单点居中变为非对称多天体构图，仍保持克制的暖黑视觉语言。

## Focused region comparison

- Typography: 中文展示字继续使用宋体/思源宋体兼容栈；标题光学重量与用户参考一致，小型仪器文本使用等宽字体。
- Spacing: 桌面入口的标题、文案和坐标按钮保持纵向节奏；移动端改为单列并保留安全区。
- Colors: 维持深黑、低饱和暖金与少量冷青，不回到满屏蓝紫霓虹。
- Image quality: 所有宇宙元素由 WebGL、Shader、BufferGeometry 和程序化噪声生成，没有使用全屏星空图片或拉伸素材。
- Copy: 首页使用“宇宙不会重复此刻”；结果数据和 seed 均来自当前生成配置。
- Controls: 三体拖拽、键盘完成、画质切换、HUD 自动淡出和分享链接均完成运行态检查。

## Comparison history

### Iteration 1

- [P2] 移动端校准场横向裁切两颗天体。
  - Evidence: 首次 390 × 844 截图中左、右天体部分位于视口外。
  - Fix: 在 `GravityCalibrationField.setViewport` 中为竖屏使用独立场景缩放，并保持核心与 HUD 对齐。
  - Post-fix evidence: `artifacts/audit/after/05-mobile-calibration.png` 中三颗天体完整可见。

- [P2] 小型移动天体命中区低于可接受触摸尺寸。
  - Evidence: 竖屏场景缩放后可见球体约 16–24 px。
  - Fix: 为每颗天体增加透明 Raycaster 命中球，视觉尺寸不变，命中半径扩大 2.35 倍。
  - Post-fix evidence: TypeScript 与 ESLint 通过；命中结构与可见 mesh 共享世界矩阵。

### Iteration 2

- [P2] 初版隐藏键盘完成按钮在浏览器自动化中不能可靠触发。
  - Fix: 改为覆盖中心光核的真实圆形交互区；鼠标/触摸长按 1.2 秒完成，Enter/Space 提供键盘等价路径。
  - Post-fix evidence: 浏览器使用 Enter 进入生成阶段，DOM 切换为“PHASE 01 / 正在读取引力参数”。

## Browser verification

- Desktop viewport: 1440 × 900
- Mobile viewport: 390 × 844
- Primary interactions tested:
  - 入口进入
  - 中文输入
  - 三体拖拽
  - 参数和稳定指数实时回写
  - 惯性衰减
  - 键盘完成校准
  - 九阶段生成
  - 结果 HUD 自动淡出/唤回
  - 分享链接
  - 高画质切换到平衡
- Page console warn/error: 0
- Mobile result DOM completed and exposed all expected controls. The final mobile screenshot capture was blocked by the browser host policy after the DOM verification; this is recorded as an evidence limit, not a page failure.

## Residual P3 / hardware gaps

- 仍需在真实 iPhone Safari 与 Android Chrome 上复验触摸惯性、pointercancel、双指缩放和 PNG 文件落盘。
- 环境音为程序化低频氛围层，尚未在多种扬声器上做响度一致性校准。
- 用户提供的参考图与实现图宽高比不同，未来可增加固定 16:9 视觉回归基线。
