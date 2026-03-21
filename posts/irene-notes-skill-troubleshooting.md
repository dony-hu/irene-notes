---
title: 技能4：Irene Notes 常见问题排查指南
date: 2026-03-21
tags:
  - 操作指南
  - 问题排查
  - FAQ
---

# 技能4：Irene Notes 常见问题排查指南
> 汇总发布过程中常见问题的解决方案，快速定位和解决问题

## 一、构建失败类问题
### 问题1：构建报错提示"Missing title field"
**原因**：文章缺少必填的`title`字段
**解决方案**：在文章Front Matter中添加`title: 文章标题`字段

### 问题2：构建报错提示"Missing date field"
**原因**：文章缺少必填的`date`字段
**解决方案**：在文章Front Matter中添加`date: 2026-03-21`字段，格式必须为YYYY-MM-DD

### 问题3：文章没有出现在首页列表
**原因**：
1. 文章没有Front Matter
2. Front Matter中设置了`draft: true`
3. 文件名不是`.md`后缀
**解决方案**：
1. 检查文章是否有正确的Front Matter
2. 确认没有设置`draft: true`
3. 确认文件后缀为`.md`

## 二、线上发布类问题
### 问题1：提交代码后线上没有更新
**原因**：
1. GitHub Actions构建失败
2. Cloudflare Pages缓存未更新
3. 代码没有提交到main分支
**解决方案**：
1. 登录GitHub查看Actions运行日志，确认构建是否成功
2. 按`Ctrl+F5`强制刷新页面，清除浏览器缓存
3. 确认代码提交到了main分支

### 问题2：线上文章图片不显示
**原因**：
1. 图片路径错误
2. 图片没有提交到仓库
3. 图片文件名包含中文或特殊字符
**解决方案**：
1. 检查图片路径是否为相对路径，例如`../assets/images/xxx.png`
2. 确认图片文件已经提交到GitHub仓库
3. 修改图片文件名为英文和数字组合，避免特殊字符

### 问题3：幻灯片页面404
**原因**：
1. Front Matter没有添加`type: webslides`字段
2. 访问路径错误
**解决方案**：
1. 确认幻灯片文章Front Matter包含`type: webslides`
2. 访问路径为`https://irene-notes.pages.dev/[slug].html`，注意带`.html`后缀

## 三、本地预览类问题
### 问题1：本地预览看不到最新文章
**原因**：没有重新执行构建命令
**解决方案**：每次修改文章后都需要重新执行`npm run build`，然后刷新页面

### 问题2：本地服务启动失败提示端口被占用
**原因**：8787端口被其他程序占用
**解决方案**：使用其他端口启动服务：
```bash
python3 -m http.server 8888 --directory dist
```
然后访问`http://127.0.0.1:8888`

## 四、联系支持
如果以上方案都无法解决问题，可以：
1. 查看GitHub Actions构建日志，获取具体错误信息
2. 检查本地构建输出的错误提示
3. 联系技术支持人员排查
