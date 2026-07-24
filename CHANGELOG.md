# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构。

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
