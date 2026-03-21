---
title: 技能1：Irene Notes 普通文章发布操作指南
date: 2026-03-21
tags:
  - 操作指南
  - 发布技能
---

# 技能1：Irene Notes 普通文章发布操作指南
> 适用于发布普通技术文章、行业洞察、案例分享等文本类内容

## 一、前置准备
1. 已克隆Irene Notes仓库到本地
2. 已配置好Git推送权限
3. 内容已整理为Markdown格式

## 二、发布步骤
### 1. 创建文章文件
在仓库`posts/`目录下创建新的Markdown文件，命名规则为`[slug].md`，slug为文章的URL路径，建议使用小写字母、数字和短横线组合，例如：
```bash
cp posts/TEMPLATE.md posts/g1-product-introduction.md
```

### 2. 填写Front Matter
在文章开头填写必填元数据：
```md
---
title: 文章标题
date: 2026-03-21
tags:
  - 标签1
  - 标签2
summary: 文章摘要内容（可选，不填会自动提取正文前100字）
---
```

### 3. 编写正文
正文支持标准Markdown语法，包括标题、列表、表格、链接、图片等。

### 4. 本地预览验证
执行构建命令验证文章是否可以正常发布：
```bash
npm run build
python3 -m http.server 8787 --directory dist
```
访问`http://127.0.0.1:8787`确认文章出现在首页列表，点击可以正常查看内容。

### 5. 提交发布
执行Git命令提交代码到远程main分支：
```bash
git add .
git commit -m "feat: 新增G1产品介绍文章"
git push origin main
```

### 6. 验证线上发布
提交后等待1分钟左右，访问`https://irene-notes.pages.dev`确认文章已上线。

## 三、注意事项
- 文件名不要使用中文和特殊字符，避免URL访问异常
- Front Matter中的`date`字段格式必须为`YYYY-MM-DD`
- 如果文章是草稿状态，可以添加`draft: true`到Front Matter，不会被发布到线上
