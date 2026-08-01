import urllib.request
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

urls_to_test = [
    'https://www.cookierunhub.com/en/episodes/101',
    'https://www.cookierunhub.com/en/episodes/1',
    'https://www.cookierunhub.com/en/episodes/10',
    'https://www.cookierunhub.com/en/episodes/100',
    'https://www.cookierunhub.com/en/episodes/200'
]

for url in urls_to_test:
    print(f"\nFetching HTML: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
            print(f"Status 200 OK! HTML length: {len(html)}")
            
            # Search for title, h1, or meta tags
            title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE)
            print("Title:", title.group(1) if title else "None")
            print("H1:", h1.group(1) if h1 else "None")
            
            # Search for NEXT_DATA or script tags with combo details
            m_data = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
            if m_data:
                data = json.loads(m_data.group(1))
                print("Found __NEXT_DATA__!")
                print("PageProps keys:", list(data.get('props', {}).get('pageProps', {}).keys()))
                print("Sample pageProps:", json.dumps(data.get('props', {}).get('pageProps', {}), indent=2, ensure_ascii=False)[:800])
            else:
                print("__NEXT_DATA__ not found, checking raw text snippet:")
                # strip html tags
                clean_t = re.sub(r'<[^>]+>', ' ', html)
                clean_t = re.sub(r'\s+', ' ', clean_t).strip()
                print(clean_t[:400])
    except Exception as e:
        print(f"Error: {e}")
