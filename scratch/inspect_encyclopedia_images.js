const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');
const filesDir = path.join(__dirname, '../Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB_files');

const publicTreasuresDir = path.join(__dirname, '../public/images/treasures');
const publicCookiesDir = path.join(__dirname, '../public/images/cookies');
const publicPetsDir = path.join(__dirname, '../public/images/pets');

[publicTreasuresDir, publicCookiesDir, publicPetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Extract JSON objects from payload
const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
let fullPayload = '';
matches.forEach(m => {
  try {
    fullPayload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  } catch (e) {}
});

// Also parse HTML DOM tags in file
const imgTagMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
const srcMap = new Map();
imgTagMatches.forEach(m => {
  const src = m[1];
  const filename = path.basename(src);
  srcMap.set(filename, src);
});

console.log(`Found ${srcMap.size} image files referenced in HTML tags.`);
