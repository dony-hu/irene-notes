# 共享系统设计（Jerry / Irene）

目标：让 `jerry-notes` 和 `irene-notes` 使用同一套网站系统；两者只保留以下差异：

- `posts/`
- 站点抬头图片
- 站点 icon

其他行为、页面结构、构建链路、认证逻辑、访问控制、部署方式都保持一致。

## 一、设计结论

当前两个仓库虽然同构，但系统层已经明显分叉：

- 前端骨架：`index.html`、`app.js`、`styles.css`
- 构建与内容管线：`scripts/build-site.mjs`、`scripts/content-utils.mjs`、`scripts/md-to-slides.js`
- 访问控制与路由：`functions/_lib/post-access.js`、`functions/[slug].js`、`functions/slides/*`

因此，这次设计不应再继续做“整文件覆盖 + 字符串替换”，而应改成：

1. `jerry-notes` 成为共享系统上游
2. 系统层改为“共享代码 + 站点配置”
3. `irene-notes` 只维护配置、内容与站点资源

## 二、文件分层

### 1. 共享系统文件

这些文件最终应完全一致，只允许从 Jerry 同步到 Irene：

- `.dev.vars.example`
- `.github/workflows/deploy-pages-direct-upload.yml`
- `.gitignore`
- `.node-version`
- `_headers`
- `package.json`
- `wrangler.toml`
- `index.html`
- `app.js`
- `styles.css`
- `slides.css`
- `slides-template.md`
- `functions/**`
- `scripts/**`

说明：

- `README.md`、`docs/` 可以不强求完全一致，允许保留 repo 说明差异
- 如果后续要极致一致，也应改为模板化文档，不建议继续手工维护两份独立版本

### 2. 站点配置文件

每个站点只保留一份配置文件，例如：

- `site.config.mjs`

建议字段：

```js
export default {
  siteId: 'irene-notes',
  siteTitle: 'Irene的个人站',
  siteDescription: '记录想法、项目和日常笔记',
  footerText: "Irene's Notes",
  domain: 'irene-notes.pages.dev',
  themeStorageKey: 'irene-notes-theme',

  assets: {
    faviconHref: './assets/tiger-mouse-favicon.png?v=202603211809',
    faviconType: 'image/png',
    bannerHref: './assets/golden-dog-banner.svg',
    bannerAlt: '大黄狗卡通标题图',
  },

  deploy: {
    pagesProjectName: 'irene-notes',
    wranglerName: 'irene-notes',
  },

  routing: {
    webslidesMode: 'slides-dir',
    webslidesPublicPrefix: '/slides/',
  },
};
```

### 3. 站点独立内容

这些文件永远不参与系统同步：

- `posts/**`
- `assets/**`

但有一个前提：

- `assets/` 中需要进一步约定，只允许保留“站点品牌资源”
- 如果某些通用 UI 资源、库文件、共享插图其实属于系统层，应迁回共享目录或改为构建生成

## 三、必须抽出的配置项

当前代码里至少有这些站点差异，不应该再硬编码在共享系统里：

### 1. 品牌与站点识别

- 页面 `<title>`
- 首页 `h1`
- 页脚文案
- 站点描述
- theme storage key

### 2. 资源入口

- favicon 地址与类型
- banner 图片地址
- banner alt 文案

### 3. 部署身份

- `package.json` 中的 `name` / `description`
- `wrangler.toml` 的 `name`
- GitHub Actions 中的 Cloudflare Pages `project-name`
- 默认线上域名

### 4. 路由约定

这是当前最关键的系统差异，必须统一。

Jerry 当前 webslides 约定：

- 列表 URL：`./slides/<slug>.html`
- 服务端资源路径：`/slides/<slug>.html`

Irene 当前 webslides 约定：

- 列表 URL：`./<slug>.html`
- 根路径函数：`/<slug>`

如果目标是“Jerry 的系统替代 Irene 的系统”，建议统一为 Jerry 的约定：

- webslides 统一发布到 `/slides/<slug>.html`

这样更清晰，系统与普通文章不会混用根路径。

## 四、设计原则

### 原则 1：共享系统里不出现站点名

共享代码中不应再硬编码：

- `Jerry`
- `Irene`
- `jerry-notes`
- `irene-notes`

这些都应该来自 `site.config.mjs`。

### 原则 2：共享系统不直接依赖站点资源名

共享代码中不应再直接引用：

- `./assets/cat-mouse-banner.svg`
- `./assets/golden-dog-banner.svg`
- `./assets/mouse-favicon.svg`
- `./assets/tiger-mouse-favicon.png`

这些都应由配置提供。

### 原则 3：内容衍生产物不属于系统层

Jerry 根目录中存在一些内容产物：

