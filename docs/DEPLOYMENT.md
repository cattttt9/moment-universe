# 部署说明

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run lint
npm run test
npm run build
```

产物输出到 `dist/`。使用 `npm run preview` 可以本地预览生产构建。

## Vite `base` 配置

`vite.config.ts` 按以下优先级设置基础路径：

1. 环境变量 `VITE_BASE_PATH`
2. GitHub Actions 的 `GITHUB_REPOSITORY` 推导出的 `/<repository>/`
3. 本地默认 `/`

自定义域名通常使用：

```bash
VITE_BASE_PATH=/ npm run build
```

PowerShell：

```powershell
$env:VITE_BASE_PATH='/'
npm run build
```

## GitHub Pages

1. 推送代码到 GitHub，确保默认发布分支为 `main`。
2. 打开 `Settings → Pages`。
3. 在 `Build and deployment` 选择 `GitHub Actions`。
4. 推送到 `main`，或从 Actions 页面手动运行 `Deploy to GitHub Pages`。
5. 工作流先安装锁定依赖，再执行 lint、test、build，最后发布 `dist/`。

## 自定义域名（可选）

在 `public/CNAME` 写入域名，并把仓库 Actions 变量 `VITE_BASE_PATH` 设置为 `/`。
再按 GitHub Pages 提示配置 DNS。不要把私钥或 DNS 服务密钥提交到仓库。

## ZIP 静态分发

```bash
npm run build
npm run package:zip
```

压缩包生成在 `artifacts/moment-universe-v0.1.0.zip`。解压后部署到任何静态 HTTP
服务器。由于浏览器 ES Module 安全限制，不保证直接双击 `index.html` 可用。

## 部署失败排查

- **页面空白**：确认 GitHub Pages 使用 Actions，且 Vite `base` 与仓库子路径一致。
- **资源 404**：检查是否错误设置 `VITE_BASE_PATH=/`。
- **构建失败**：本地使用相同 Node 主版本执行 `npm ci && npm run build`。
- **工作流无权限**：确认仓库 Pages 来源为 GitHub Actions，工作流具有 `pages: write`。
- **WebGL 不可用**：更新浏览器/显卡驱动，或使用页面提供的降级档案能力。
