const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

function fixUrl(url) {
  if (!url) return '/images/treasures/default.png';
  let clean = url.replace('https://www.cookierunhub.comtreasures', 'https://www.cookierunhub.com/treasures')
                 .replace('https://www.cookierunhub.comcookies', 'https://www.cookierunhub.com/cookies')
                 .replace('https://www.cookierunhub.compets', 'https://www.cookierunhub.com/pets');
  return clean;
}

let fixedCount = 0;

catalog.cookies.forEach(c => {
  const orig = c.imageUrl;
  c.imageUrl = fixUrl(c.imageUrl);
  if (c.imageUrl !== orig) fixedCount++;
});

catalog.pets.forEach(p => {
  const orig = p.imageUrl;
  p.imageUrl = fixUrl(p.imageUrl);
  if (p.imageUrl !== orig) fixedCount++;
});

catalog.treasures.forEach(t => {
  const orig = t.imageUrl;
  t.imageUrl = fixUrl(t.imageUrl);
  if (t.imageUrl !== orig) fixedCount++;
});

fs.writeFileSync('data/classic-catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Successfully fixed ${fixedCount} malformed image URLs in data/classic-catalog.json!`);
