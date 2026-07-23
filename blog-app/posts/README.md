# posts/ — 文章来源文件夹

本文件夹是全站文章的**唯一来源**。首页、文章列表页、归档页、文章详情页都从这里读取文章。

## 如何新增一篇文章

1. 复制 `_template.md`，改名为 `<文章id>.md`（id 只用英文/数字/连字符，例如 `my-first-post.md`）。
2. 填写顶部 `---` 之间的 frontmatter（元数据），并在下方写正文（Markdown）。
3. 把文件保存到本文件夹。
4. 回到 `blog-app/` 目录，运行一次生成命令：

   ```bash
   node build.js
   ```

5. 刷新页面，新文章就会出现在首页「最新文章」和「文章」列表里。

## frontmatter 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期，格式 `YYYY-MM-DD`（决定排序，越新越靠前） |
| `tag` | 否 | 列表卡片上的标签文字 |
| `tagClass` | 否 | 标签配色：`tag-test` / `tag-vue` / `tag-python` / `tag-css` / `tag-devops`（缺省 `tag-react`） |
| `cover` | 否 | 封面图路径（如 `assets/covers/cover-xxx.png`）；留空则使用默认渐变 |
| `excerpt` | 否 | 摘要，显示在卡片上 |
| `tags` | 否 | 详情页底部标签，逗号分隔，如 `Playwright, CI/CD` |
| `readTime` | 否 | 阅读时长，如 `10 分钟` |

> 正文代码块请用 `~~~` 作为围栏，不要用 ` ``` `。

## 注意

- 文件名即文章 id，会用于 URL（`post.html?id=<文件名>`），不要重复。
- 以 `_` 开头或名为 `README.md` 的文件不会被构建（用于模板和说明）。
- 删除一篇文章：直接删除对应 `.md` 文件，再运行一次 `node build.js` 即可。
