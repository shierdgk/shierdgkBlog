import sys
from playwright.sync_api import sync_playwright

BASE = "file:///C:/Users/16421/WorkBuddy/2026-07-18-11-34-47/blog-app/"
SNAP = "C:/Users/16421/WorkBuddy/2026-07-18-11-34-47/blog-app/"

results = []
def check(name, cond, extra=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL") + " - " + name + ((" | " + extra) if extra else ""), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    failed_imgs = []
    page.on("response", lambda r: failed_imgs.append(r.url) if (r.url.endswith(".png") and r.status >= 400) else None)

    # INDEX
    print("\n=== INDEX ===")
    page.goto(BASE + "index.html")
    page.wait_for_timeout(600)
    bg = page.evaluate("""() => {
        const el = document.querySelector('#homeFeed .thumb');
        return el ? getComputedStyle(el).backgroundImage : '';
    }""")
    check("首页封面为图片(url)", "url(" in bg and "covers/" in bg, f"bg={bg[:55]}")
    # all 5 visible thumbs reference a real cover file
    thumbs = page.evaluate("""() => [...document.querySelectorAll('#homeFeed .thumb')].map(e=>getComputedStyle(e).backgroundImage)""")
    all_img = all("url(" in t for t in thumbs)
    check("首页5张封面均为图片", all_img, f"n={len(thumbs)}")
    banner = page.evaluate("document.querySelector('.banner-date') ? document.querySelector('.banner-date').textContent : ''")
    check("查看我的经历日期=当前", "2026年7月18日" in banner, f"banner={banner}")
    page.screenshot(path=SNAP + "_v_idx2.png")

    # ARTICLES
    print("\n=== ARTICLES ===")
    page.goto(BASE + "articles.html")
    page.wait_for_timeout(600)
    ath = page.evaluate("""() => [...document.querySelectorAll('#articleGrid .art-thumb')].map(e=>getComputedStyle(e).backgroundImage)""")
    check("列表页封面均为图片", all("url(" in t for t in ath), f"n={len(ath)}")
    page.screenshot(path=SNAP + "_v_articles2.png")

    # POST
    print("\n=== POST ===")
    page.goto(BASE + "post.html?id=selenium-vs-playwright-personal-summary")
    page.wait_for_timeout(600)
    pcov = page.evaluate("""() => { const el=document.querySelector('.post-cover'); return el?getComputedStyle(el).backgroundImage:''; }""")
    check("详情页封面为图片", "url(" in pcov, f"bg={pcov[:50]}")
    pdat = page.evaluate("() => document.body.innerText")
    check("详情页日期显示2026-06-18", "2026-06-18" in pdat, f"found={('2026-06-18' in pdat)}")
    page.screenshot(path=SNAP + "_v_post2.png")

    browser.close()

    check("无损坏的图片(HTTP>=400)", len(failed_imgs) == 0, f"failed={failed_imgs}")

passed = sum(1 for _, c in results if c)
total = len(results)
print(f"\n===== SUMMARY: {passed}/{total} passed =====")
for n, c in results:
    print(("  [OK] " if c else "  [XX] ") + n)
sys.exit(0 if passed == total else 1)
