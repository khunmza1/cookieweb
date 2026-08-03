const fs = require('fs');

async function findEpChunks() {
  const html = fs.readFileSync('scratch/full_page.html', 'utf8');
  const scriptSrcs = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^\"]+)"/g)].map(m => m[1]);

  for (const src of scriptSrcs) {
    const jsUrl = `https://www.cookierunhub.com${src}`;
    try {
      const res = await fetch(jsUrl);
      const jsText = await res.text();

      if (jsText.includes('EP 1') || jsText.includes('EP 2') || jsText.includes('EP 3')) {
        console.log(`Found EP labels in chunk: ${src}`);
        const pos = jsText.indexOf('EP 1');
        console.log(jsText.slice(Math.max(0, pos - 200), Math.min(jsText.length, pos + 400)));
      }
    } catch (e) {}
  }
}

findEpChunks().catch(console.error);
