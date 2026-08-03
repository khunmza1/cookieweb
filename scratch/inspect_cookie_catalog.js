const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

console.log('Total Cookies in Catalog:', catalog.cookies.length);
console.log('\n--- Sample Updated Cookies ---');

catalog.cookies.slice(0, 8).forEach(c => {
  console.log(`\nName: ${c.name} (${c.id})`);
  console.log(`HP: ${c.hp}`);
  console.log(`Image: ${c.imageUrl}`);
  console.log(`Skill:\n${c.skill}`);
});