- `ai-transformation.html`
- `company-ai-weekly-report*.html`
- `enterprise-product-ai-sharing-2026-03-18-slides.html`
- `ai-transformation-data.js`

这些不应参与系统同步。设计上应将它们归类为：

- 内容源文件生成物
- 或构建产物

而不是系统源码。

### 原则 4：同步以“共享文件完全一致”为目标

最终状态应是：

- 共享系统文件在两个仓库里内容一致
- 只通过 `site.config.mjs`、`posts/`、站点品牌资源形成差异

## 五、推荐迁移方案

### 阶段 A：先抽配置，不替换行为

目标：不改变页面表现，只把硬编码站点差异搬进配置。

改动：

- 新增 `site.config.mjs`
- `index.html` 改为构建期注入配置
- `app.js` 改为读取构建注入的配置对象
- `wrangler.toml`、工作流、`package.json` 中可模板化的站点名字段收敛到配置源

收益：

- 把“品牌差异”和“系统差异”真正拆开

### 阶段 B：统一路由约定

目标：把 Irene 的 webslides 路由切到 Jerry 的系统约定。

需要统一的文件：

- `scripts/content-utils.mjs`
- `scripts/build-site.mjs`
- `app.js`
- `functions/[slug].js`
- `functions/slides/*`
- `functions/_lib/post-access.js`

风险：

- 旧的 slide 直链可能失效

建议：

- 保留一层兼容跳转
- 旧 Irene 根路径 slide 请求 301/302 到 `/slides/<slug>.html`

### 阶段 C：以前端系统为主线对齐

目标：让 Irene 直接使用 Jerry 的前端结构和交互。

涉及：

- `index.html`
- `app.js`
- `styles.css`

注意：

- Irene 最近已经做过登录区布局、提示文案、筛选区等定制
- 这部分若不先抽成共享能力或配置，会在替换时全部回退成 Jerry 版本

因此正确顺序应该是：

1. 先决定 Jerry 是否吸收 Irene 这些调整
2. 再让 Jerry 成为唯一前端上游
3. 然后同步到 Irene

### 阶段 D：收缩同步脚本

当上述分层完成后，`scripts/sync-system-from-jerry.mjs` 应简化为：

- 自动同步全部共享系统文件
- 永久跳过：
  - `posts/**`
  - `assets/**`
  - `site.config.mjs`
  - 可选的站点说明文档

这时 `manualReviewFiles` 应显著减少，最好只剩 README / docs 级别。

## 六、影响评估

### 对 Irene 的直接影响

- 前端页面结构会向 Jerry 靠齐
- slide 路由会发生变化
- 本地最近针对 Irene 的专属交互微调可能被 Jerry 行为覆盖

### 对 Jerry 的直接影响

- 需要把当前系统中混杂的站点硬编码提取掉
- 需要明确“哪些根目录 HTML/JS 是内容，不是系统”

### 对部署链路的影响

- 不大
- 当前 `_headers` 已一致
- `wrangler.toml` 与 workflow 差异主要是项目名

### 对认证与权限的影响

- 中等
- 因为 Irene 已经把“全部文章转 internal”
- 任何系统替换都必须重新验证：
  - 未登录列表
  - 文章直链
  - slides 访问控制
  - 登录回跳

## 七、验收标准

迁移完成后，两个仓库应满足：

1. 共享系统文件 diff 为 0
2. 仅以下路径允许不同：
   - `posts/**`
   - `assets/**`
   - `site.config.mjs`
   - 可选文档说明文件
3. 未登录时：
   - 两站都只显示 `public` 文章
4. 已登录时：
   - 两站都显示各自站点的 `public + internal` 文章
5. webslides：
   - 两站都使用同一 URL 规则
   - 访问控制与登录回跳行为一致
6. 同步脚本 dry run 时：
   - 不再出现 `index.html` / `app.js` / `styles.css` / `functions/*` 这类大块 manual review

## 八、建议的实施顺序

推荐按下面顺序推进：

1. 先设计并引入 `site.config.mjs`
2. 先把 Jerry 改成“无站点硬编码”的共享系统
3. 再让 Irene 接入同一套配置读取方式
4. 再统一 webslides 路由
5. 最后再收缩同步脚本和人工判断范围

不要反过来做：

- 不要先整文件覆盖 Irene 的 `index.html` / `app.js` / `styles.css`
- 不要在路由未统一前直接强推函数端同步

## 九、工作量预估

按一名熟悉当前仓库的人估算：

- 配置抽取与接线：0.5 ~ 1 天
- webslides 路由统一与兼容：0.5 ~ 1 天
- 前端系统对齐与回归验证：1 ~ 1.5 天
- 同步脚本收口与文档：0.5 天

总计：

- 约 2.5 ~ 4 天

如果只做“一次性替换，不做长期可维护设计”，可以更快，但后续每次同步都会反复返工。
