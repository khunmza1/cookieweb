const fs = require('fs');

const html = fs.readFileSync('scratch/full_page.html', 'utf8');

const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];

let fullPayload = '';
matches.forEach(m => {
  try {
    const unescaped = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    fullPayload += unescaped;
  } catch (e) {}
});

fs.writeFileSync('scratch/next_f_decoded.txt', fullPayload);

console.log('Decoded payload length:', fullPayload.length);

// Check if combo IDs or detail paths appear in the decoded payload
const comboIdMatches = [...fullPayload.matchAll(/\/episodes\/(\d+)/g)].map(m => m[1]);
console.log('Unique Combo Detail IDs found:', [...new Set(comboIdMatches)]);

// Check for JSON structures containing combo titles, cookies, scores
const sampleSnippets = fullPayload.match(/\{"id":\d+,[\s\S]*?\}/g) || [];
console.log('Sample JSON objects found:', sampleSnippets.slice(0, 3));
