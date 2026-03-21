# Irene Notes 同步说明

目标：两套站点内容完全独立，但系统层尽量保持一致。

当前约定：

- `jerry-notes` 是系统功能的上游来源
- `irene-notes` 保留独立内容与独立品牌
- `posts/`、`assets/files/`、`.obsidian/` 不参与系统同步

## 一次同步怎么做

在 `irene-notes` 目录执行：

```bash
npm run sync:from-jerry
npm run build
git diff
```

如果只是想先看会改哪些文件：

```bash
node scripts/sync-system-from-jerry.mjs ../jerry-notes --dry-run
```

## 当前同步范围

脚本现在分两类处理：

1. 自动同步稳定共享文件
   - 部署与基础配置：`.dev.vars.example`、`.github/workflows/deploy-pages-direct-upload.yml`、`.gitignore`、`.node-version`、`wrangler.toml`、`_headers`
   - 认证与访问控制：`functions/_lib/feishu-auth.js`、`functions/api/auth/feishu/*`、`functions/posts/_middleware.js`、`functions/posts/[slug].js`、`functions/posts/posts.json.js`
   - 通用脚本：`scripts/export-pdf.js`、`scripts/generate-posts-index.mjs`、`scripts/generate-wechat-article.js`、`scripts/slides-data-to-md.js`
   - 通用样式/模板：`slides.css`、`slides-template.md`
   - `package.json`
     - 以上游为主
     - 但会保留 Irene 本地独有的 script/dependency 键

2. 仅报告差异，不自动覆盖的混合文件
   - `README.md`
   - `index.html`
   - `app.js`
   - `styles.css`
   - `scripts/build-site.mjs`
   - `scripts/content-utils.mjs`
   - `scripts/md-to-slides.js`
   - `functions/_lib/post-access.js`
   - `functions/[slug].js`
   - `functions/slides/_middleware.js`
   - `functions/slides/[slug].js`

这些文件已经混合了“共享引擎能力”和“Irene 站点自己的结构/文案/路由约定”。
脚本会在输出里把它们列入 `manualReviewFiles`，提醒你人工判断是否要移植上游改动。

脚本仍会自动把品牌与项目名从 Jerry 版替换为 Irene 版。

## 维护原则

- 新功能先在 `jerry-notes` 做，再同步到 `irene-notes`
- 内容类改动只留在各自 repo，不互相覆盖
- 新增共享文件时，先判断它是“稳定共享文件”还是“混合文件”
- 只有稳定共享文件才加入自动同步清单
- 如果某个文件同时承载站点结构、品牌文案或本地路由，不要再做整文件覆盖同步
