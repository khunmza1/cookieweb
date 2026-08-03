const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

const remotes = catalog.treasures.filter(t => t.imageUrl && t.imageUrl.startsWith('http'));
console.log('2 Remote treasures found:', remotes);

remotes.forEach(t => {
  if (t.imageUrl.includes('shining_crown')) {
    t.imageUrl = '/images/treasures/shining-crown-for-champion.webp';
  } else if (t.imageUrl.includes('frozen_orange')) {
    t.imageUrl = '/images/treasures/frozen-orange-drink.webp';
  } else {
    t.imageUrl = '/images/treasures/default.png';
  }
});

fs.writeFileSync('data/classic-catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
console.log('Fixed remaining remote treasures to local image paths!');
