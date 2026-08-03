const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

// Find all HTML text nodes or divs containing skill text or images
// Look for <img> tags with alt or src containing cookies
const imgMatches = [...html.matchAll(/<img[^>]*src="([^"]*cookies\/[^"]*)"[^>]*>/g)];
console.log(`Found ${imgMatches.length} <img> tags in HTML matching cookies/`);

imgMatches.slice(0, 10).forEach(m => {
  console.log('Img src:', m[1]);
});
