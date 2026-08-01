import re
import json

with open('.cache_cookierunhub/extracted_scripts.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Look for URLs, endpoints, or data objects
urls = set(re.findall(r'https?://[^\s"\'<>]+', text))
print(f"URLs found ({len(urls)}):")
for u in list(urls)[:15]:
    print(" ", u)

paths = set(re.findall(r'["\'](/[a-zA-Z0-9_\-/.]+)["\']', text))
api_paths = [p for p in paths if 'api' in p or 'combo' in p or 'episode' in p or 'recommend' in p or 'json' in p]
print(f"\nAPI / Data paths found ({len(api_paths)}):")
for p in api_paths[:20]:
    print(" ", p)

# Search for initial state or build manifest scripts
build_id = re.search(r'"buildId":\s*"([^"]+)"', text)
if build_id:
    print(f"\nNext.js Build ID: {build_id.group(1)}")
