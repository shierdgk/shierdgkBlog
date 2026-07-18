/* ============================================================
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
window.BLOG_ARTICLES = [
  {
    "id": "new-project-auto-test-summary",
    "title": "个人实战总结：新项目早期接入自动化测试，大幅提升迭代效率",
    "date": "2026-07-15",
    "tag": "自动化测试",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-new-project-auto-test-summary.png",
    "excerpt": "踩过无数次手工回归的坑后，我总结了一套新项目从零落地自动化测试的完整方案。分层设计、轻量化接入、搭配CI流水线，不用投入大量人力，就能提前拦截Bug、解放重复测试工作，分享给正在做新项目的开发同学。",
    "tags": [
      "自动化测试",
      "Vitest",
      "Playwright",
      "前端工程化",
      "CI/CD"
    ],
    "readTime": "15 分钟",
    "content": "## 前言：踩坑后才明白，新项目一定要早做自动化\n\n之前参与过好几个项目，都犯了同一个错误：前期业务简单，全靠人工回归。等到需求迭代变快、模块越来越多，每次发版前完整回归一遍就要大半天，改一行代码都担心牵连其他功能，线上隐性 Bug 层出不穷。\n\n后来我养成习惯：任何新项目启动阶段就搭好自动化测试体系。新项目代码干净、逻辑简单，接入成本极低；越早落地，后期省的时间越多。\n\n我的核心观点：自动化不是为了替代手工测试，而是干掉重复、机械的回归工作，把人力留给复杂交互、用户体验这类需要主观判断的场景。\n\n## 一、我在新项目固定使用的四层测试分层\n\n试过全量 E2E、只写单测两种极端后，我整理出一套性价比最高的分层策略，由底层到上层逐步覆盖，不用一次性写几百条用例。\n\n### 1. 单元测试：底层工具、逻辑兜底（必做）\n\n适用场景：通用工具函数、业务计算逻辑、自定义 Hooks、状态处理方法。前端项目我统一用 Vitest，Vite 项目运行速度远快于 Jest。\n\n~~~bash\nnpm i -D vitest jsdom @testing-library/vue\n~~~\n\n时间格式化函数的例子：\n\n~~~ts\nexport function formatTime(ts: number) {\n  const d = new Date(ts);\n  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;\n}\n~~~\n\n~~~ts\nimport { formatTime } from '@/utils/time';\ntest('标准时间戳输出年月日', () => {\n  expect(formatTime(1704067200000)).toBe('2024-1-1');\n});\n~~~\n\n### 2. 组件测试：交互与渲染验证\n\n用 Testing Library 模拟用户点击、输入，验证组件行为，而不是去测实现细节。\n\n### 3. 接口集成测试：Mock 掉不稳定依赖\n\n后端没就绪时，用 MSW 拦截请求返回假数据，前端照样把链路跑通。\n\n### 4. E2E：只覆盖核心主流程\n\nE2E 维护成本高，我只挑「登录 → 核心操作 → 退出」这类最关键的冒烟路径，不追求全覆盖。\n\n## 二、轻量化接入，别一上来就大动干戈\n\n新人最容易犯的错是把测试体系搞得很重：一堆配置文件、覆盖率门槛卡死 CI，结果大家嫌烦干脆不写。\n\n我的做法是：先能跑起来再说。本地 `vitest` 一键跑，CI 里加一条 `test` 命令，覆盖率先不卡。等业务稳定了再慢慢加门槛。\n\n## 三、接上 CI，价值才真正释放\n\n自动化测试最大的价值在 CI。每次 push 自动跑，红了就合不进去，从机制上拦住回归。\n\n> 经验之谈：测试不是写给自己看的，是写给三个月后接手项目的同事看的。命名清楚、断言明确，比覆盖率数字重要得多。\n\n## 小结\n\n新项目早做自动化，核心是「分层 + 轻量 + CI」三件事。不要追求一步到位，先让第一条例子跑起来，剩下的会自然长出来。"
  },
  {
    "id": "selenium-vs-playwright-personal-summary",
    "title": "实战踩坑记录：从 Selenium 换到 Playwright，说说我的真实选型理由",
    "date": "2026-06-18",
    "tag": "自动化测试",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-selenium-vs-playwright-personal-summary.png",
    "excerpt": "用了一年多 Selenium，直到新项目被各种偶发报错、驱动兼容搞心态，试着切了 Playwright。聊聊两个工具真实用下来的差别，以及为什么现在新项目我都直接选 Playwright。",
    "tags": [
      "自动化测试",
      "E2E测试",
      "Selenium",
      "Playwright",
      "测试工具选型"
    ],
    "readTime": "12 分钟",
    "content": "## 前言\n\n做前端自动化也有挺长时间了，Selenium 是入门就接触的工具，网上教程最多，公司老项目也全用它写的。\n\n之前一直觉得自动化测试就这样，偶尔报错、折腾环境都正常。直到去年接了个 Vue 后台项目，用 Selenium 写 E2E，天天被偶发失败搞心态，才下决心试 Playwright。\n\n这大半年用下来，新项目我彻底不考虑 Selenium 了。聊聊真实感受，不搬官方参数。\n\n## 一、光环境搭建，差距就很大\n\nSelenium 要单独装对应浏览器的驱动：Chrome 下 chromedriver，火狐下 geckodriver，版本必须和本地浏览器完全对应，差一个小版本都可能跑不起来。\n\n印象深的一次：周末 Chrome 偷偷更了新版，周一开脚本全红。翻半天找对应驱动，本地换完好了，推到 CI 又炸——服务器 Chrome 还是旧的。前前后后折腾快一小时。\n\n团队人多了更麻烦，每人浏览器版本不同，还得反复说「先别更浏览器」，挺离谱的。\n\nPlaywright 完全没这问题，安装时自动下载适配好的浏览器，不用手动装驱动、配环境变量。\n\n~~~bash\nnpm init playwright@latest\n~~~\n\n一行装完，本地、测试机、CI 全一致，不存在「我本地能跑你那跑不了」。\n\n## 二、用例稳不稳定，最影响心态\n\n自动化测试最磨人的不是写用例，是偶发失败。明明代码没改，今天过明天挂，排查半天找不到原因。\n\nSelenium 的老毛病：现代页面全是异步渲染，接口没返回、DOM 没渲染，它就执行点击、取值，直接报找不到元素。你要么写死 sleep 等几秒，要么给每个元素写显式等待，代码又臭又长。\n\n我之前写个表单提交用例，等弹窗、等下拉、等按钮可点，光等待就十几行，还偶尔抽风。\n\n换 Playwright 后体验好太多：它自带自动等待，点击、填输入框会自己等元素加载好、可点了再操作，不用手动写等待。同样逻辑跑了几十次，一次没因元素没加载报过错。\n\n> 现代前端页面全是动态渲染，Selenium 那套老思路跟不上了，Playwright 才是适配现在开发模式的。\n\n## 三、其他让我留下的点\n\n- 自带 trace viewer，失败能回放每一步，定位快十倍\n- 网络拦截原生支持，Mock 接口比 Selenium 方便\n- 多浏览器（Chromium / Firefox / WebKit）一套 API 搞定\n\n## 小结\n\n不是说 Selenium 不好，老项目维护它没问题。但新项目、尤其是动态渲染重的前端，Playwright 在环境、稳定性、调试上全方位省心。我现在的原则很简单：新项目无脑 Playwright。"
  },
  {
    "id": "ai-coding-assistant-workflow",
    "title": "AI 编程助手如何改变我的工作方式：Claude / Codex 实战",
    "date": "2026-06-08",
    "tag": "AI提效",
    "tagClass": "tag-devops",
    "cover": "assets/covers/cover-ai-coding-assistant-workflow.png",
    "excerpt": "从去年底开始用 AI 辅助编程，到现在已经大半年了。Claude 写测试用例、Codex 帮我 debug、Cursor 补全日常代码……说说真实的使用体验：AI 不是替代我，而是让我把时间花在更有价值的地方。",
    "tags": [
      "AI编程",
      "Claude",
      "Codex",
      "Cursor",
      "效率提升"
    ],
    "readTime": "11 分钟",
    "content": "## 前言\n\n从去年底用 AI 辅助编程到现在大半年。Claude 写测试用例、Codex 帮我 debug、Cursor 补全日常代码。说说真实体验：AI 不是替代我，是让我把时间花在更有价值的地方。\n\n## 一、不同工具，不同定位\n\n- Claude：长上下文、理解项目结构强，适合写测试、梳理方案、读陌生代码\n- Codex / 云端 Agent：适合「给个明确任务去自动改」，比如修一个明确的 bug、补一类改动\n- Cursor：本地补全顺手，写业务逻辑时跟着思路走\n\n不是哪个最强用哪个，是按任务挑。写用例我开 Claude，改一堆重复样板我丢给 Agent。\n\n## 二、我的工作流变了\n\n以前：查文档 → 写代码 → 调 → 再查。现在：先让 AI 出初稿 → 我审架构和边界 → 让它改 → 我验关键路径。人的角色从「写」更多转向「审」和「决」。\n\n## 三、踩过的坑\n\n- 盲信生成代码：AI 偶尔编出不存在的 API，不跑就合进去必炸\n- 上下文给太少：它改东墙漏西墙，因为不知道全局约束\n- 把机密信息粘进对话：这个要严格避免\n\n> AI 越强，人的判断力越值钱。它能产出 80 分的草稿，但「这 80 分对不对、要不要」得人来定。\n\n## 小结\n\nAI 编程助手是放大器：你原本思路清楚，它让你更快；你思路糊涂，它让你错得更快。先把基础打牢，再让它加速。"
  },
  {
    "id": "ai-generate-test-case-practice",
    "title": "踩坑半年，我终于摸出了用AI生成自动化用例的靠谱玩法",
    "date": "2026-05-20",
    "tag": "AI提效",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-ai-generate-test-case-practice.png",
    "excerpt": "最开始用AI写自动化用例，生成的东西十有八九跑不起来，要么缺场景要么选择器全错。踩了大半年坑，慢慢磨出了一套可复用的Prompt模板，现在生成的用例稍改改就能用，效率翻了一倍不止，聊聊我的真实经验。",
    "tags": [
      "AI提效",
      "自动化测试",
      "Prompt工程",
      "Playwright",
      "测试效率"
    ],
    "readTime": "14 分钟",
    "content": "## 前言\n\n去年 AI 火起来，我第一反应就是：能不能让它帮我写自动化测试用例？写用例大量是重复模板代码，很适合交给 AI。\n\n最开始想得美：丢一句话就生成完整用例，复制粘贴完事。实际用下来根本不是——生成代码看着像样，一跑全错，要么缺场景，要么选择器瞎编，要么不符合项目写法。\n\n踩了大半年坑，磨出一套可复用的 Prompt 模板。常规页面用例，AI 生成完我微调几分钟就能跑通，省不少力气。\n\n## 一、最开始踩过的坑\n\n早期让 AI 生成的用例，能用的不到 30%，主要是这几个问题：\n\n1. 场景覆盖不全，只写最理想主流程。登录页就只写「输正确账号密码 → 登录 → 跳转」，账号为空、密码错、验证码失效一概没有。\n2. 脱离项目，选择器瞎编。AI 不知道页面长啥样，class、id 凭常识写，生成的代码一跑全是找不到元素。\n3. 不守规范，写法五花八门。项目有封装好的 `login()`、统一断言写法，AI 全用原生 API，风格乱成一锅粥。\n4. 逻辑不严谨，该等的没等，该断言的只断言个标题。\n\n## 二、我是怎么一步步优化的\n\n### 第一步：把上下文给足，别让 AI 瞎猜\n\n最核心的一点。每次生成前，我一定先告诉 AI：技术栈（Playwright + TS）、项目规范（有哪些公共方法）、页面结构（DOM 片段或路由）。上下文越足，生成越准。\n\n### 第二步：给模板，别让它从零写\n\n我会先喂一段项目里已有的「标准用例模板」，要求它严格照着风格来：用什么 fixture、断言怎么写、公共方法怎么调。生成结果和存量用例一致，维护才不乱。\n\n### 第三步：让它先列场景，再写代码\n\n先让它输出「覆盖哪些场景」的清单，我确认没漏，再让它写代码。这样异常场景不会被偷偷丢掉。\n\n## 三、沉淀下来的 Prompt 骨架\n\n~~~\n你是一个资深自动化测试工程师。基于以下信息生成 Playwright 用例：\n1. 技术栈与版本\n2. 项目公共方法清单\n3. 目标页面的 DOM 结构\n4. 需要覆盖的正常 / 异常场景\n要求：严格复用公共方法，断言明确，不要写死等待。\n~~~\n\n> 提醒：AI 生成的是「草稿」不是「成品」。一定要过一遍再提交，别把没跑过的用例直接合进主干。\n\n## 小结\n\nAI 提效的关键不在「让它写」，在「你会不会喂」。把项目上下文、规范、场景清单备齐，它才是真正好用的副驾。"
  },
  {
    "id": "api-auto-pytest-notes",
    "title": "第一次做接口自动化：pytest + requests 实战笔记",
    "date": "2026-04-22",
    "tag": "自动化测试",
    "tagClass": "tag-python",
    "cover": "assets/covers/cover-api-auto-pytest-notes.png",
    "excerpt": "在蒜泥科技实习时，wellnesshub 项目需要大量回归接口。我从零学了 pytest + requests 搭建接口自动化体系，从只会手搓 curl 到跑起 200+ 条稳定用例，记录下核心经验和踩过的坑。",
    "tags": [
      "pytest",
      "requests",
      "接口自动化",
      "Python",
      "API测试"
    ],
    "readTime": "12 分钟",
    "content": "## 前言\n\n在蒜泥科技实习时，wellnesshub 项目需要大量回归接口。我之前只会手搓 curl，接口一多就崩溃。于是从零学 pytest + requests 搭接口自动化，最终跑起 200+ 条稳定用例。记录核心经验和坑。\n\n## 一、从 curl 到 requests\n\n最早验证接口就是贴 curl 命令，参数一变就改半天，结果也不好断言。换成 requests 后，请求和断言都能写成代码：\n\n~~~python\nimport requests\n\ndef test_login_ok():\n    r = requests.post(\n        \"https://api.example.com/login\",\n        json={\"phone\": \"13800000000\", \"code\": \"123456\"},\n    )\n    assert r.status_code == 200\n    assert r.json()[\"code\"] == 0\n~~~\n\n能写断言，才是「自动化」的开始。\n\n## 二、用 fixture 管理环境和登录态\n\n重复写 base_url、重复登录太烦。pytest 的 fixture 正好解决：\n\n~~~python\nimport pytest\n\n@pytest.fixture\ndef base_url():\n    return \"https://api.example.com\"\n\n@pytest.fixture\ndef token(base_url):\n    r = requests.post(f\"{base_url}/login\", json={})\n    return r.json()[\"data\"][\"token\"]\n~~~\n\n需要登录态的用例直接把 `token` 当参数，pytest 自动注入。\n\n## 三、数据清理比写用例更重要\n\n接口测试最大的坑是「脏数据」：用例 A 建了条数据，用例 B 依赖它，顺序一变就挂。我的原则：每个用例自己造数据、自己清，不依赖执行顺序。删除接口不稳就靠数据库直连回滚。\n\n## 四、参数化覆盖异常场景\n\n~~~python\n@pytest.mark.parametrize(\"phone, expected\", [\n    (\"\", \"手机号不能为空\"),\n    (\"123\", \"手机号格式错误\"),\n])\ndef test_phone_invalid(base_url, phone, expected):\n    r = requests.post(f\"{base_url}/login\", json={\"phone\": phone})\n    assert expected in r.json()[\"msg\"]\n~~~\n\n一条测试函数覆盖多组异常，性价比极高。\n\n> 接口自动化的价值不在「跑通一次」，在「每次发版都能放心点一下」。稳定、可重复，比用例数量重要。\n\n## 小结\n\npytest + requests 上手成本很低，但要写好得懂 fixture、参数化、数据隔离。这三件套吃透，接口回归就从噩梦变日常。"
  },
  {
    "id": "fiddler-whistle-proxy-testing",
    "title": "用 Fiddler 和 Whistle 抓包改包辅助测试的实用技巧",
    "date": "2026-03-18",
    "tag": "测试工具",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-fiddler-whistle-proxy-testing.png",
    "excerpt": "抓包工具是我日常测试中最常用的武器之一。从最早用 Fiddler 到后来换 Whistle，分享一些实战技巧：模拟弱网、篡改响应、Mock第三方接口、定位前后端 bug 归属……这些技巧帮我解决过不少疑难杂症。",
    "tags": [
      "Fiddler",
      "Whistle",
      "抓包调试",
      "Mock",
      "网络调试"
    ],
    "readTime": "11 分钟",
    "content": "## 前言\n\n抓包工具是我日常测试最常用的武器。从最早用 Fiddler 到后来换 Whistle，帮我省过不少时间。分享几个实战技巧。\n\n## 一、弱网模拟：别只看正常情况\n\nFiddler 的 Rules → Performance 能模拟 2G / 3G 延迟。很多线上反馈「转圈转半天」，本地网好复现不了，开弱网一测就出来。\n\nWhistle 更灵活，直接写规则限速：\n\n~~~\npattern://example.com/ api:delay(1000)\n~~~\n\n## 二、改包：不靠后端也能测前端容错\n\n后端返回结构变了、字段缺失，前端怎么表现？用 Whistle 的 `resBody` 直接改响应：\n\n~~~\npattern://api.example.com/user resBody://{mock_user}\n~~~\n\n把 `mock_user` 里的头像字段删掉，看前端会不会白屏。这种「异常容错」测试，纯靠等后端太慢，自己改包最快。\n\n## 三、Mock 第三方接口\n\n支付、短信这类第三方接口测不了真实环境。用代理把请求拦下来返回固定假数据，主流程照样能跑。\n\n## 四、定位前后端 bug 归属\n\n同一个接口，App 报错、Postman 正常——大概率前端传参问题；Postman 也报错——后端锅。抓包看真实请求和响应，谁的责任一眼看清，少背好多锅。\n\n> 抓包不是「黑客技能」，是测试的基本功。能看清网络上跑的东西，你才算真正参与了系统。\n\n## 小结\n\nFiddler 上手快、图形化友好；Whistle 基于 Node、规则强大、跨平台。新手从 Fiddler 入门，玩熟了换 Whistle，效率直接上一个台阶。"
  },
  {
    "id": "perf-test-loadrunner-jmeter",
    "title": "性能测试入门：从 LoadRunner 到 JMeter 的转型思考",
    "date": "2026-02-15",
    "tag": "性能测试",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-perf-test-loadrunner-jmeter.png",
    "excerpt": "蒜泥科技实习后期接触了一些性能测试的工作。从公司老项目用的 LoadRunner 到我自己学的 JMeter，聊聊性能测试入门的心得：不要被工具吓倒，核心思路其实很简单——模拟真实用户行为，观察系统反应。",
    "tags": [
      "JMeter",
      "LoadRunner",
      "性能测试",
      "压测",
      "瓶颈分析"
    ],
    "readTime": "13 分钟",
    "content": "## 前言\n\n蒜泥科技实习后期接触了一些性能测试。公司老项目用 LoadRunner，我自己学 JMeter。聊聊入门心得：别被工具吓倒，核心思路就一句——模拟真实用户行为，观察系统反应。\n\n## 一、先搞清楚测什么\n\n新手最容易一上来就狂压，报告一堆数字自己都看不懂。动手前先问三个问题：\n\n- 目标是什么？是看最大并发，还是看稳定性，还是找瓶颈？\n- 真实用户怎么用？哪个接口是热点？\n- 通过标准是什么？响应时间、错误率红线在哪？\n\n## 二、LoadRunner vs JMeter\n\nLoadRunner 功能强但重，License 贵、脚本用 C 写，门槛高。JMeter 开源、Java 写、社区大，GUI 就能搭脚本：\n\n~~~\nThread Group\n  └─ HTTP Request (登录)\n  └─ HTTP Request (查询列表)\n  └─ View Results Tree / Aggregate Report\n~~~\n\n我实习时先用 LoadRunner 跑老脚本，自己用 JMeter 搭新场景，对比着学，理解更快。\n\n## 三、别只盯 TPS，要看瓶颈在哪\n\n压测报告 TPS 上去了，但响应时间也涨，说明到瓶颈了。我用 JMeter + 服务器监控（CPU、内存、慢 SQL）定位：发现是某个没加索引的查询拖垮整体，加完索引 TPS 翻倍。\n\n> 性能测试不是「把机器跑死」，是「找到那根最短的木板」。没有监控的压测只是表演。\n\n## 小结\n\n工具只是手段。想清楚目标、设计好场景、配好监控，LoadRunner 还是 JMeter 没那么重要。新手从 JMeter 入门性价比最高。"
  },
  {
    "id": "frontend-review-tester-view",
    "title": "从测试视角评审前端页面：我关注什么",
    "date": "2026-01-12",
    "tag": "前端开发",
    "tagClass": "tag-css",
    "cover": "assets/covers/cover-frontend-review-tester-view.png",
    "excerpt": "作为测试工程师，评审前端交付物是我的日常工作之一。不同于开发者关注实现细节，我会从用户体验、边界情况、兼容性等角度去看。这篇整理了我常关注的检查清单和一些真实案例。",
    "tags": [
      "前端评审",
      "UI测试",
      "交互体验",
      "CSS",
      "响应式"
    ],
    "readTime": "10 分钟",
    "content": "## 前言\n\n作为测试工程师，评审前端交付物是我的日常。和开发者关注实现不同，我更从用户、边界、兼容角度看。整理一份常看的检查清单。\n\n## 一、边界情况：正常流程之外才是重心\n\n开发者自测常走「理想路径」，我偏挑反面：\n\n- 空状态：列表没数据、搜索无结果，页面别崩、别空白\n- 超长内容：昵称 50 字、商品名一行塞不下，布局会不会炸\n- 极端数值：金额 0、负数、小数点后多位\n\n## 二、交互与反馈：用户知道发生什么吗\n\n- 按钮点了有没有 loading，防不防重复提交\n- 操作失败有没有明确提示，而不是默默没反应\n- 表单校验时机对不对：失焦校验还是提交才校验\n\n## 三、兼容性：不止 Chrome\n\n我们用户还有 Safari、微信内置浏览器。flex 老语法、iOS 日期控件、1px 边框这些坑，只在 Chrome 测永远发现不了。我会专门开真机或模拟器过一遍。\n\n## 四、可访问性：别把一部分人挡在外面\n\n- 图片有没有 alt\n- 颜色对比度够不够，色弱用户能不能分清\n- 键盘能不能操作核心流程\n\n> 好的前端不是「功能实现了」，是「各种意外下都不难看、不崩溃、说得清」。测试评审就是在帮用户提前踩这些雷。\n\n## 小结\n\n测试视角评审，本质是「替用户多想一步」。清单不用长，但每条都得是真实会发生的场景。"
  },
  {
    "id": "fullstack-to-testdev-journey",
    "title": "从全栈工程师转测试开发：我的认知转变与收获",
    "date": "2024-11-20",
    "tag": "职业成长",
    "tagClass": "tag-test",
    "cover": "assets/covers/cover-fullstack-to-testdev-journey.png",
    "excerpt": "从软件工作室的全栈开发到蒜泥科技的测试实习生再到度小满的驻场自动化工程师，这一年多的职业路径跨度不小。聊聊我为什么选择转测试、过程中经历了哪些认知碰撞、以及现在对这个方向的看法。",
    "tags": [
      "职业规划",
      "测试开发",
      "全栈转测试",
      "成长复盘",
      "心路历程"
    ],
    "readTime": "16 分钟",
    "content": "## 前言\n\n从软件工作室的全栈开发，到蒜泥科技的测试实习生，再到度小满的驻场自动化工程师，这一年多跨度不小。聊聊为什么转测试、经历的认知碰撞、现在对这个方向的看法。\n\n## 一、为什么转\n\n工作室做全栈时，我发现自己最在意的一刻，不是功能写出来，而是「它真的稳不稳定、用户会不会踩坑」。写的时候爽，线上出 bug 那叫一个煎熬。慢慢我对「质量」这件事比「功能」更上心。\n\n实习投了测试岗，本以为是退而求其次，结果一做就发现自己更适合：我天生喜欢挑毛病、想边界、看系统怎么垮。\n\n## 二、认知碰撞\n\n### 碰撞1：测试不是「点界面」\n\n进来才发现，现代测试开发是写代码、搭平台、做工程化的。自动化、性能、工具链，全是技术活。我全栈的底子反而成了优势。\n\n### 碰撞2：质量是整个团队的事\n\n新手以为测试是「最后一道闸」，把锅都接住。其实越早介入越好：评审需求、设计用例、左移。等代码写完了再测，成本最高。\n\n### 碰撞3：和开发的关系\n\n不是对立。好的测试是开发的合伙人：用抓包和数据说话，帮他们快速定位，而不是甩一句「你这边有问题」。\n\n## 三、现在的看法\n\n测试开发不是「写不了功能才来做测试」，恰恰相反——要懂功能、懂架构、懂用户，才能测好。这条路越走越宽：自动化、质量平台、效能工程，都是能深耕的方向。\n\n> 转行不可怕，可怕的是不知道自己要什么。我花了几次试错才确认：比起「造功能」，我更享受「守住质量」。\n\n## 小结\n\n从全栈到测试开发，不是绕路，是找到更适合自己的位置。技术栈会迁移，但「对质量的执念」成了我长期的竞争力。"
  },
  {
    "id": "spring-vue3-fullstack-pitfalls",
    "title": "从零搭建 SpringBoot + Vue3 全栈项目，我踩过的那些坑",
    "date": "2024-03-15",
    "tag": "全栈开发",
    "tagClass": "tag-vue",
    "cover": "assets/covers/cover-spring-vue3-fullstack-pitfalls.png",
    "excerpt": "在软件工作室独立孵化项目时，我从零搭了一套 SpringBoot + Vue3 的前后端分离架构。踩了无数坑之后总结出这些经验：API设计规范、跨域处理、状态管理、部署上线……希望能帮到同样在摸索的同学。",
    "tags": [
      "SpringBoot",
      "Vue3",
      "全栈开发",
      "MyBatis",
      "Redis"
    ],
    "readTime": "14 分钟",
    "content": "## 前言：为什么想写这篇\n\n在软件工作室做独立项目时，我从头到尾负责一个「专家智库」系统的前后端。技术栈 SpringBoot + Vue3 + MyBatis + MySQL。当时觉得组合主流、资料多，实际做下来才发现：资料多归多，讲清楚「怎么把前后端串起来跑通完整流程」的很少。\n\n这篇把我踩的坑按阶段整理，每个坑附上错误做法和正确解法。\n\n## 一、初始化阶段：别小看目录结构\n\n### 坑1：后端没有统一返回格式\n\n最开始每个 Controller 直接 return 对象，前端拿到的数据格式五花八门。要加状态码、分页元数据，所有地方都得改。\n\n后来定义统一 `Result<T>`：\n\n~~~java\npublic class Result<T> {\n    private int code;\n    private String msg;\n    private T data;\n    public static <T> Result<T> ok(T data) {\n        return new Result<>(200, \"success\", data);\n    }\n}\n~~~\n\n前端只要认 `code / msg / data`，再也不怕接口返参乱跳。\n\n### 坑2：跨域一股脑放行\n\n开发期图省事 `@CrossOrigin` 全开，上线忘了收敛。正确做法：开发用代理（Vite proxy），生产靠网关统一处理，别把 CORS 写成永久全开。\n\n## 二、业务阶段：联表与分页\n\nMyBatis 联表我一开始用嵌套 `resultMap`，复杂查询一多就乱。后来简单查询用注解 `@Select`，复杂报表才上 XML，清晰很多。\n\n分页别在代码里手写 limit，直接上 PageHelper 或 MyBatis-Plus 的分页插件，前端传 `page / size`，后端返 `total`。\n\n## 三、部署阶段：配置分离\n\n最坑的一次是把数据库密码写死在代码里，本地能跑，上服务器连不上。正确做法：用 `application.yml` + 环境变量，本地 / 测试 / 生产各一套 profile，敏感信息走环境变量。\n\n> 全栈最贵的不是写功能，是把「本地能跑」变成「哪都能跑」。配置、依赖、环境，一样都不能写死。\n\n## 小结\n\n全栈项目真正的门槛不是某个框架，而是「前后端怎么优雅地约定接口、怎么把环境差异隔离掉」。把这两件事想清楚，后面的路会顺很多。"
  }
];
