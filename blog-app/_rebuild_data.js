// Build articles-data.js from structured data
const fs = require('fs');

const ARTICLES = [
  // ===== Article 1 (existing - keep original minified) =====
  {
    id: "new-project-auto-test-summary",
    title: "个人实战总结：新项目早期接入自动化测试，大幅提升迭代效率",
    date: "2024-04-05",
    tag: "自动化测试",
    tagClass: "tag-test",
    cover: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    excerpt: "踩过无数次手工回归的坑后，我总结了一套新项目从零落地自动化测试的完整方案。分层设计、轻量化接入、搭配CI流水线，不用投入大量人力，就能提前拦截Bug、解放重复测试工作，分享给正在做新项目的开发同学。",
    tags: ["自动化测试", "Vitest", "Playwright", "前端工程化", "CI/CD"],
    readTime: "15 分钟",
    content: null // will be read from current file
  },
  // ===== Article 2 (existing) =====
  {
    id: 'selenium-vs-playwright-personal-summary',
    title: '实战踩坑记录：从 Selenium 换到 Playwright，说说我的真实选型理由',
    date: '2024-04-08',
    tag: '自动化测试',
    tagClass: 'tag-test',
    cover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    excerpt: '用了一年多 Selenium，直到新项目被各种偶发报错、驱动兼容搞心态，试着切了 Playwright。聊聊两个工具真实用下来的差别，以及为什么现在新项目我都直接选 Playwright。',
    tags: ['自动化测试', 'E2E测试', 'Selenium', 'Playwright', '测试工具选型'],
    readTime: '12 分钟',
    content: null
  },
  // ===== Article 3 (existing) =====
  {
    id: 'ai-generate-test-case-practice',
    title: '踩坑半年，我终于摸出了用AI生成自动化用例的靠谱玩法',
    date: '2024-04-12',
    tag: '自动化测试',
    tagClass: 'tag-test',
    cover: 'linear-gradient(135deg, #f97316, #fb923c)',
    excerpt: '最开始用AI写自动化用例，生成的东西十有八九跑不起来，要么缺场景要么选择器全错。踩了大半年坑，慢慢磨出了一套可复用的Prompt模板，现在生成的用例稍改改就能用，效率翻了一倍不止，聊聊我的真实经验。',
    tags: ['AI提效', '自动化测试', 'Prompt工程', 'Playwright', '测试效率'],
    readTime: '14 分钟',
    content: null
  }
];

// Read existing content for articles 1-3
const existingSrc = fs.readFileSync('articles-data.js', 'utf-8');

