const fs = require('fs');

const payload = fs.readFileSync('scratch/detail_payload_sample.txt', 'utf8');

const idx = payload.indexOf('"initialData":{');
if (idx !== -1) {
  const start = idx + '"initialData":'.length;
  // find balanced json object
  let depth = 0;
  let end = -1;
  for (let i = start; i < payload.length; i++) {
    if (payload[i] === '{') depth++;
    else if (payload[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end !== -1) {
    const jsonStr = payload.slice(start, end);
    try {
      const data = JSON.parse(jsonStr);
      fs.writeFileSync('scratch/combo_detail_parsed.json', JSON.stringify(data, null, 2));
      console.log('Successfully saved scratch/combo_detail_parsed.json!');
      console.log('Top keys:', Object.keys(data));
    } catch (e) {
      console.error('Failed to parse:', e.message);
    }
  }
}
