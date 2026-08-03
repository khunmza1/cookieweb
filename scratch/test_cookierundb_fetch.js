async function testFetchCookieCh01() {
  const url = 'https://cookierundb.com/cookies/ch01';
  try {
    const res = await fetch(url);
    console.log(`Fetch ${url} status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      console.log('HTML length:', html.length);
      console.log('Sample snippet:', html.slice(0, 1000));
    }
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

testFetchCookieCh01().catch(console.error);
