const fs = require('fs');

const text = fs.readFileSync('scratch/next_f_decoded.txt', 'utf8');

console.log('Searching for combo list array or objects...');

// Search for combo items with scores, cookies, treasures, boosts, power_plus
const regex = /\{"id":(\d+),"score":[\s\S]*?\}/g;
let match;
let count = 0;
while ((match = regex.exec(text)) !== null && count < 5) {
  console.log(`\n--- Combo Object #${count + 1} ---`);
  console.log(match[0].slice(0, 1500));
  count++;
}

// Search for any keys matching "boost", "power", "relay", "cookie", "pet", "treasure"
const boostMatch = text.match(/"boosts?":[\s\S]*?\}/g);
if (boostMatch) {
  console.log('\n--- Sample Boost Match ---');
  console.log(boostMatch[0].slice(0, 500));
}

const powerMatch = text.match(/"power_?plus":[\s\S]*?\}/g);
if (powerMatch) {
  console.log('\n--- Sample Power+ Match ---');
  console.log(powerMatch[0].slice(0, 500));
}
