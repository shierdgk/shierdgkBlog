import os
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.abspath(__file__))

checks = {
    "index.html": ["粉丝", "获赞", "访问量"],
    "about.html": ["十二当归客", "查看我的经历"],
}

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    for f, expect in checks.items():
        errors.clear()
        url = "file://" + os.path.join(BASE, f)
        pg.goto(url, wait_until="networkidle")
        # logo image natural size
        logo = pg.query_selector(".logo-img")
        nat = pg.evaluate("(el)=>({w:el.naturalWidth,h:el.naturalHeight,src:el.currentSrc})", logo)
        # stats labels
        labels = [t.strip() for t in pg.eval_on_selector_all(".stat-label", "(els)=>els.map(e=>e.textContent.trim())")]
        print(f"[{f}] logo natural={nat['w']}x{nat['h']} loaded={nat['w']>0}")
        print(f"[{f}] stat labels = {labels}")
        for e in expect:
            print(f"[{f}] contains '{e}': {e in labels or e in pg.content()}")
        print(f"[{f}] console errors: {errors if errors else 'none'}")
    os.makedirs(os.path.join(BASE, "_verify_nav"), exist_ok=True)
    pg.goto("file://" + os.path.join(BASE, "index.html"), wait_until="networkidle")
    pg.screenshot(path=os.path.join(BASE, "_verify_nav", "index.png"))
    b.close()
print("done")
