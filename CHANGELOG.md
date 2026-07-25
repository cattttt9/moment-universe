# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构。

## [Unreleased]

### Added

- 全流程共享的 Three.js `UniverseStage`
- 远景星空、中景星尘、前景虚焦粒子与 CameraRig
- 程序化银河极远景、星尘带与分层视差
- 八种确定性宇宙原型和八套克制色板
- 三体 WebGL 引力校准、鼠标/触摸拖动、抓取偏移、惯性和扩大命中区
- 弯曲引力线、沿线粒子流、稳定核心与长按完成
- 程序化行星材质、大气层、星环、卫星、差异化轨道和稀有天文现象
- 九阶段生成演出、结果 HUD 自动淡出、环境音、画质切换和分享链接
- 实时参数预览、输入字符粒子回声和运行时帧率降档
- ACES、质量分级 Bloom、程序化雾化与星核表面流动

### Changed

- 结果页采用种子驱动的尺度、偏置、观察角度和运动形式
- 生成转场与最终宇宙共用同一 WebGL 空间
- 每次“此刻”使用时间变体生成新 seed，已保存 seed 仍可稳定复现
- 校准页从三个独立圆周滑杆改为共享空间中的三体关系

## [0.1.0] - 2026-07-24

### Added

- 欢迎页、私密文字输入与轨道式状态参数控制
- UTF-8 文本哈希、固定种子 PRNG 和确定性宇宙生成器
- 15 个文学宇宙类型与 5 个低概率隐藏类型
- 离屏 Canvas 中文像素采样和 GSAP 粒子坍缩转场
- Three.js 动态粒子云、星核、轨道和雾化效果
- 鼠标与触摸扰动、按住聚集、双击脉冲、缩放和主星回显
- 静谧模式、减少动态和 WebGL 不可用降级说明
- 1800×2400 Canvas 海报预览与 PNG 导出
- 最近 20 条 localStorage 档案、清空与恢复
- GitHub Pages Actions、动态 Vite base 和 ZIP 分发脚本
- 15 项确定性、存储、分享解析和海报模型测试

### Changed

- Three.js 结果场景改为动态加载，降低首屏 JavaScript 体积

### Fixed

- 增加 Vite CSS Modules 类型声明
- 保持 localStorage schema 版本为 TypeScript 字面量类型
- 使用 Archiver 8 的具名 `ZipArchive` API
