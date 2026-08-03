const fs = require('fs');

const text = fs.readFileSync('scratch/next_f_decoded.txt', 'utf8');

// Find all occurrences of "767,000,000" or "767000000" (the score we saw on page 1)
const scorePos = text.indexOf('767');
console.log('Score pos:', scorePos);

if (scorePos !== -1) {
  console.log('Snippet around 767:');
  console.log(text.slice(Math.max(0, scorePos - 500), Math.min(text.length, scorePos + 1000)));
}
