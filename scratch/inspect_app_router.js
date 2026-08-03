const fs = require('fs');

async function inspectAppRouter() {
  const url = 'https://www.cookierunhub.com/en/episodes?episode=ep1&page=1';
  const res = await fetch(url);
  const html = await res.text();

  console.log('HTML length:', html.length);

  // Search for links to detail pages
  const links = [...html.matchAll(/href="(\/en\/[^\"]+)"/g)].map(m => m[1]);
  console.log('Sample links found:', links.slice(0, 20));

  // Search for self.__next_f pushes
  const nextFMatches = [...html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g)];
  console.log('Found self.__next_f pushes:', nextFMatches.length);

  fs.writeFileSync('scratch/full_page.html', html);
}

inspectAppRouter().catch(console.error);
