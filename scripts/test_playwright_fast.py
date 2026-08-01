from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time

url = "https://cookierun.wiki/w/Angel_Cookie/Classic"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    
    # Block heavy subresources (fonts, stylesheets, media) so page loads instantly
    page = context.new_page()
    page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["stylesheet", "font", "media"] else route.continue_())

    t0 = time.time()
    page.goto(url, wait_until="domcontentloaded", timeout=10000)
    t1 = time.time()

    print(f"Loaded in {t1-t0:.2f}s!")
    soup = BeautifulSoup(page.content(), 'html.parser')
    print(f"Title: {soup.title.text if soup.title else 'No Title'}")
    
    for img in soup.find_all('img'):
        src = img.get('src', '')
        w = img.get('width', '')
        alt = img.get('alt', '')
        print(f"  Img: {src} (w={w}, alt={alt})")

    browser.close()
