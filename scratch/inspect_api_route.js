async function testApiEndpoints() {
  const testUrls = [
    'https://www.cookierunhub.com/api/combinations?page=1',
    'https://www.cookierunhub.com/api/combinations?page=2',
    'https://www.cookierunhub.com/api/episodes?page=1',
    'https://www.cookierunhub.com/api/episodes?page=2',
    'https://www.cookierunhub.com/api/v1/combinations?page=1'
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log('Sample JSON:', Object.keys(json));
      }
    } catch (e) {
      console.error(`Error for ${url}:`, e.message);
    }
  }
}

testApiEndpoints().catch(console.error);
