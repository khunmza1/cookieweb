const fs = require('fs');
const path = require('path');

const CONCURRENCY = 5;

// Load existing catalog to resolve item IDs
const catalogPath = path.join(__dirname, '../data/classic-catalog.json');
let catalog = { cookies: [], pets: [], treasures: [] };
if (fs.existsSync(catalogPath)) {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveCookieId(item) {
  if (!item) return undefined;
  if (item.english_name) {
    const slug = slugify(item.english_name);
    const found = catalog.cookies.find(c => c.id === slug || slugify(c.name) === slug);
    if (found) return found.id;
  }
  if (item.name) {
    const found = catalog.cookies.find(c => c.name === item.name);
    if (found) return found.id;
  }
  return slugify(item.english_name || item.name || `cookie-${item.id}`);
}

function resolvePetId(item) {
  if (!item) return undefined;
  if (item.english_name) {
    const slug = slugify(item.english_name);
    const found = catalog.pets.find(p => p.id === slug || slugify(p.name) === slug);
    if (found) return found.id;
  }
  if (item.name) {
    const found = catalog.pets.find(p => p.name === item.name);
    if (found) return found.id;
  }
  return slugify(item.english_name || item.name || `pet-${item.id}`);
}

function resolveTreasureId(treasureObj) {
  if (!treasureObj) return undefined;
  const t = treasureObj.treasure || treasureObj;
  if (t.english_name) {
    const slug = slugify(t.english_name);
    const found = catalog.treasures.find(tr => tr.id === slug || slugify(tr.name) === slug);
    if (found) return found.id;
  }
  if (t.name) {
    const found = catalog.treasures.find(tr => tr.name === t.name);
    if (found) return found.id;
  }
  return slugify(t.english_name || t.name || `treasure-${t.id}`);
}

const EPISODE_MAP = {
  ep1: 'EP 1 (Oven Escape)',
  ep2: 'EP 2 (Primeval Jungle)',
  ep3: "EP 3 (Dragon's Valley)",
  ep4: 'EP 4 (City of Wizards)',
  ep5: 'EP 5 (Dessert Paradise)',
  ep6: 'EP 6 (Tower of Frozen Waves)',
  ep7: 'EP 7 (Desert Paradise)',
  special1: 'Special 1 (Frozen Waves)',
  special2: 'Special 2 (Island of Memories)',
  special3: 'Special 3'
};

const PURPOSE_MAP = {
  score: 'Score Meta',
  coin: 'Coin Farming',
  sonkro: 'AFK Auto-Run (손크로)',
  junsonkro: 'Semi-AFK (준손크로)',
  exp: 'XP Farming',
  mystery_box: 'Mystery Box Farming'
};

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

async function processBatch(comboIds) {
  const results = [];
  for (let i = 0; i < comboIds.length; i += CONCURRENCY) {
    const chunk = comboIds.slice(i, i + CONCURRENCY);
    const promises = chunk.map(id => fetchComboDetail(id));
    const details = await Promise.all(promises);
    details.forEach(d => {
      if (d) results.push(d);
    });
  }
  return results;
}

async function crawlSequentialPages() {
  console.log('🚀 Crawling CookieRunHub pages sequentially and populating database...');

  const allParsedCombos = [];
  const processedIds = new Set();
  const outputPath = path.join(__dirname, '../data/combos.json');

  let page = 1;
  const MAX_PAGES = 50; // Extract top 1,000 builds

  while (page <= MAX_PAGES) {
    const pageUrl = `https://www.cookierunhub.com/en/episodes?page=${page}`;
    console.log(`Fetching page ${page}/${MAX_PAGES}...`);

    try {
      const res = await fetch(pageUrl);
      if (!res.ok) break;
      const html = await res.text();

      const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
      let payload = '';
      matches.forEach(m => {
        payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      });

      // Extract combo IDs from page payload
      const regex = /"id":(\d+),"episode":"([^"]+)"/g;
      const comboMatches = [...payload.matchAll(regex)];
      const uniqueIds = [...new Set(comboMatches.map(m => Number(m[1])))].filter(id => !processedIds.has(id));

      if (uniqueIds.length === 0) {
        console.log(`No new combo IDs found on page ${page}. Finished.`);
        break;
      }

      uniqueIds.forEach(id => processedIds.add(id));
      console.log(`Found ${uniqueIds.length} new combos on page ${page}. Extracting details...`);
      const details = await processBatch(uniqueIds);

      for (const raw of details) {
        const mainCookieId = resolveCookieId(raw.first_cookie);
        const relayCookieId = resolveCookieId(raw.second_cookie);
        const petId = resolvePetId(raw.pet);

        const treasureIds = (raw.treasures || [])
          .map(resolveTreasureId)
          .filter(Boolean);

        if (!mainCookieId || !petId) continue;

        const epStr = raw.episode || 'ep1';
        const epLabel = EPISODE_MAP[epStr] || 'EP 1 (Oven Escape)';

        const title = `${raw.first_cookie?.english_name || raw.first_cookie?.name || 'Cookie'} + ${raw.second_cookie ? (raw.second_cookie.english_name || raw.second_cookie.name) : 'No Relay'} (${epLabel})`;

        const formattedCombo = {
          id: `hub-${raw.id}`,
          title,
          author: raw.author?.nickname || 'CookieRunHub Runner',
          episode: epLabel,
          category: PURPOSE_MAP[raw.purpose] || 'Score Meta',
          cookieId: mainCookieId,
          relayCookieId,
          petId,
          treasureIds,
          targetScore: raw.score_detail?.score || 0,
          coinsPerRun: raw.coin_detail?.coins || (raw.purpose === 'coin' ? 45000 : undefined),
          description: (raw.score_detail?.description || raw.purpose || 'CookieRunHub community build')
            .replace(/<[^>]+>/g, ' ')
            .trim(),
          tags: [PURPOSE_MAP[raw.purpose] || 'Score Meta', epLabel],
          videoUrl: raw.link_url || undefined,
          boosts: {
            hasAll: raw.has_all_boosts || false,
            health: raw.boost_health || false,
            itemTime: raw.boost_item_time || false,
            fastStart: raw.boost_fast_start || false,
            draw: raw.boost_draw || false
          },
          powerPlusEffects: {
            hasAll: raw.has_all_effects || false,
            cheerleader: raw.effect_cheerleader || false,
            commando: raw.effect_commando || false,
            fairy: raw.effect_fairy || false,
            cheesecake: raw.effect_cheesecake || false,
            seaFairy: raw.effect_sea_fairy || false,
            serenade: raw.effect_serenade || false,
            expParty: raw.effect_exp_party || false
          },
          createdAt: raw.created_at || new Date().toISOString(),
          upvotes: raw.like_count || 10,
          isBoosted: (raw.like_count || 0) >= 5
        };

        allParsedCombos.push(formattedCombo);
      }

      // Periodically write to file so progress is saved live
      fs.writeFileSync(outputPath, JSON.stringify(allParsedCombos, null, 2), 'utf8');
      console.log(`Saved ${allParsedCombos.length} combos to ${outputPath}`);

      page++;
    } catch (e) {
      console.error(`Error on page ${page}:`, e.message);
      break;
    }
  }

  console.log(`\n🎉 CRAWL COMPLETE! Saved ${allParsedCombos.length} total combos.`);
}

crawlSequentialPages().catch(console.error);
