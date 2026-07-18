from playwright.sync_api import sync_playwright
import os

BASE = "file://" + os.path.dirname(os.path.abspath(__file__))
TASKS = [
    ("index.html", "_verify_index_light.png", "light"),
    ("index.html", "_verify_index_dark.png", "dark"),
    ("about.html", "_verify_about_light.png", "light"),
    ("about.html", "_verify_about_dark.png", "dark"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    for html, out, theme in TASKS:
        page.emulate_media(color_scheme="light" if theme == "light" else "dark")
        page.goto(BASE + "/" + html)
        page.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
        page.wait_for_timeout(400)
        page.screenshot(path=out, full_page=True)
        print(out, "saved")
    browser.close()
print("done")
