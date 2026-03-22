# Irene Notes 同步说明

目标：`jerry-notes` 继续做功能上游，`irene-notes` 跟进整套代码，但保留 Irene 自己的内容与抬头图。

## 保留范围

以下内容默认不参与同步覆盖：

- `posts/`
- `assets/files/`
- `site.config.mjs`
- Jerry 站点自己的 banner 文件
- `.obsidian/`

其中：

- 文章正文、文章索引、附件资料继续由 Irene 独立维护
- 站点标题、描述、抬头图、favicon、主题 key 都继续以 Irene 本地 `site.config.mjs` 为准
- `index.html` 会跟随上游结构同步，但同步脚本会自动把首页里的品牌占位重新灌回本地配置

## 一次同步怎么做

在 `irene-notes` 目录执行：

```bash
npm run sync:from-jerry
npm run build
git diff
```

如果只是先预览改动：

```bash
node scripts/sync-system-from-jerry.mjs ../jerry-notes --dry-run
```

## 同步策略

脚本现在按“代码全量同步、内容独立保留”执行：

- 同步前端与构建代码，包括 `app.js`、`styles.css`、`scripts/**`、`frontend/**`、`functions/**` 等
- 不删除 Irene 本地额外文件，只覆盖上游同路径代码
- 自动跳过文章、附件、站点配置与 Jerry 的抬头图素材
- 同步完后自动把 `index.html` 中的标题、描述、favicon、banner、页脚等站点占位改回 Irene 本地配置

## 维护原则

- 新功能先在 `jerry-notes` 做，再同步到 `irene-notes`
- 内容类改动只留在各自 repo，不互相覆盖
- 站点品牌差异尽量只放在 `site.config.mjs` 和品牌素材里
- 如果以后 Jerry 更换了新的 banner 文件名，记得把同步脚本的排除规则一起补上
