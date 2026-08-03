const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

const srcMatches = [...html.matchAll(/src="([^"]+\.(?:webp|png|jpg|jpeg|gif|svg))"/g)];
const uniqueSrcs = [...new Set(srcMatches.map(m => m[1]))];

console.log(`Found ${uniqueSrcs.length} total unique image src paths.`);
console.log('Sample srcs:');
uniqueSrcs.slice(0, 30).forEach(s => console.log(s));
