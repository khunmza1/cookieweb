const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

function decodeEntities(str) {
  if (!str) return '';
  return str.replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
}

catalog.cookies.forEach(c => {
  c.description = decodeEntities(c.description);
  c.skill = decodeEntities(c.skill);
  c.unlockedBy = decodeEntities(c.unlockedBy);
  c.combiBonus = decodeEntities(c.combiBonus);
  c.story = decodeEntities(c.story);
});

fs.writeFileSync('data/classic-catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
console.log('Cleaned HTML entities in catalog cookies!');
