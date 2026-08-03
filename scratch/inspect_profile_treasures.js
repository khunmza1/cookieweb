const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

console.log('Total Treasures in Catalog:', catalog.treasures.length);

const localImages = catalog.treasures.filter(t => t.imageUrl && t.imageUrl.startsWith('/images/'));
const remoteImages = catalog.treasures.filter(t => t.imageUrl && t.imageUrl.startsWith('http'));
const missingImages = catalog.treasures.filter(t => !t.imageUrl);

console.log('Treasures with Local /images/... paths:', localImages.length);
console.log('Treasures with Remote http... paths:', remoteImages.length);
console.log('Treasures missing image paths:', missingImages.length);

// Print a sample list of newly updated local image treasures
console.log('\n--- Sample Local Image Treasures ---');
localImages.slice(0, 10).forEach(t => {
  console.log(`${t.name} (${t.id}) -> ${t.imageUrl}`);
});
