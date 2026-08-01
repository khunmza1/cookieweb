import cloudscraper
from bs4 import BeautifulSoup

scraper = cloudscraper.create_scraper(
    browser={
        'browser': 'chrome',
        'platform': 'darwin',
        'desktop': True
    }
)

url = "https://cookierun.wiki/w/General_Jujube_Cookie%27s_Immaculate_Comb"
res = scraper.get(url)
print("Status:", res.status_code)
if res.status_code == 200:
    soup = BeautifulSoup(res.text, 'html.parser')
    title = soup.find('h1', {'id': 'firstHeading'})
    print("Title:", title.text if title else "No title")
    
    # Check images in page
    imgs = soup.find_all('img')
    print("Found images:", len(imgs))
    for img in imgs[:5]:
        print("  - Img src:", img.get('src'))

    # Check tables/content
    tables = soup.find_all('table')
    print("Found tables:", len(tables))
    for t in tables[:3]:
        print("Table text snippet:", t.text[:150].replace('\n', ' '))
