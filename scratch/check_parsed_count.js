const fs = require('fs');

if (fs.existsSync('data/combos.json')) {
  const data = JSON.parse(fs.readFileSync('data/combos.json', 'utf8'));
  console.log('Current combos saved in data/combos.json:', data.length);
  if (data.length > 0) {
    console.log('Sample combo:', JSON.stringify(data[0], null, 2));
  }
} else {
  console.log('data/combos.json does not exist yet');
}
