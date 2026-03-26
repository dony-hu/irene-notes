---
title: 自动发版验证：Irene Notes 部署烟雾测试
date: 2026-03-27
tags:
  - 测试
  - 部署
  - 自动发版
visibility: public
summary: 用一篇最小公开文章验证 Irene Notes 的 GitHub Actions 到 Cloudflare Pages 自动发版链路是否恢复正常。
---

# 自动发版验证：Irene Notes 部署烟雾测试

这是一篇用于验证自动发版链路的测试文章。

如果你能在站点首页看到它，并且正文可以正常打开，说明这次从 GitHub Actions 到 Cloudflare Pages 的自动部署已经恢复正常。

## 本次验证点

- 新文章可以进入文章列表
- `posts/posts.json` 能正确更新
- 正文 Markdown 能正常打开
- 当前仓库会自动部署到 `irene-notes`，不再串到 `jerry-notes`

## 备注

这篇文章后续可以删除，不影响系统功能。
