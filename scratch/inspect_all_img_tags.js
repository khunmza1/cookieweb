const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

const imgMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g)];
console.log(`Found ${imgMatches.length} <img> tags with alt text.`);

imgMatches.slice(0, 15).forEach(m => {
  console.log(`Alt: "${m[2]}" -> Src: "${m[1]}"`);
});
