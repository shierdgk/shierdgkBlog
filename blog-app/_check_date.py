from playwright.sync_api import sync_playwright
BASE = "file:///C:/Users/16421/WorkBuddy/2026-07-18-11-34-47/blog-app/"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto(BASE + "post.html?id=selenium-vs-playwright-personal-summary"); pg.wait_for_timeout(500)
    meta = pg.evaluate("() => { const e = document.querySelector('.post-meta'); return e ? e.innerText : 'NO-EL'; }")
    print("META TEXT:", repr(meta))
    has = pg.evaluate("() => document.body.innerText.includes('2026-06-18')")
    print("body contains 2026-06-18:", has)
    b.close()
