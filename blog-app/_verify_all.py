import sys
from playwright.sync_api import sync_playwright

BASE = "file:///C:/Users/16421/WorkBuddy/2026-07-18-11-34-47/blog-app/"
SNAP = "C:/Users/16421/WorkBuddy/2026-07-18-11-34-47/blog-app/"

def log(msg):
    print(msg, flush=True)

results = []
def check(name, cond, extra=""):
    results.append((name, cond))
    log(("PASS" if cond else "FAIL") + " - " + name + ((" | " + extra) if extra else ""))

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # ---------- 1. INDEX ----------
    log("\n=== INDEX ===")
    page.goto(BASE + "index.html")
    page.wait_for_timeout(400)
    card_count = page.evaluate("document.querySelectorAll('#homeFeed .article-card').length")
    check("首页文章卡片渲染", card_count > 0, f"count={card_count}")
    home_pager = page.evaluate("document.querySelectorAll('#homePager .pg').length")
    check("首页分页组件存在", home_pager > 0, f"pgBtns={home_pager}")
    has_grad = page.evaluate("""() => {
        const el = document.querySelector('#homeFeed .thumb');
        if(!el) return false;
        return getComputedStyle(el).backgroundImage.includes('gradient');
    }""")
    check("封面为渐变(无图片水印)", has_grad)
    page.evaluate("window.scrollTo(0, 900)")
    page.wait_for_timeout(300)
    vis = page.evaluate("document.getElementById('backToTop').classList.contains('visible')")
    check("首页下滑出现火箭按钮", vis)
    page.click("#backToTop")
    page.wait_for_timeout(700)
    y = page.evaluate("window.scrollY")
    check("点击火箭回到顶部", y < 50, f"scrollY={y}")
    page.screenshot(path=SNAP + "_v_idx.png")

    # ---------- 2. ARTICLES LIST ----------
    log("\n=== ARTICLES LIST ===")
    page.goto(BASE + "articles.html")
    page.wait_for_timeout(400)
    grid = page.evaluate("document.querySelectorAll('#articleGrid > *').length")
    check("列表页每页=8篇", grid == 8, f"grid={grid}")
    pager_btns = page.evaluate("document.querySelectorAll('#artPager button').length")
    check("列表页分页组件存在", pager_btns > 0, f"pagerBtns={pager_btns}")
    info = page.evaluate("document.getElementById('pageInfo') ? document.getElementById('pageInfo').textContent : ''")
    check("分页信息显示共10篇", "10" in info, f"info={info}")
    clicked = page.evaluate("""() => {
        const b = [...document.querySelectorAll('#artPager button')].find(x=>x.textContent.trim()==='2');
        if(b){ b.click(); return true; } return false;
    }""")
    page.wait_for_timeout(400)
    grid2 = page.evaluate("document.querySelectorAll('#articleGrid > *').length")
    check("翻到第2页渲染剩余2篇", clicked and grid2 == 2, f"page2grid={grid2}")
    page.screenshot(path=SNAP + "_v_articles.png")

    # ---------- 3. POST DETAIL ----------
    log("\n=== POST DETAIL ===")
    page.goto(BASE + "post.html?id=spring-vue3-fullstack-pitfalls")
    page.wait_for_timeout(500)
    has_glass = page.evaluate("document.querySelectorAll('.post-glass-wrap').length")
    check("详情页玻璃遮罩容器存在", has_glass > 0, f"glass={has_glass}")
    h2 = page.evaluate("document.querySelectorAll('.post-body h2, .post-glass-wrap h2').length")
    check("详情页正文渲染(Markdown标题)", h2 > 0, f"h2={h2}")
    code = page.evaluate("document.querySelectorAll('.post-body pre, .post-glass-wrap pre').length")
    check("详情页代码块渲染", code > 0, f"pre={code}")
    page.evaluate("window.scrollTo(0, 1000)")
    page.wait_for_timeout(300)
    vis = page.evaluate("document.getElementById('backToTop').classList.contains('visible')")
    check("详情页下滑出现火箭按钮", vis)
    page.screenshot(path=SNAP + "_v_post.png")

    # ---------- 4. ABOUT ----------
    log("\n=== ABOUT ===")
    page.goto(BASE + "about.html")
    page.wait_for_timeout(400)
    page.evaluate("window.scrollTo(0, 1000)")
    page.wait_for_timeout(300)
    vis = page.evaluate("document.getElementById('backToTop').classList.contains('visible')")
    check("关于页下滑出现火箭按钮", vis)
    page.screenshot(path=SNAP + "_v_about.png")

    browser.close()

passed = sum(1 for _, c in results if c)
total = len(results)
log(f"\n===== SUMMARY: {passed}/{total} passed =====")
for n, c in results:
    log(("  [OK] " if c else "  [XX] ") + n)
sys.exit(0 if passed == total else 1)
