from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json

def inspect_url(page, url):
    print(f"\n================ INSPECTING: {url} ================")
    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    soup = BeautifulSoup(page.content(), 'html.parser')

    # Heading
    heading = soup.find('h1', {'id': 'firstHeading'})
    print("Heading:", heading.text if heading else "None")

    # Look for Infobox
    infobox = soup.find('table', class_=lambda c: c and ('infobox' in c.lower() or 'wikitable' in c.lower() or 'portable-infobox' in c.lower()))
    if not infobox:
        print("No infobox table found! All tables:")
        for i, t in enumerate(soup.find_all('table')):
            print(f" Table {i} class: {t.get('class')} - rows: {len(t.find_all('tr'))}")
    else:
        print("Infobox found! Class:", infobox.get('class'))
        print("Infobox rows:")
        for tr in infobox.find_all('tr'):
            ths = [th.text.strip() for th in tr.find_all('th')]
            tds = [td.text.strip() for td in tr.find_all('td')]
            imgs = [img.get('src') for img in tr.find_all('img')]
            print(f"  TH: {ths} | TD: {tds} | IMGS: {imgs}")

    # Check all images in page
    all_imgs = soup.find_all('img')
    print(f"Total images in page: {len(all_imgs)}")
    for i, img in enumerate(all_imgs[:10]):
        print(f"  Img #{i}: src={img.get('src')} | width={img.get('width')} | alt={img.get('alt')} | parent={img.parent.name}")

    # Check headings & tables for Level stats
    for i, t in enumerate(soup.find_all('table')):
        headers = [th.text.strip() for th in t.find_all('th')]
        print(f"Table #{i} Headers: {headers}")
        rows = t.find_all('tr')
        for r in rows[:5]:
            cols = [c.text.strip() for c in r.find_all(['td', 'th'])]
            print(f"    Row: {cols}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        inspect_url(page, "https://cookierun.wiki/w/Angel_Cookie/Classic")
        inspect_url(page, "https://cookierun.wiki/w/General_Jujube_Cookie%27s_Immaculate_Comb")
        inspect_url(page, "https://cookierun.wiki/w/Flower_Pod/LINE")
        inspect_url(page, "https://cookierun.wiki/w/List_of_Cookies/Classic")
        
        browser.close()

if __name__ == "__main__":
    main()
