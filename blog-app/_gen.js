// _gen.js — 从 assets/articles/*.md 重建 articles-data.js
// 用 JSON.stringify 序列化，自动处理所有引号/换行转义，避免手写 JS 字符串的语法错误。
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'assets', 'articles');

// 元数据（不含 content，content 从同名 .md 读取）
const META = [
  {
    id: 'new-project-auto-test-summary',
    title: '个人实战总结：新项目早期接入自动化测试，大幅提升迭代效率',
    date: '2026-07-15', tag: '自动化测试', tagClass: 'tag-test',
    cover: 'assets/covers/cover-new-project-auto-test-summary.png',
    excerpt: '踩过无数次手工回归的坑后，我总结了一套新项目从零落地自动化测试的完整方案。分层设计、轻量化接入、搭配CI流水线，不用投入大量人力，就能提前拦截Bug、解放重复测试工作，分享给正在做新项目的开发同学。',
    tags: ['自动化测试', 'Vitest', 'Playwright', '前端工程化', 'CI/CD'],
    readTime: '15 分钟', file: 'new-project-auto-test-summary.md'
  },
  {
    id: 'selenium-vs-playwright-personal-summary',
    title: '实战踩坑记录：从 Selenium 换到 Playwright，说说我的真实选型理由',
    date: '2026-06-18', tag: '自动化测试', tagClass: 'tag-test',
    cover: 'assets/covers/cover-selenium-vs-playwright-personal-summary.png',
    excerpt: '用了一年多 Selenium，直到新项目被各种偶发报错、驱动兼容搞心态，试着切了 Playwright。聊聊两个工具真实用下来的差别，以及为什么现在新项目我都直接选 Playwright。',
    tags: ['自动化测试', 'E2E测试', 'Selenium', 'Playwright', '测试工具选型'],
    readTime: '12 分钟', file: 'selenium-vs-playwright-personal-summary.md'
  },
  {
    id: 'ai-generate-test-case-practice',
    title: '踩坑半年，我终于摸出了用AI生成自动化用例的靠谱玩法',
    date: '2026-05-20', tag: 'AI提效', tagClass: 'tag-test',
    cover: 'assets/covers/cover-ai-generate-test-case-practice.png',
    excerpt: '最开始用AI写自动化用例，生成的东西十有八九跑不起来，要么缺场景要么选择器全错。踩了大半年坑，慢慢磨出了一套可复用的Prompt模板，现在生成的用例稍改改就能用，效率翻了一倍不止，聊聊我的真实经验。',
    tags: ['AI提效', '自动化测试', 'Prompt工程', 'Playwright', '测试效率'],
    readTime: '14 分钟', file: 'ai-generate-test-case-practice.md'
  },
  {
    id: 'spring-vue3-fullstack-pitfalls',
    title: '从零搭建 SpringBoot + Vue3 全栈项目，我踩过的那些坑',
    date: '2024-03-15', tag: '全栈开发', tagClass: 'tag-vue',
    cover: 'assets/covers/cover-spring-vue3-fullstack-pitfalls.png',
    excerpt: '在软件工作室独立孵化项目时，我从零搭了一套 SpringBoot + Vue3 的前后端分离架构。踩了无数坑之后总结出这些经验：API设计规范、跨域处理、状态管理、部署上线……希望能帮到同样在摸索的同学。',
    tags: ['SpringBoot', 'Vue3', '全栈开发', 'MyBatis', 'Redis'],
    readTime: '14 分钟', file: 'spring-vue3-fullstack-pitfalls.md'
  },
  {
    id: 'api-auto-pytest-notes',
    title: '第一次做接口自动化：pytest + requests 实战笔记',
    date: '2026-04-22', tag: '自动化测试', tagClass: 'tag-python',
    cover: 'assets/covers/cover-api-auto-pytest-notes.png',
    excerpt: '在蒜泥科技实习时，wellnesshub 项目需要大量回归接口。我从零学了 pytest + requests 搭建接口自动化体系，从只会手搓 curl 到跑起 200+ 条稳定用例，记录下核心经验和踩过的坑。',
    tags: ['pytest', 'requests', '接口自动化', 'Python', 'API测试'],
    readTime: '12 分钟', file: 'api-auto-pytest-notes.md'
  },
  {
    id: 'fiddler-whistle-proxy-testing',
    title: '用 Fiddler 和 Whistle 抓包改包辅助测试的实用技巧',
    date: '2026-03-18', tag: '测试工具', tagClass: 'tag-test',
    cover: 'assets/covers/cover-fiddler-whistle-proxy-testing.png',
    excerpt: '抓包工具是我日常测试中最常用的武器之一。从最早用 Fiddler 到后来换 Whistle，分享一些实战技巧：模拟弱网、篡改响应、Mock第三方接口、定位前后端 bug 归属……这些技巧帮我解决过不少疑难杂症。',
    tags: ['Fiddler', 'Whistle', '抓包调试', 'Mock', '网络调试'],
    readTime: '11 分钟', file: 'fiddler-whistle-proxy-testing.md'
  },
  {
    id: 'perf-test-loadrunner-jmeter',
    title: '性能测试入门：从 LoadRunner 到 JMeter 的转型思考',
    date: '2026-02-15', tag: '性能测试', tagClass: 'tag-test',
    cover: 'assets/covers/cover-perf-test-loadrunner-jmeter.png',
    excerpt: '蒜泥科技实习后期接触了一些性能测试的工作。从公司老项目用的 LoadRunner 到我自己学的 JMeter，聊聊性能测试入门的心得：不要被工具吓倒，核心思路其实很简单——模拟真实用户行为，观察系统反应。',
    tags: ['JMeter', 'LoadRunner', '性能测试', '压测', '瓶颈分析'],
    readTime: '13 分钟', file: 'perf-test-loadrunner-jmeter.md'
  },
  {
    id: 'frontend-review-tester-view',
    title: '从测试视角评审前端页面：我关注什么',
    date: '2026-01-12', tag: '前端开发', tagClass: 'tag-css',
    cover: 'assets/covers/cover-frontend-review-tester-view.png',
    excerpt: '作为测试工程师，评审前端交付物是我的日常工作之一。不同于开发者关注实现细节，我会从用户体验、边界情况、兼容性等角度去看。这篇整理了我常关注的检查清单和一些真实案例。',
    tags: ['前端评审', 'UI测试', '交互体验', 'CSS', '响应式'],
    readTime: '10 分钟', file: 'frontend-review-tester-view.md'
  },
  {
    id: 'ai-coding-assistant-workflow',
    title: 'AI 编程助手如何改变我的工作方式：Claude / Codex 实战',
    date: '2026-06-08', tag: 'AI提效', tagClass: 'tag-devops',
    cover: 'assets/covers/cover-ai-coding-assistant-workflow.png',
    excerpt: '从去年底开始用 AI 辅助编程，到现在已经大半年了。Claude 写测试用例、Codex 帮我 debug、Cursor 补全日常代码……说说真实的使用体验：AI 不是替代我，而是让我把时间花在更有价值的地方。',
    tags: ['AI编程', 'Claude', 'Codex', 'Cursor', '效率提升'],
    readTime: '11 分钟', file: 'ai-coding-assistant-workflow.md'
  },
  {
    id: 'fullstack-to-testdev-journey',
    title: '从全栈工程师转测试开发：我的认知转变与收获',
    date: '2024-11-20', tag: '职业成长', tagClass: 'tag-test',
    cover: 'assets/covers/cover-fullstack-to-testdev-journey.png',
    excerpt: '从软件工作室的全栈开发到蒜泥科技的测试实习生再到度小满的驻场自动化工程师，这一年多的职业路径跨度不小。聊聊我为什么选择转测试、过程中经历了哪些认知碰撞、以及现在对这个方向的看法。',
    tags: ['职业规划', '测试开发', '全栈转测试', '成长复盘', '心路历程'],
    readTime: '16 分钟', file: 'fullstack-to-testdev-journey.md'
  }
];

