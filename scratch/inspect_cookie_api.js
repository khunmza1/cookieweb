async function testCookieApi() {
  const testUrls = [
    'https://www.cookierunhub.com/api/cookies',
    'https://www.cookierunhub.com/api/pets',
    'https://www.cookierunhub.com/api/treasures',
    'https://www.cookierunhub.com/api/encyclopedia'
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log(`Sample output for ${url}:`, Array.isArray(json) ? `Array length ${json.length}` : Object.keys(json));
        if (Array.isArray(json) && json.length > 0) {
          console.log('\n--- First Item Sample ---');
          console.log(JSON.stringify(json[0], null, 2));
        } else if (json.items && json.items.length > 0) {
          console.log('\n--- First Item Sample ---');
          console.log(JSON.stringify(json.items[0], null, 2));
        }
      }
    } catch (e) {
      console.error(`Error for ${url}:`, e.message);
    }
  }
}

testCookieApi().catch(console.error);
