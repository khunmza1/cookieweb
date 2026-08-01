import cloudscraper
from bs4 import BeautifulSoup

scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'darwin', 'mobile': False})
url = "https://cookierun.wiki/w/Angel_Cookie/Classic"

try:
    resp = scraper.get(url, timeout=10)
    print(f"Status: {resp.status_code}")
    soup = BeautifulSoup(resp.content, 'html.parser')
    print(f"Title: {soup.title.text if soup.title else 'No Title'}")
    imgs = soup.find_all('img')
    print(f"Found {len(imgs)} images")
    for img in imgs[:10]:
        print("  Img:", img.get('src'))
except Exception as e:
    print(f"Error: {e}")
