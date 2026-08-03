const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
let fullPayload = '';
matches.forEach(m => {
  try {
    fullPayload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  } catch (e) {}
});

// Search for cookie objects in payload
const cookieObjMatches = [...fullPayload.matchAll(/\{"id":(\d+),"name":"([^"]+)","english_name":"([^"]+)",[\s\S]*?"ability":"([^"]*)"/g)];

console.log(`Found ${cookieObjMatches.length} raw cookie definitions in HTML payload.`);

const sampleCookies = [];
cookieObjMatches.forEach(m => {
  sampleCookies.push({
    id: m[1],
    name: m[2],
    english_name: m[3],
    ability: m[4].replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
  });
});

console.log('\n--- Sample Cookie Ability & HP Data ---');
sampleCookies.slice(0, 5).forEach(c => {
  console.log(`\nCookie: ${c.name} (${c.english_name})`);
  console.log(`Ability Text:\n${c.ability}`);
});
