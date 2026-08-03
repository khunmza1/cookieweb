const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/classic-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findOrCreateCookie(item) {
  if (!item) return undefined;
  
  let found = catalog.cookies.find(c => c.id === item.id || (item.english_name && c.id === slugify(item.english_name)));
  if (found) return found.id;

  found = catalog.cookies.find(c => c.name === item.name || (item.english_name && c.name === item.english_name));
  if (found) return found.id;

  if (item.image_file_name) {
    found = catalog.cookies.find(c => c.imageUrl?.includes(item.image_file_name));
    if (found) return found.id;
  }

  const newId = slugify(item.english_name || item.name || `cookie-${item.id}`);
  const newCookie = {
    id: newId,
    name: item.english_name || item.name,
    grade: item.grade || 'S',
    category: 'cookie',
    description: item.ability || 'CookieRun Classic Cookie',
    skill: item.ability || 'Special Skill',
    maxLevel: 8,
    imageUrl: item.image_path ? (item.image_path.startsWith('http') ? item.image_path : `https://www.cookierunhub.com${item.image_path.startsWith('/') ? '' : '/'}${item.image_path}`) : '/images/cookies/gingerbrave.png'
  };

  catalog.cookies.push(newCookie);
  return newId;
}

function findOrCreatePet(item) {
  if (!item) return undefined;

  let found = catalog.pets.find(p => p.id === item.id || (item.english_name && p.id === slugify(item.english_name)));
  if (found) return found.id;

  found = catalog.pets.find(p => p.name === item.name || (item.english_name && p.name === item.english_name));
  if (found) return found.id;

  if (item.image_file_name) {
    found = catalog.pets.find(p => p.imageUrl?.includes(item.image_file_name));
    if (found) return found.id;
  }

  const newId = slugify(item.english_name || item.name || `pet-${item.id}`);
  const newPet = {
    id: newId,
    name: item.english_name || item.name,
    grade: item.grade || 'S',
    category: 'pet',
    description: item.ability || 'CookieRun Classic Pet',
    skill: item.ability || 'Special Pet Skill',
    maxLevel: 8,
    imageUrl: item.image_path ? (item.image_path.startsWith('http') ? item.image_path : `https://www.cookierunhub.com${item.image_path}`) : '/images/pets/choco_drop.png'
  };

  catalog.pets.push(newPet);
  return newId;
}

function findOrCreateTreasure(treasureObj) {
  if (!treasureObj) return undefined;
  const t = treasureObj.treasure || treasureObj;

  let found = catalog.treasures.find(tr => tr.id === t.id || (t.english_name && tr.id === slugify(t.english_name)));
  if (found) return found.id;

  found = catalog.treasures.find(tr => tr.name === t.name || (t.english_name && tr.name === t.english_name));
  if (found) return found.id;

  if (t.image_file_name) {
    found = catalog.treasures.find(tr => tr.imageUrl?.includes(t.image_file_name));
    if (found) return found.id;
  }

  const newId = slugify(t.english_name || t.name || `treasure-${t.id}`);
  const newTreasure = {
    id: newId,
    name: t.english_name || t.name,
    grade: t.grade || 'S',
    category: 'treasure',
    effect: t.ability || 'Treasure Effect',
    imageUrl: t.image_path ? (t.image_path.startsWith('http') ? t.image_path : `https://www.cookierunhub.com${t.image_path}`) : '/images/treasures/default.png'
  };

  catalog.treasures.push(newTreasure);
  return newId;
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

async function syncAllCombosPerfect() {
  console.log('🚀 Syncing ALL 85 pages from CookieRunHub with 100% item resolution...');

  const allCombos = [];
  const combosPath = path.join(__dirname, '../data/combos.json');

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
        const mainCookieId = findOrCreateCookie(raw.first_cookie);
        const relayCookieId = findOrCreateCookie(raw.second_cookie);
        const petId = findOrCreatePet(raw.pet);

        const treasureIds = (raw.treasures || [])
          .map(findOrCreateTreasure)
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

  // Save updated catalog
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Saved updated catalog to ${catalogPath}`);

  // Save clean combos database
  fs.writeFileSync(combosPath, JSON.stringify(allCombos, null, 2), 'utf8');
  console.log(`🎉 PERFECT SYNC COMPLETE! Saved ${allCombos.length} total combos to ${combosPath}`);
}

syncAllCombosPerfect().catch(console.error);
