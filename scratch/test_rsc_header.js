async function testRscHeader() {
  const episodes = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', 'special1', 'special2'];

  for (const ep of episodes) {
    const url = `https://www.cookierunhub.com/en/episodes?episode=${ep}&page=1`;
    const res = await fetch(url, {
      headers: {
        'RSC': '1',
        'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(main)%22%2C%7B%22children%22%3A%5B%22(app)%22%2C%7B%22children%22%3A%5B%22episodes%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D%7D%5D',
        'Next-Url': `/en/episodes?episode=${ep}`
      }
    });

    const text = await res.text();

    const matches = [...text.matchAll(/"id":(\d+),"episode":"([^"]+)"/g)];
    const epFound = [...new Set(matches.map(m => m[2]))];
    console.log(`Episode=${ep} with RSC header: ${matches.length} combos found. Episode tags in payload:`, epFound);
  }
}

testRscHeader().catch(console.error);