function extractContent(src, id) {
  const regex = new RegExp('id:\\s*"' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[\\s\\S]*?content:\\s*\\[([\\s\\S]*?)\\]\\s*,?\\s*(?:tags|readTime)');
  const m = src.match(regex);
  if (!m) return null;
  return m[1];
}

// Extract existing content
for (let i = 0; i < 3; i++) {
  ARTICLES[i].content = extractContent(existingSrc, ARTICLES[i].id);
  if (!ARTICLES[i].content) console.error('WARNING: Could not extract content for article', ARTICLES[i].id);
}

// New articles 4-10 (defined here with safe string handling)
const NEW_ARTICLES = [
  {
    id: "spring-vue3-fullstack-pitfalls",
    title: "从零搭建 SpringBoot + Vue3 全栈项目，我踩过的那些坑",
    date: "2024-03-15",
    tag: "全栈开发",
    tagClass: "tag-vue",
    cover: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    excerpt: "在软件工作室独立孵化项目时，我从零搭了一套 SpringBoot + Vue3 的前后端分离架构。踩了无数坑之后总结出这些经验：API设计规范、跨域处理、状态管理、部署上线……希望能帮到同样在摸索的同学。",
    tags: ["SpringBoot", "Vue3", "全栈开发", "MyBatis", "Redis"],
    readTime: "14 分钟",
    content: [
      "## 前言：为什么我想写这篇文章",
      "",
      "在软件工作室做独立项目的时候，我从头到尾负责了一个「专家智库」系统的后端和前端。技术栈选的是 SpringBoot + Vue3 + MyBatis + MySQL，当时觉得这套组合很主流，资料应该很多。实际做下来才发现，**资料多归多，但真正讲清楚「怎么把前后端串起来跑通一个完整流程」的文章很少。**",
      "",
      "大部分教程只教你写个 Hello World 接口或者 CRUD demo，但到了真实业务场景——权限认证、文件上传、分页查询、联表操作——就全是坑。这篇文章把我踩过的坑按阶段整理出来，每个坑都附上当时的错误做法和后来找到的正确解法。",
      "",
      "## 一、项目初始化阶段：别小看目录结构",
      "",
      "### 坑1：后端没有统一返回格式",
      "",
      "最开始我每个 Controller 都直接 return 对象，前端拿到数据格式五花八门。",
      "",
      "~~~java",
      "// ❌ 错误：直接返回实体",
      "@GetMapping(\"/user/{id}\")",
      "public User getUser(@PathVariable Long id) {",
      "    return userService.getById(id);",
      "}",
      "~",
      "",
      "问题是：一旦要加状态码、错误信息、分页元数据，所有地方都要改。后面我学聪明了，定义统一的 Result 类：",
      "",
      "~~~java",
      "// ✅ 正确：统一响应包装",
      "public class Result<T> {",
      "    private int code;",
      "    private String msg;",
      "    private T data;",
      "    public static <T> Result<T> ok(T data) { return new Result<>(200, \"success\", data); }",
      "    public static Result<T> fail(String msg) { return new Result<>(500, msg, null); }",
      "}",
      "~",
      "",
      "**思考：** 这个看起来是小事，但它决定了你整个项目的可维护性。前期花 10 分钟封装好，后面省掉的是几十次的重复修改。",
      "",
      "## 二、接口对接阶段：跨域和认证",
      "",
      "### 坑3：CORS 跨域配置不完整",
      "",
      "SpringBoot 后端配了 @CrossOrigin 但还是报 CORS 错误。原因是 OPTIONS 预检请求被拦截了。正确做法是在 WebMvcConfigurer 里全局配置。",
      "",
      "## 三、我的反思与收获",
      "",
      "- **先设计再编码**：不要上来就写代码。先把数据结构、API 列表、页面流程画清楚，效率翻倍。",
      "- **统一规范比技术选型重要**：团队协作时，命名风格、返回格式、错误处理方式一致，比用什么框架都关键。",
      "",
      "> 「全栈不代表你要一个人干所有事，而是你能理解整条链路，知道问题出在哪。」"
    ]
  },
  {
    id: "api-auto-pytest-notes",
    title: "第一次做接口自动化：pytest + requests 实战笔记",
    date: "2024-05-20",
    tag: "自动化测试",
    tagClass: "tag-python",
    cover: "linear-gradient(135deg, #10b981, #34d399)",
    excerpt: "在蒜泥科技实习时，wellnesshub 项目需要大量回归接口。我从零学了 pytest + requests 搭建接口自动化体系，从只会手搓 curl 到跑起 200+ 条稳定用例。",
    tags: ["pytest", "requests", "接口自动化", "Python", "API测试"],
    readTime: "12 分钟",
    content: [
      "## 背景：为什么我要搞接口自动化",
      "",
      "实习接手的 wellnesshub 是一个健康管理平台，后端有将近 50 个接口。每次发版前 QA 手工验证一遍主要接口就要大半天。带教让我研究一下能不能用脚本自动化。",
      "",
      "## 一、从最简单的请求开始",
      "",
      "第一个跑通的用例就是登录接口，当时兴奋得不行：",
      "",
      "~~~python",
      "# tests/test_login.py",
      "def test_login_success():",
      "    payload = {\"username\": \"testuser\", \"password\": \"123456\"}",
      "    resp = requests.post(f\"{BASE_URL}/auth/login\", json=payload)",
      "    assert resp.status_code == 200",
      "~",
      "",
      "看着绿色的小勾 ✅ 通过的那一刻真的很有成就感。但很快我就发现，这样写用例有太多重复代码。",
      "",
      "## 二、慢慢学会封装公共逻辑",
      "",
      "### 学到的第一课：conftest.py 的威力",
      "",
      "pytest 的 conftest.py 可以定义 fixture，相当于测试的前置条件。我把「获取 token」「创建测试用户」「清理数据」这些都抽成 fixture。",
      "",
      "### 第二课：参数化减少重复",
      "",
      "同一个接口多种输入组合？用 pytest.mark.parametrize：一行代码覆盖三种场景，比我之前写三个独立函数整洁多了。",
      "",
      "## 三、遇到的实际困难",
      "",
      "### 困难1：依赖数据的顺序执行",
      "",
      "有些接口有先后依赖——必须先创建用户才能查询。解决方案是用 fixture 的依赖链或标记顺序。",
      "",
      "## 四、我的成长与思考",
      "",
      "| 以前认为 | 现在理解 |",
      "|---------|---------|",
      "| 测试就是点点点 | 测试是系统性地验证预期行为 |",
      "| 自动化很难 | 核心思路很简单，难点在维护 |",
      "",
      "> 这段经历也让我意识到：**学习新技能最快的方式就是带着实际问题去学。**"
    ]
  },
  {
    id: "fiddler-whistle-proxy-testing",
    title: "用 Fiddler 和 Whistle 抓包改包辅助测试的实用技巧",
    date: "2024-06-12",
    tag: "测试工具",
    tagClass: "tag-test",
    cover: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    excerpt: "抓包工具是我日常测试中最常用的武器之一。模拟弱网、篡改响应、Mock第三方接口、定位前后端 bug 归属……这些技巧帮我解决过不少疑难杂症。",
    tags: ["Fiddler", "Whistle", "抓包调试", "Mock", "网络调试"],
    readTime: "11 分钟",
    content: [
      "## 为什么抓包工具这么重要",
      "",
      "做测试经常遇到这种场景：前端说「我请求发了啊」，后端说「我没收到啊」。这时候你就需要一个中间人来「看看到底发生了什么」。抓包工具就是这个中间人——它拦截客户端和服务端之间的所有 HTTP 流量。",
      "",
      "我用过两款主力工具：早期用 Fiddler Classic（Windows 生态好），后来转到 Whistle（基于 Node.js，跨平台，规则更灵活）。",
      "",
      "## 一、最常用的三个场景",
      "",
      "### 场景1：模拟弱网和超时",
      "",
      "产品要求「网络差的时候要有 loading 提示」，你怎么验证？Whistle 可以精确控制延迟：规则如 reqDelay://3000（延迟 3 秒）、reqSpeed://10kb/s（限速）。",
      "",
      "### 场景2：篡改响应数据（Mock 后端未完成的功能）",
      "",
      "后端某个接口还在开发中，前端需要联调。与其等后端做好，不如直接 Mock 返回值：用 resBody://{mock-data.json} 规则直接返回指定 JSON。",
      "",
      "### 场景3：快速判断 Bug 归属",
      "",
      "QA 最怕的问题：「这个功能不正常，是前端问题还是后端问题？」抓包一看就知道：",
      "- **请求根本没发出** → 前端校验拦住了",
      "- **请求发出了但参数不对** → 前端传参问题",
      "- **请求正常发出但响应码非 200** → 后端问题",
      "- **响应数据完整但页面显示错误** → 前端渲染问题",
      "",
      "## 二、实战注意事项",
      "",
      "> ⚠️ 抓 HTTPS 流量需要安装 CA 证书，否则只能看到加密的乱码。",
      "",
      "> 💡 养成一个习惯：遇到不确定的问题，**先抓包再看**。很多时候日志里看不到的东西，网络层一清二楚。"
    ]
  },
  {
    id: "perf-test-loadrunner-jmeter",
    title: "性能测试入门：从 LoadRunner 到 JMeter 的转型思考",
    date: "2024-07-08",
    tag: "性能测试",
    tagClass: "tag-test",
    cover: "linear-gradient(135deg, #ef4444, #f87171)",
    excerpt: "接触了一些性能测试工作。从 LoadRunner 到 JMeter，聊聊性能测试入门的心得：不要被工具吓倒，核心思路其实很简单——模拟真实用户行为，观察系统反应。",
    tags: ["JMeter", "LoadRunner", "性能测试", "压测", "瓶颈分析"],
    readTime: "13 分钟",
    content: [
      "## 我是怎么开始接触性能测试的",
      "",
      "带教丢给我一个任务：「wellnesshub 的健康档案导出接口有点慢，你看看能不能做个简单的压力测试。」说实话我当时心里没底。但实际做下来发现，**入门的核心动作就三步：模拟用户 → 加压 → 看指标。** 工具只是帮你更方便地完成这三步而已。",
      "",
      "## 几个关键指标",
      "",
      "| 指标 | 含义 | 关注阈值 |",
      "|------|------|----------|",
      "| Average Response Time | 平均响应时间 | < 2s（简单接口）|",
      "| TPS | 每秒事务数 | 越高越好，趋势平稳 |",
      "| Error Rate | 错误率 | < 1% |",
      "| 90% / 95% Line | 百分位响应时间 | 比 Average 更反映体验 |",
      "",
      "## 一次实际的性能问题排查",
      "",
      "基准：1 用户 → 800ms（还行）。10 并发 → 3.2s（开始慢）。30 并发 → 8+s，错误率 15%。",
      "",
      "**结论：这个接口扛不住并发。** 跟后端一起排查发现是 N+1 查询问题。改成批量查询后，30 并发下响应时间降到 1.8s。",
      "",
      "## 性能测试带给我的思维转变",
      "",
      "做性能测试之前，我写代码只关心「能不能跑通」。做了之后我开始关心：这条 SQL 在大数据量下会不会慢？这个接口被高频调用时有没有缓存策略？前端一次性加载的数据量合理吗？",
      "",
      "> 性能测试本质上是一种**「放大镜」**——它把平时不明显的问题在高压下暴露出来。"
    ]
  },
  {
    id: "frontend-review-tester-view",
    title: "从测试视角评审前端页面：我关注什么",
    date: "2024-08-20",
    tag: "前端开发",
    tagClass: "tag-css",
    cover: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    excerpt: "作为测试工程师，评审前端交付物是我的日常工作之一。不同于开发者关注实现细节，我会从用户体验、边界情况、兼容性等角度去看。这篇整理了我常关注的检查清单和一些真实案例。",
    tags: ["前端评审", "UI测试", "交互体验", "CSS", "响应式"],
    readTime: "10 分钟",
    content: [
      "## 一个常见的误解",
      "",
      "很多人以为「测试前端就是点点看对不对」。实际上前端测试的深度可以非常深：视觉还原度、交互流畅性、边界情况处理、无障碍访问、性能表现……",
      "",
      "**测试视角和开发视角天然互补**——开发者容易陷入「自己写的肯定没问题」的思维盲区，而测试者带着怀疑的眼光去看，往往能发现不一样的问题。",
      "",
      "## 我的评审检查清单",
      "",
      "### 视觉层面：像素级还原、文字溢出、图片适配、空状态占位",
      "### 交互层面：按钮反馈（hover/active/disabled）、表单校验、防抖节流、加载状态",
      "### 兼容性：移动端适配（375/768/1024px）、浏览器差异（Chrome/Safari/Edge）、横屏模式",
      "",
      "## 几个真实案例",
      "",
      "### 案例1：按钮叠在一起（Safari flex gap 兼容性 bug）",
      "### 案例2：无限滚动的内存泄漏（DOM 节点不回收，800MB→150MB）",
      "### 案例3：暗色模式下文字不可见（死颜色 #333 在深色背景上不可见）",
      "",
      "## 总结",
      "",
      "> 「好的测试不是证明程序有 bug，而是提供信息帮助团队做出更好的决策。」"
    ]
  },
  {
    id: "ai-coding-assistant-workflow",
    title: "AI 编程助手如何改变我的工作方式：Claude / Codex 实战",
    date: "2024-09-15",
    tag: "AI提效",
    tagClass: "tag-devops",
    cover: "linear-gradient(135deg, #ec4899, #f472b6)",
    excerpt: "从去年底开始用 AI 辅助编程到现在大半年了。Claude 写测试用例、Codex 帮我 debug、Cursor 补全日常代码……说说真实的使用体验：AI 不是替代我，而是让我把时间花在更有价值的地方。",
    tags: ["AI编程", "Claude", "Codex", "Cursor", "效率提升"],
    readTime: "11 分钟",
    content: [
      "## 我是怎么开始用的",
      "",
      "第一次用 Claude 帮我写 Playwright 测试用例——丢过去需求描述，它生成的代码居然能跑通 70%。这让我很惊讶。慢慢地，AI 成了我日常工作流的标配。",
      "",
      "## 我在不同场景下的用法",
      "",
      "### 场景1：写测试用例（最高频使用）——给 AI 需求描述让它生成 E2E 测试框架，我再微调",
      "### 场景2：Debug 和排错——贴报错信息给 AI，它给出 3-5 个可能性排序",
      "### 场景3：学习和理解新概念——遇到不懂的技术术语问 AI，用类比解释比文档容易消化",
      "",
      "## AI 不能做的事",
      "",
      "| AI 擅长的 | AI 不擅长的 |",
      "|-----------|-------------|",
      "| 生成样板代码 | 处理复杂业务逻辑 |",
      "| 解释报错/概念 | 保证代码 100% 正确 |",
      "| 提供思路方向 | 理解你的项目上下文 |",
      "",
      "> AI 不会取代测试工程师，但**会用 AI 的测试工程师会取代不会用的**。"
    ]
  },
  {
    id: "fullstack-to-testdev-journey",
    title: "从全栈工程师转测试开发：我的认知转变与收获",
    date: "2024-10-01",
    tag: "职业成长",
    tagClass: "tag-test",
    cover: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    excerpt: "从软件工作室的全栈开发到蒜泥科技的测试实习生再到度小满的驻场自动化工程师，这一年多的职业路径跨度不小。聊聊为什么选择转测试、经历了哪些认知碰撞、以及对这个方向的看法。",
    tags: ["职业规划", "测试开发", "全栈转测试", "成长复盘", "心路历程"],
    readTime: "16 分钟",
    content: [
      "## 缘起：为什么从全栈转向测试",
      "",
      "在软件工作室的时候，我是一个「什么都干」的全栈角色。做着做着发现自己一个问题：**什么都做，什么都不精。** 每次都是浅尝辄止——接口能跑就行、页面能显示就好。刚好蒜泥科技有测试实习的机会，我决定试试。",
      "",
      "## 第一阶段的认知冲击",
      "",
      "刚去蒜泥做测试的时候心里其实是有些落差的。「我可是写过完整项目的，怎么来做测试？」但很快现实给了我一巴掌：**测试远比我想象的有技术含量。**",
      "",
      "### 冲击1：测试不是「点来点去」——包括单元/接口/UI/性能/安全多种方法论",
      "### 冲击2：写自动化比写业务代码更需要工程能力——可维护、可复用、稳定可靠非常考验功底",
      "",
      "## 第二阶段：逐渐找到感觉",
      "",
      "### 收获1：系统性思维的提升 —— 从「功能怎么实现」到「系统怎么保障质量」",
      "### 收获2：技术广度的自然扩展 —— 要懂前端写 UI 自动化、懂后端做接口测试、懂运维搭 CI 流水线",
      "### 收获3：沟通能力的锻炼 —— 从不敢跟开发说话到能自信组织 bug review 会议",
      "",
      "## 回过头看：这条路走对了吗",
      "",
      "坦白说，刚开始转测试时有过犹豫。但现在回头看，**这个选择对我而言是对的：**",
      "",
      "1. **找到了自己擅长的领域**：我喜欢「发现问题 → 分析根因 → 推动解决」的闭环成就感",
      "2. **技术栈反而更全面了**：从 Java+Vue3+MySQL 扩展到 Python+Playwright+Docker+CI/CD+AI 工具链",
      "3. **职业路径更清晰了**：测试开发 → 测试架构师 → 质量保障专家",
      "",
      "## 给同样在迷茫中的同学",
      "",
      "- 不要用职位名称限制自己——现代测试开发的技术含量不亚于纯开发",
      "- 转方向最好的方式是亲身体验——读过十篇文章不如亲手做一个项目",
      "- 保持学习的饥饿感——AI、大模型、智能化测试正在重塑这个行业",
      "",
      "> 职业道路没有标准答案。重要的是每一步都走得清醒——知道自己在哪里、想去哪里、还需要补什么。"
    ]
  }
];

// Combine all articles
const ALL_ARTICLES = [...ARTICLES, ...NEW_ARTICLES];

// Build the output file
let output = `/* ============================================================
 * articles-data.js — 全站文章数据源（唯一数据源）
 * 10 篇文章，自动生成于 ${new Date().toISOString()}
 * ============================================================\n\nwindow.BLOG_ARTICLES = [\n`;

for (let i = 0; i < ALL_ARTICLES.length; i++) {
  const a = ALL_ARTICLES[i];
  output += `  /* ===================== 文章 ${i + 1} ===================== */\n\n`;
  
  // Build the article object as a string with proper escaping
  const obj = {
    id: a.id,
    title: a.title,
    date: a.date,
    tag: a.tag,
    tagClass: a.tagClass,
    cover: a.cover,
    excerpt: a.excerpt,
    tags: a.tags,
    readTime: a.readTime,
    content: a.content
  };
  
  // Serialize manually for content arrays
  output += `  {\n`;
  output += `    id: ${JSON.stringify(a.id)},\n`;
  output += `    title: ${JSON.stringify(a.title)},\n`;
  output += `    date: ${JSON.stringify(a.date)},\n`;
  output += `    tag: ${JSON.stringify(a.tag)},\n`;
  output += `    tagClass: ${JSON.stringify(a.tagClass)},\n`;
  output += `    cover: ${JSON.stringify(a.cover)},\n`;
  output += `    excerpt: ${JSON.stringify(a.excerpt)},\n`;
  output += `    tags: ${JSON.stringify(a.tags)},\n`;
  output += `    readTime: ${JSON.stringify(a.readTime)},\n`;
  
  if (a.content) {
    output += `    content: [\n`;
    for (const line of a.content) {
      // Properly escape the line for inclusion in a "-delimited JS string
      const escaped = line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      output += `      "${escaped}",\n`;
    }
    output += `    ]\n`;
  } else {
    output += `    content: null  // ERROR: could not extract\n`;
  }
  
  output += i < ALL_ARTICLES.length - 1 ? `  },\n` : `  }\n`;
}

output += `\n  /* ---- 在上方数组里继续追加新文章即可 ---- */\n];\n`;

fs.writeFileSync('articles-data.js', output, 'utf-8');

// Verify
delete require.cache[require.resolve('./articles-data.js')];
global.window = {};
try {
  require('./articles-data.js');
  const data = window.BLOG_ARTICLES;
  console.log(`✅ SUCCESS: ${data.length} articles`);
  data.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.tag}] ${a.title}`);
  });
} catch (e) {
  console.error('❌ FAILED:', e.message);
}
