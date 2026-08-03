const fs = require('fs');

async function checkDetail() {
  const comboId = 1114;
  const url = `https://www.cookierunhub.com/en/episodes/${comboId}`;
  console.log('Fetching combo detail:', url);

  const res = await fetch(url);
  const html = await res.text();

  console.log('Detail HTML status:', res.status, 'length:', html.length);

  // Extract self.__next_f pushes
  const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
  let fullPayload = '';
  matches.forEach(m => {
    try {
      fullPayload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } catch (e) {}
  });

  fs.writeFileSync('scratch/detail_payload_sample.txt', fullPayload);
  console.log('Decoded detail payload length:', fullPayload.length);

  // Look for boost list or power plus list in detail payload
  const boostMatches = fullPayload.match(/"boosts?":[\s\S]*?\]/g) || [];
  console.log('Boost matches in detail:', boostMatches);

  const effectMatches = fullPayload.match(/"effects?":[\s\S]*?\]/g) || [];
  console.log('Effect matches in detail:', effectMatches);

  const powerMatches = fullPayload.match(/"power_?plus":[\s\S]*?\]/g) || [];
  console.log('Power+ matches in detail:', powerMatches);
}

checkDetail().catch(console.error);
