const fs = require('fs');
const path = require('path');

async function checkJsChunks() {
  const html = fs.readFileSync('scratch/full_page.html', 'utf8');
  const scriptSrcs = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^\"]+)"/g)].map(m => m[1]);

  console.log('Found script chunks:', scriptSrcs.length);

  for (const src of scriptSrcs) {
    const jsUrl = `https://www.cookierunhub.com${src}`;
    try {
      const res = await fetch(jsUrl);
      const jsText = await res.text();

      // Search for API endpoints
      const apiMatches = [...jsText.matchAll(/[\"'](\/api\/[^\"]+)[\"']/g)].map(m => m[1]);
      if (apiMatches.length > 0) {
        console.log(`\nFound API endpoints in ${src}:`, [...new Set(apiMatches)]);
      }

      // Search for episode query params
      const epParamMatches = [...jsText.matchAll(/episode[s]?=([^\&\"\'\s]+)/gi)].map(m => m[0]);
      if (epParamMatches.length > 0) {
        console.log(`Found episode query params in ${src}:`, [...new Set(epParamMatches)]);
      }
    } catch (e) {}
  }
}

checkJsChunks().catch(console.error);
