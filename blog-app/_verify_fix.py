import os
from playwright.sync_api import sync_playwright

BASE = "file://" + os.path.abspath(os.path.dirname(__file__)) + "/"
OUT = os.path.abspath(os.path.dirname(__file__))
errors = []

def nav_href(page, text):
    return page.eval_on_selector(f".nav-links a:has-text('{text}')", "el => el.getAttribute('href')")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # ---------- 1. index.html nav ----------
    page.goto(BASE + "index.html", wait_until="networkidle")
    about_href = nav_href(page, "关于")
    arc_href = nav_href(page, "归档")
    home_href = nav_href(page, "首页")
    print("[index] 首页 href=", home_href, "| 归档 href=", arc_href, "| 关于 href=", about_href)
    if about_href != "about.html": errors.append("index 关于链接应为 about.html，实际=" + str(about_href))
    if arc_href != "archive.html": errors.append("index 归档链接应为 archive.html，实际=" + str(arc_href))

    # click 关于 -> should navigate to about.html
    page.click(".nav-links a:has-text('关于')")
    page.wait_for_url("**/about.html", timeout=5000)
    print("[index] 点击「关于」后 URL:", page.url)
    if not page.url.endswith("about.html"): errors.append("index 点击关于未跳转到 about.html")

    # ---------- 2. about.html nav ----------
    page.goto(BASE + "about.html", wait_until="networkidle")
    art_href = nav_href(page, "文章")
    print("[about] 文章 href=", art_href, "| 归档 href=", nav_href(page, "归档"))
    if art_href != "articles.html": errors.append("about 文章链接应为 articles.html，实际=" + str(art_href))
    page.click(".nav-links a:has-text('文章')")
    page.wait_for_url("**/articles.html", timeout=5000)
    print("[about] 点击「文章」后 URL:", page.url)

    # ---------- 3. articles.html cards ----------
    page.goto(BASE + "articles.html", wait_until="networkidle")
    cards = page.query_selector_all(".art-card")
    print("[articles] 卡片数:", len(cards))
    if len(cards) != 3: errors.append("articles 卡片数应为3，实际=" + str(len(cards)))
    # 归档 link
    if nav_href(page, "归档") != "archive.html": errors.append("articles 归档链接应为 archive.html")

    # ---------- 4. archive.html ----------
    page.goto(BASE + "archive.html", wait_until="networkidle")
    arc_items = page.query_selector_all(".arc-item")
    print("[archive] 归档条目数:", len(arc_items))
    if len(arc_items) != 3: errors.append("archive 条目数应为3，实际=" + str(len(arc_items)))
    first_href = page.eval_on_selector(".arc-item", "el => el.getAttribute('href')")
    print("[archive] 第一条链接:", first_href)
    if "post.html?id=" not in (first_href or ""): errors.append("archive 条目链接错误")
    page.screenshot(path=os.path.join(OUT, "_v_archive.png"))

    # ---------- 5. post.html styling ----------
    page.goto(BASE + "post.html?id=new-project-auto-test-summary", wait_until="networkidle")
    # reading progress
    rp = page.query_selector("#readingProgress")
    print("[post] 阅读进度条存在:", rp is not None)
    if rp is None: errors.append("post 缺少阅读进度条")
    # code blocks enhanced
    code_blocks = page.query_selector_all(".code-block")
    code_copies = page.query_selector_all(".code-copy")
    print("[post] 代码块(带头部)数:", len(code_blocks), "| 复制按钮数:", len(code_copies))
    if len(code_blocks) == 0: errors.append("post 代码块未加语言标签/复制按钮")
    if len(code_copies) == 0: errors.append("post 缺少复制按钮")
    # cover image
    cover_bg = page.eval_on_selector(".post-cover", "el => getComputedStyle(el).backgroundImage")
    print("[post] 封面背景:", cover_bg[:80])
    if "cover-new-project.png" not in cover_bg: errors.append("post 封面未使用生成的图片: " + cover_bg)
    # copy button works
    if code_copies:
        code_copies[0].click()
        page.wait_for_timeout(300)
        txt = page.eval_on_selector(".code-copy", "el => el.textContent")
        print("[post] 复制按钮点击后文案:", txt)
        if txt not in ("已复制",): errors.append("post 复制按钮未反馈已复制, 实际=" + str(txt))
    page.screenshot(path=os.path.join(OUT, "_v_post_light.png"), full_page=False)
    # dark mode screenshot
    page.click("#themeToggle")
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(OUT, "_v_post_dark.png"))

    # ---------- 6. home light + dark screenshots ----------
    page.goto(BASE + "index.html", wait_until="networkidle")
    page.screenshot(path=os.path.join(OUT, "_v_index_light.png"))
    page.click("#themeToggle"); page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(OUT, "_v_index_dark.png"))

    page.goto(BASE + "about.html", wait_until="networkidle")
    page.screenshot(path=os.path.join(OUT, "_v_about.png"))

    browser.close()

print("\n=== ERRORS ===")
if errors:
    for e in errors: print(" -", e)
else:
    print("无错误，全部导航与样式校验通过 ✅")
