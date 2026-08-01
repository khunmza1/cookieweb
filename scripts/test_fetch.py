import urllib.request
import ssl
from bs4 import BeautifulSoup

url = "https://cookierun.wiki/w/Angel_Cookie/Classic"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

req = urllib.request.Request(url, headers=headers)
context = ssl.create_default_context()
try:
    with urllib.request.urlopen(req, context=context, timeout=10) as resp:
        print(f"Status: {resp.status}")
        soup = BeautifulSoup(resp.read(), 'html.parser')
        print(f"Title: {soup.title.text if soup.title else 'No Title'}")
        imgs = soup.find_all('img')
        print(f"Found {len(imgs)} images")
        for img in imgs[:5]:
            print("  Img:", img.get('src'))
except Exception as e:
    print(f"Error: {e}")