const articles = META.map(m => {
  const content = fs.readFileSync(path.join(DIR, m.file), 'utf8').trim();
  const { file, ...rest } = m;
  return { ...rest, content };
});

// 按发布日期倒序（最新在前）。date 为 YYYY-MM-DD 字符串，localeCompare 即可正确排序。
articles.sort((a, b) => b.date.localeCompare(a.date));

const header = `/* ============================================================
 * articles-data.js — 全站文章数据源（由 _gen.js 自动生成，勿手改）
 * ------------------------------------------------------------
 * 字段说明：
 *   id        : 唯一标识，用于 URL（post.html?id=xxx），不要重复
 *   title     : 文章标题
 *   date      : 发布日期（YYYY-MM-DD）
 *   tag       : 标签文字
 *   tagClass  : 标签配色 class（tag-test / tag-vue / tag-python / tag-css / tag-devops ...）
 *   cover     : 首页展示图 / 详情页封面。渐变写法：'linear-gradient(135deg, #6b8aff, #8cc7ff)'
 *   excerpt   : 列表页与首页卡片上的摘要
 *   content   : 文章正文，Markdown 格式（代码块用 ~~~ 作为围栏）
 *   tags      : 详情页底部标签数组
 *   readTime  : 阅读时长
 * ============================================================ */
`;

const out = header + 'window.BLOG_ARTICLES = ' + JSON.stringify(articles, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, 'articles-data.js'), out, 'utf8');
console.log('OK: 写入', articles.length, '篇文章到 articles-data.js');
