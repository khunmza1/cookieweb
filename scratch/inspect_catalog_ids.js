const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));
const combos = JSON.parse(fs.readFileSync('data/combos.json', 'utf8'));

console.log('Catalog Cookies count:', catalog.cookies.length);
console.log('Catalog Pets count:', catalog.pets.length);
console.log('Catalog Treasures count:', catalog.treasures.length);

const catalogCookieIds = new Set(catalog.cookies.map(c => c.id));
const catalogPetIds = new Set(catalog.pets.map(p => p.id));
const catalogTreasureIds = new Set(catalog.treasures.map(t => t.id));

const unmappedCookies = new Set();
const unmappedPets = new Set();
const unmappedTreasures = new Set();

combos.forEach(c => {
  if (!catalogCookieIds.has(c.cookieId)) unmappedCookies.add(c.cookieId);
  if (c.relayCookieId && !catalogCookieIds.has(c.relayCookieId)) unmappedCookies.add(c.relayCookieId);
  if (!catalogPetIds.has(c.petId)) unmappedPets.add(c.petId);
  c.treasureIds.forEach(t => {
    if (!catalogTreasureIds.has(t)) unmappedTreasures.add(t);
  });
});

console.log('\nUnmapped Cookie IDs in combos:', [...unmappedCookies]);
console.log('Unmapped Pet IDs in combos:', [...unmappedPets]);
console.log('Unmapped Treasure IDs count:', unmappedTreasures.size);
