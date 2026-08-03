const fs = require('fs');

const EPISODES = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', 'special1', 'special2', 'special3'];

function extractCombosFromPayload(payload) {
  const combos = [];
  
  // Look for initialData or items array in payload
  const match = payload.match(/"initialData":(\{[\s\S]*?\}),"translation_status"/);
  if (match) {
    try {
      return [JSON.parse(match[1])];
    } catch (e) {}
  }

  // Look for items array in list page payload
  const listMatches = [...payload.matchAll(/\{"id":(\d+),"episode":"(ep\d+|special\d+)",[\s\S]*?\}/g)];
  for (const m of listMatches) {
    try {
      const combo = JSON.parse(m[0]);
      combos.push(combo);
    } catch (e) {}
  }

  return combos;
}

async function fetchComboDetail(comboId) {
  const url = `https://www.cookierunhub.com/en/episodes/${comboId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();

    const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    let payload = '';
    matches.forEach(m => {
      payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    });

    const idx = payload.indexOf('"initialData":{');
    if (idx !== -1) {
      const start = idx + '"initialData":'.length;
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
        return JSON.parse(payload.slice(start, end));
      }
    }
  } catch (e) {
    console.error(`Error fetching detail for combo ${comboId}:`, e.message);
  }
  return null;
}

async function testCrawler() {
  console.log('Testing crawler on Episode 1 Page 1...');
  const url = 'https://www.cookierunhub.com/en/episodes?episode=ep1&page=1';
  const res = await fetch(url);
  const html = await res.text();

  const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
  let payload = '';
  matches.forEach(m => {
    payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  });

  // Extract combo IDs from page payload
  const comboIds = [...payload.matchAll(/"id":(\d+),"episode":"ep1"/g)].map(m => Number(m[1]));
  const uniqueIds = [...new Set(comboIds)];
  console.log(`Found ${uniqueIds.length} combos on ep1 page 1:`, uniqueIds);

  if (uniqueIds.length > 0) {
    console.log('Fetching full detail for first combo ID:', uniqueIds[0]);
    const detail = await fetchComboDetail(uniqueIds[0]);
    console.log('Successfully fetched detail!');
    console.log('Combo Title/Purpose:', detail.purpose, 'Score:', detail.score_detail?.score);
    console.log('Boosts:', {
      has_all: detail.has_all_boosts,
      health: detail.boost_health,
      fast_start: detail.boost_fast_start,
      draw: detail.boost_draw
    });
    console.log('Power+ Effects:', {
      has_all: detail.has_all_effects,
      cheerleader: detail.effect_cheerleader,
      commando: detail.effect_commando,
      fairy: detail.effect_fairy,
      cheesecake: detail.effect_cheesecake,
      sea_fairy: detail.effect_sea_fairy
    });
  }
}

testCrawler().catch(console.error);
