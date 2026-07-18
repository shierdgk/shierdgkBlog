import os
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(BASE, "index.html")
OUT = os.path.join(BASE, "_verify_bg")
os.makedirs(OUT, exist_ok=True)

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=2)
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("file://" + INDEX, wait_until="networkidle")
    page.wait_for_timeout(900)

    def info(sel):
        return page.eval_on_selector(sel, """el => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {bg: cs.backgroundImage, w: Math.round(r.width), h: Math.round(r.height), pos: cs.position};
        }""")

    profile = info(".profile")
    rec = info(".rec-banner")
    has_hand = page.query_selector(".banner-hand") is not None
    hand = page.eval_on_selector(".banner-hand", """el => {
        const r = el.getBoundingClientRect();
        return {w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0};
    }""") if has_hand else None

    print("PROFILE bg:", profile["bg"][:120])
    print("REC bg:", rec["bg"][:120])
    print("REC position:", rec["pos"], "size:", rec["w"], "x", rec["h"])
    print("HAND present:", has_hand, "box:", hand)

    # light viewport (shows sidebar w/ profile + rec-banner + hand)
    page.screenshot(path=os.path.join(OUT, "index_light.png"))
    # dark
    page.click("#themeToggle")
    page.wait_for_timeout(700)
    page.screenshot(path=os.path.join(OUT, "index_dark.png"))
    browser.close()

print("CONSOLE ERRORS:", errors if errors else "none")
