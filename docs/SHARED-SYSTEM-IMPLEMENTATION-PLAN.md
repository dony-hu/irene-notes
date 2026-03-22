# 共享系统实施计划

目标：在不拆第三个 shared repo 的前提下，让 `jerry-notes` 成为系统上游；`irene-notes` 只保留站点配置、内容和品牌资源。

本计划对应的设计背景见：

- [共享系统设计](./SHARED-SYSTEM-DESIGN.md)

## 一、实施原则

1. 先拆“配置”和“系统”，再做系统替换
2. 先做低风险配置抽取，不先动 slide 路由
3. Jerry 和 Irene 在每个阶段都保持可构建、可部署
4. 任何阶段都不动 `posts/` 内容语义
5. 不覆盖 Jerry 当前工作区里已有的无关本地改动

## 二、阶段划分

### 阶段 A：站点配置抽取

目标：把站点身份和品牌资源从硬编码里抽出来。

交付物：

- 两个仓库都新增 `site.config.mjs`
- 两个仓库都新增共享的 `site-shell.mjs`
- `index.html` 开始通过统一 DOM 锚点接配置
- `app.js` 开始通过配置读取 `themeStorageKey`
- `build-site.mjs` 能把配置文件一起带进 `dist/`

本阶段不做：

- 不统一前端交互逻辑
- 不统一 slide 路由
- 不修改访问控制策略

验收：

- 两站都能正常构建
- 页面标题、favicon、banner、站点标题、footer 来自 `site.config.mjs`
- 两站主题切换 key 不再硬编码在 `app.js`

### 阶段 B：收敛共享前端壳层

目标：让 `index.html` 的页面骨架尽量一致。

交付物：

- `index.html` 结构向共享模板靠拢
- 站点差异仅通过 DOM 配置位体现
- 不再在 HTML 里硬编码站点名、图标和 banner 路径

风险：

- Irene / Jerry 当前头部和筛选区结构不同
- 需要决定 Jerry 是否吸收 Irene 的头部登录区调整

验收：

- `index.html` diff 只剩结构级别小差异，或完全一致

### 阶段 C：统一 slide 路由约定

目标：统一 webslides 的 URL 与服务端拦截方式。

推荐统一规则：

- 发布路径：`/slides/<slug>.html`
- 列表 URL：`./slides/<slug>.html`

涉及文件：

- `scripts/content-utils.mjs`
- `scripts/build-site.mjs`
- `app.js`
- `functions/[slug].js`
- `functions/slides/*`
- `functions/_lib/post-access.js`

验收：

- 两站 webslides 都走相同路由
- 未登录拦截、登录回跳、直链访问行为一致

### 阶段 D：统一前端系统行为

目标：让 `app.js` 和 `styles.css` 成为真正共享文件。

涉及：

- 标签体系与筛选交互
- 文章列表渲染
- markdown 渲染增强
- 图片预览、表格优化、viewer 工具栏
- 登录区排版和提示文案

策略：

- 先在 Jerry 选定最终行为
- 再同步到 Irene
- Irene 的本地优化需要先判断是吸收到共享系统，还是删除

验收：

- 两站 `app.js` / `styles.css` diff 显著收缩，最好归零

### 阶段 E：收缩同步脚本

目标：让 `sync-system-from-jerry.mjs` 只同步共享系统，不再大量报 mixed files。

预期：

- 自动同步：`index.html`、`app.js`、`styles.css`、`functions/**`、`scripts/**`
- 永久排除：
  - `posts/**`
  - `assets/**`
  - `site.config.mjs`
  - 可选的 repo 说明文档

验收：

- `--dry-run` 不再把前端主文件列为 `manualReviewFiles`

## 三、字段拆分清单

第一批必须进 `site.config.mjs` 的字段：

- `siteId`
- `siteTitle`
- `siteDescription`
- `footerText`
- `domain`
- `themeStorageKey`
- `assets.faviconHref`
- `assets.faviconType`
- `assets.bannerHref`
- `assets.bannerAlt`
- `deploy.pagesProjectName`
- `deploy.wranglerName`

第二批视阶段推进决定：

- `aboutText`
- `navItems`
- `authCopy`
- `webslidesPublicPrefix`

## 四、本轮实施范围

当前迭代已完成阶段 A，并推进阶段 B 的首页壳层收敛。

具体动作：

1. 新增 `docs/SHARED-SYSTEM-IMPLEMENTATION-PLAN.md`
2. 在 Irene 新增 `site.config.mjs`
3. 在 Jerry 新增 `site.config.mjs`
4. 新增共享的 `site-shell.mjs`
5. 修改两个仓库的 `index.html`
6. 修改两个仓库的 `app.js`
7. 修改两个仓库的 `scripts/build-site.mjs`
8. 把登录区 UI 调整并入共享壳层收敛
9. 把索引筛选区结构向统一模板靠拢
10. 分别构建验证

本轮明确不做：

- 不统一 `app.js` 的全部行为
- 不统一 `styles.css` 的全部样式
- 不改 slide 路由
- 不改同步脚本策略

## 五、当前进展快照（2026-03-22）

已完成：

1. Jerry / Irene 都已通过 `site.config.mjs` 和 `site-shell.mjs` 承接站点身份
2. 两站首页标题区、登录区、viewer 工具栏 DOM 已明显靠拢
3. Jerry 已吸收 Irene 这轮登录区和筛选面板 UI 改造
4. 两个仓库都已重新 `npm run build` 成功
5. `index.html` diff 已明显缩小，当前主要剩品牌字段和少量站点文案差异

仍未完成：

1. `styles.css` 还没有收敛到可自动同步
2. `app.js` 还保留各自的前端行为差异
3. slide 路由仍是两个系统的主要结构差异
4. `sync-system-from-jerry --dry-run` 仍会把前端主文件列为 manual review

## 六、风险与回滚

主要风险：

- `app.js` 切成 module 后出现运行时时序问题
- `site.config.mjs` 没被正确复制到 `dist/`
- HTML 锚点命名不一致导致配置未生效

回滚方式：

- 单独回滚 `site.config.mjs` / `site-shell.mjs` 接线提交
- 因为本轮不动数据和路由，回滚成本较低

## 七、完成标志

本轮完成后，应满足：

1. 两个仓库都存在 `site.config.mjs`
2. 两个仓库都存在同名同逻辑的 `site-shell.mjs`
3. 标题 / favicon / banner / footer 由配置控制
4. `themeStorageKey` 由配置控制
5. 两站都能 `npm run build` 成功
