const fs = require('fs');

const payload = fs.readFileSync('scratch/detail_payload_sample.txt', 'utf8');

// Search for any JSON object containing combination detail properties
const comboMatches = payload.match(/\{"id":1114,[\s\S]*?\}/g) || [];
if (comboMatches.length > 0) {
  console.log('Found Combo Detail JSON Object:');
  console.log(comboMatches[0]);
} else {
  console.log('Searching for any object with score_detail...');
  const scoreMatches = payload.match(/\{[\s\S]*?"score_detail"[\s\S]*?\}/g) || [];
  if (scoreMatches.length > 0) {
    console.log(scoreMatches[0]);
  } else {
    console.log('Snippet of detail payload:');
    console.log(payload.slice(0, 3000));
  }
}
