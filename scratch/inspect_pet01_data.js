const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

const chocodrop = catalog.pets.find(p => p.id === 'choco-drop' || p.code === 'pet01');

console.log('--- Choco Drop Pet Wiki Data ---');
console.log(JSON.stringify(chocodrop, null, 2));
