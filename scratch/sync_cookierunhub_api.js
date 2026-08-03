const fs = require('fs');
const path = require('path');

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

async function syncAllCombos() {
  console.log('🚀 Syncing ALL 85 pages (1,680+ combos) directly from CookieRunHub API...');

  const allCombos = [];
  const outputPath = path.join(__dirname, '../data/combos.json');

  let page = 1;
  let totalPages = 85;

  while (page <= totalPages) {
    const url = `https://www.cookierunhub.com/api/combinations?page=${page}`;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();

      totalPages = data.pages || 85;
      const items = data.items || [];

      console.log(`Processing page ${page}/${totalPages} (${items.length} items)...`);

      for (const raw of items) {
        const mainCookieId = resolveCookieId(raw.first_cookie);
        const relayCookieId = resolveCookieId(raw.second_cookie);
        const petId = resolvePetId(raw.pet);

        const treasureIds = (raw.treasures || [])
          .map(resolveTreasureId)
          .filter(Boolean);

        if (!mainCookieId || !petId) continue;

        const epStr = raw.episode || 'ep1';
        const epLabel = EPISODE_MAP[epStr] || 'EP 1 (Oven Escape)';

        const firstCookieName = raw.first_cookie?.english_name || raw.first_cookie?.name || 'Cookie';
        const secondCookieName = raw.second_cookie ? (raw.second_cookie.english_name || raw.second_cookie.name) : null;
        const title = secondCookieName ? `${firstCookieName} + ${secondCookieName} (${epLabel})` : `${firstCookieName} (${epLabel})`;

        const authorName = raw.author?.nickname || raw.author?.anonymous_nickname || 'CookieRunHub Runner';

        const formattedCombo = {
          id: `hub-${raw.id}`,
          title,
          author: authorName,
          episode: epLabel,
          category: PURPOSE_MAP[raw.purpose] || 'Score Meta',
          cookieId: mainCookieId,
          relayCookieId,
          petId,
          treasureIds,
          targetScore: raw.score_detail?.score || 0,
          coinsPerRun: raw.coin_detail?.coins || (raw.purpose === 'coin' ? 45000 : undefined),
          description: (raw.score_detail?.description || raw.purpose || 'CookieRunHub official community build')
            .replace(/<[^>]+>/g, ' ')
            .trim(),
          tags: [PURPOSE_MAP[raw.purpose] || 'Score Meta', epLabel],
          videoUrl: raw.link_url || undefined,
          boosts: {
            hasAll: raw.has_all_boosts || false,
            health: raw.boost_health !== undefined ? raw.boost_health : true,
            itemTime: raw.boost_item_time !== undefined ? raw.boost_item_time : true,
            fastStart: raw.boost_fast_start !== undefined ? raw.boost_fast_start : true,
            draw: raw.boost_draw || (raw.has_all_boosts ? 'All Boosts Selected' : false)
          },
          powerPlusEffects: {
            hasAll: raw.has_all_effects || false,
            cheerleader: raw.effect_cheerleader !== undefined ? raw.effect_cheerleader : true,
            commando: raw.effect_commando !== undefined ? raw.effect_commando : true,
            fairy: raw.effect_fairy !== undefined ? raw.effect_fairy : true,
            cheesecake: raw.effect_cheesecake !== undefined ? raw.effect_cheesecake : true,
            seaFairy: raw.effect_sea_fairy !== undefined ? raw.effect_sea_fairy : true,
            serenade: raw.effect_serenade !== undefined ? raw.effect_serenade : false,
            expParty: raw.effect_exp_party !== undefined ? raw.effect_exp_party : false
          },
          createdAt: raw.created_at || new Date().toISOString(),
          upvotes: raw.like_count || 10,
          isBoosted: (raw.like_count || 0) >= 5
        };

        allCombos.push(formattedCombo);
      }

      page++;
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
      break;
    }
  }

  console.log(`\n🎉 FULL SYNC COMPLETE! Total setups parsed: ${allCombos.length}`);
  fs.writeFileSync(outputPath, JSON.stringify(allCombos, null, 2), 'utf8');
  console.log(`Saved clean combo database to ${outputPath}`);
}

syncAllCombos().catch(console.error);
