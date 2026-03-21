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

脚本会同步这些系统文件：

- 前端与构建：`app.js`、`index.html`、`styles.css`、`slides.css`
- 构建脚本：`scripts/build-site.mjs`、`scripts/content-utils.mjs`、`scripts/generate-posts-index.mjs`
- 导出脚本：`scripts/export-pdf.js`、`scripts/generate-wechat-article.js`、`scripts/md-to-slides.js`
- 部署配置：`.github/workflows/deploy-pages-direct-upload.yml`、`wrangler.toml`、`_headers`
- 基础元信息：`package.json`、`README.md`、`.gitignore`、`.node-version`

脚本会自动把品牌与项目名从 Jerry 版替换为 Irene 版。

## 维护原则

- 新功能先在 `jerry-notes` 做，再同步到 `irene-notes`
- 内容类改动只留在各自 repo，不互相覆盖
- 如果新增了公共脚本或公共页面文件，把它加入 `scripts/sync-system-from-jerry.mjs` 的 `SYNC_FILES`
