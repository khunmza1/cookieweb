const fs = require('fs');

async function findEpisodes() {
  // Let's fetch pages 1 through 20 of main episodes and collect all unique "episode" values
  const uniqueEpValues = new Set();
  
  for (let page = 1; page <= 10; page++) {
    const url = `https://www.cookierunhub.com/en/episodes?page=${page}`;
    const res = await fetch(url);
    const html = await res.text();

    const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    let payload = '';
    matches.forEach(m => {
      payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    });

    const epMatches = [...payload.matchAll(/"episode":"([^"]+)"/g)].map(m => m[1]);
    epMatches.forEach(ep => uniqueEpValues.add(ep));
  }

  console.log('Unique Episode values found in payload:', [...uniqueEpValues]);
}

findEpisodes().catch(console.error);
