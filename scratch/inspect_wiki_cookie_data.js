const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/classic-catalog.json', 'utf8'));

const gingerbrave = catalog.cookies.find(c => c.id === 'gingerbrave');

console.log('--- GingerBrave Wiki Data ---');
console.log(JSON.stringify(gingerbrave, null, 2));
