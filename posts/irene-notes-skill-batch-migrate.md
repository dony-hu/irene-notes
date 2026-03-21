---
title: 技能3：Irene Notes 批量发布与内容迁移操作指南
date: 2026-03-21
tags:
  - 操作指南
  - 批量操作
  - 内容迁移
---

# 技能3：Irene Notes 批量发布与内容迁移操作指南
> 适用于批量迁移旧博客文章、整理历史文档、一次性发布多篇内容的场景

## 一、批量发布操作步骤
### 1. 批量准备文章
将所有需要发布的Markdown文件整理好，统一放入`posts/`目录，确保每个文件都包含正确的Front Matter。

### 2. 批量校验文章有效性
执行构建命令，查看哪些文章会被发布：
```bash
npm run build
```
构建完成后会显示`Built X published posts`，表示有X篇有效文章会被发布。
如果有文章缺失必填字段，构建会失败并提示具体错误信息。

### 3. 批量导入历史文章
如果是从其他平台迁移的文章，可以使用脚本批量添加Front Matter：
```bash
# 示例脚本：批量给所有md文件添加基础Front Matter
for file in posts/*.md; do
  if ! grep -q "title:" "$file"; then
    title=$(grep -m 1 "^# " "$file" | sed 's/# //')
    date=$(date +%Y-%m-%d)
    cat > "$file.tmp" << EOF
---
title: $title
date: $date
tags:
  - 历史文章
---
EOF
    cat "$file" >> "$file.tmp"
    mv "$file.tmp" "$file"
  fi
done
```

### 4. 批量提交发布
一次性提交所有文章：
```bash
git add posts/*.md
git commit -m "feat: 批量导入20篇历史技术文章"
git push origin main
```

## 二、内容迁移注意事项
### 1. 图片迁移
- 将所有图片文件放入`assets/images/`目录
- 文章中图片引用使用相对路径：`![图片说明](../assets/images/xxx.png)`
- 构建时会自动将图片拷贝到dist目录，线上可以正常访问

### 2. 链接修正
- 文章内部链接使用相对路径：`[另一篇文章](another-post.md)`
- 外部链接使用完整URL：`[丰图官网](https://fengtu.com)`

### 3. 草稿处理
不需要发布的文章可以添加`draft: true`到Front Matter，或者移动到其他目录，不会被构建到线上。

## 三、性能优化建议
- 单次批量发布建议不超过50篇，避免构建时间过长
- 大体积图片建议先压缩再上传，单张图片不超过2MB
- 历史文章可以按年份分类到子目录，不影响发布
