// build.js — 扫描 posts/*.md，生成 articles-data.js（window.BLOG_ARTICLES）
//
// 用法：
//   node build.js
// 新增/修改/删除文章后，把 .md 放进 posts/，再运行一次即可。
// 以 _ 开头或名为 README.md 的文件会被忽略（用于模板与说明）。
//
// 零依赖，纯 Node 内置模块，可离线运行。

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'posts');
const OUT_FILE = path.join(__dirname, 'articles-data.js');
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #6b8aff, #8cc7ff)';

// 解析 --- ... --- 之间的 frontmatter 与正文
function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return { meta: {}, body: raw.trim() };
  const metaRaw = m[1];
  const body = raw.slice(m[0].length).trim();
  const meta = {};
  metaRaw.split(/\r?\n/).forEach(function (line) {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    if (!key) return;
    let val = line.slice(idx + 1).trim();
    if (
      (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
      (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'")
    ) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  });
  return { meta: meta, body: body };
}

function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function isIgnored(name) {
  const lower = name.toLowerCase();
  return (
    !lower.endsWith('.md') ||
    name.startsWith('_') ||
    name.startsWith('.') ||
    lower === 'readme.md'
  );
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    console.log('提示：posts/ 不存在，已创建。请把 .md 文章放进去后再运行 node build.js');
    fs.writeFileSync(OUT_FILE, 'window.BLOG_ARTICLES = [];\n', 'utf8');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(function (f) { return !isIgnored(f); });

  const articles = files.map(function (f) {
    const id = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const parsed = parseFrontmatter(raw);
    const meta = parsed.meta;
    return {
      id: id,
      title: meta.title || id,
      date: meta.date || '1970-01-01',
      tag: meta.tag || '',
      tagClass: meta.tagClass || 'tag-react',
      cover: meta.cover || DEFAULT_GRADIENT,
      excerpt: meta.excerpt || '',
      tags: toArray(meta.tags || meta.tag),
      readTime: meta.readTime || '约 8 分钟',
      content: parsed.body
    };
  });

  // 按发布日期倒序（最新在前）；date 为 YYYY-MM-DD 字符串，localeCompare 即可正确排序
  articles.sort(function (a, b) { return b.date.localeCompare(a.date); });

  const header =
    '/* ============================================================\n' +
    ' * articles-data.js — 全站文章数据源（由 build.js 自动生成，勿手改）\n' +
    ' * 文章来源：blog-app/posts/*.md\n' +
    ' * 新增文章：把 .md 放进 posts/，运行 `node build.js`\n' +
    ' * ------------------------------------------------------------\n' +
    ' * 字段说明：\n' +
    ' *   id        : 唯一标识（= 文件名，不含 .md），用于 URL post.html?id=xxx\n' +
    ' *   title     : 文章标题\n' +
    ' *   date      : 发布日期（YYYY-MM-DD）\n' +
    ' *   tag       : 标签文字\n' +
    ' *   tagClass  : 标签配色 class（tag-test / tag-vue / tag-python / tag-css / tag-devops ...）\n' +
    ' *   cover     : 封面图路径；或 CSS 渐变（如 linear-gradient(...)）。留空用默认渐变\n' +
    ' *   excerpt   : 列表/卡片摘要\n' +
    ' *   content   : 正文，Markdown（代码块用 ~~~ 围栏）\n' +
    ' *   tags      : 详情页底部标签数组\n' +
    ' *   readTime  : 阅读时长\n' +
    ' * ============================================================ */\n';

  const out = header + 'window.BLOG_ARTICLES = ' + JSON.stringify(articles, null, 2) + ';\n';
  fs.writeFileSync(OUT_FILE, out, 'utf8');
  console.log('OK: 写入 ' + articles.length + ' 篇文章到 articles-data.js');
}

main();
