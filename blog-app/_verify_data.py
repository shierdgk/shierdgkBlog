import os
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(BASE, "_verify_data")
os.makedirs(out, exist_ok=True)

# 7-article payload to exercise pagination (page size = 5)
seven_articles = "window.BLOG_ARTICLES = [" + ",".join(
    "{" +
    "id:'a%d',title:'测试文章 %d',date:'2024-01-0%d'," % (i, i, (i % 9) + 1) +
    "tag:'X',tagClass:'tag-react',cover:'linear-gradient(135deg,#6b8aff,#8cc7ff)'," +
    "excerpt:'摘要摘要摘要',content:'## 标题\\n\\n正文段落。'}" for i in range(7)
) + "];"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERROR: " + str(e)))

    def file_url(name):
        return "file://" + os.path.join(BASE, name)

    # ---------- 1. 首页（拦截 articles-data.js 注入 7 篇，测试分页）----------
    pg.route("**/articles-data.js", lambda route: route.fulfill(
        content_type="application/javascript", body=seven_articles))
    pg.goto(file_url("index.html"), wait_until="networkidle")
    feed_count = pg.eval_on_selector_all("#homeFeed .article-card", "e=>e.length")
    pager_btns = pg.eval_on_selector_all("#homePager .pg[data-page]", "e=>e.length")
    count_text = pg.eval_on_selector("#articlesCount", "e=>e.textContent")
    # 翻到第 2 页
    pg.click('#homePager .pg[data-page="2"]')
    pg.wait_for_timeout(300)
    feed2 = pg.eval_on_selector_all("#homeFeed .article-card", "e=>e.length")
    print(f"[index+pagination] page1={feed_count} pages={pager_btns} count='{count_text}' page2={feed2}")
    pg.screenshot(path=os.path.join(out, "index_p2.png"))
    pg.unroute("**/articles-data.js")

    # ---------- 2. 首页（正常 4 篇）----------
    errors.clear()
    pg.goto(file_url("index.html"), wait_until="networkidle")
    feed = pg.eval_on_selector_all("#homeFeed .article-card", "e=>e.length")
    pager_empty = pg.eval_on_selector("#homePager", "e=>e.innerHTML.trim()===''")
    count = pg.eval_on_selector("#articlesCount", "e=>e.textContent")
    first_href = pg.eval_on_selector("#homeFeed .article-card", "e=>e.getAttribute('href')")
    print(f"[index] cards={feed} pagerEmpty={pager_empty} count='{count}' firstHref={first_href}")
    print(f"[index] errors: {errors or 'none'}")
    errors.clear()
    pg.screenshot(path=os.path.join(out, "index.png"))

    # ---------- 3. 文章列表页 ----------
    pg.goto(file_url("articles.html"), wait_until="networkidle")
    cards = pg.eval_on_selector_all("#articleGrid .art-card", "e=>e.length")
    print(f"[articles] cards={cards}")
    print(f"[articles] errors: {errors or 'none'}")
    errors.clear()
    pg.screenshot(path=os.path.join(out, "articles.png"))

    # ---------- 4. 文章详情（react，Markdown 渲染）----------
    pg.goto(file_url("post.html?id=react-server-components"), wait_until="networkidle")
    has_h2 = pg.eval_on_selector(".post-body h2", "e=>!!e")
    has_pre = pg.eval_on_selector(".post-body pre code", "e=>!!e")
    has_ul = pg.eval_on_selector(".post-body ul", "e=>!!e")
    has_bq = pg.eval_on_selector(".post-body blockquote", "e=>!!e")
    title = pg.eval_on_selector(".post-title", "e=>e.textContent")
    # 第一篇：上一篇应为空，下一篇存在
    prev_empty = pg.query_selector(".post-nav .pn-prev") is None
    next_exists = pg.query_selector(".post-nav .pn-next") is not None
    print(f"[post/react] h2={has_h2} pre={has_pre} ul={has_ul} blockquote={has_bq} title='{title}' prevEmpty={prev_empty} next={next_exists}")
    print(f"[post/react] errors: {errors or 'none'}")
    errors.clear()
    pg.screenshot(path=os.path.join(out, "post_react.png"))

    # ---------- 5. 文章详情（css，含表格）----------
    pg.goto(file_url("post.html?id=css-container-queries-guide"), wait_until="networkidle")
    has_table = pg.eval_on_selector(".post-body table", "e=>!!e")
    # 最后一篇：下一篇应为空
    next_empty = pg.query_selector(".post-nav .pn-next") is None
    prev_exists = pg.query_selector(".post-nav .pn-prev") is not None
    print(f"[post/css] table={has_table} prev={prev_exists} nextEmpty={next_empty}")
    print(f"[post/css] errors: {errors or 'none'}")
    errors.clear()

    # ---------- 6. 未找到 ----------
    pg.goto(file_url("post.html?id=not-exist"), wait_until="networkidle")
    notfound = pg.eval_on_selector("body", "e=>e.textContent.includes('文章未找到')")
    print(f"[post/404] notFound={notfound}")

    b.close()
print("\nALL DONE")
