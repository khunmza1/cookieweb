const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

console.log('HTML length:', html.length);

// Extract next_f payloads or item cards from HTML
const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
let fullPayload = '';
matches.forEach(m => {
  try {
    fullPayload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  } catch (e) {}
});

fs.writeFileSync('scratch/encyclopedia_payload.txt', fullPayload);
console.log('Decoded encyclopedia payload length:', fullPayload.length);

// Search for items in payload
const itemMatches = [...fullPayload.matchAll(/"name":"([^"]+)","english_name":"([^"]+)"/g)];
console.log('Sample item matches found:', itemMatches.slice(0, 10).map(m => `${m[1]} -> ${m[2]}`));
