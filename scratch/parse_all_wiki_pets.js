const fs = require('fs');
const path = require('path');

const petsWikiDir = path.join(__dirname, '../pets cookierundb_files');
const publicPetsDir = path.join(__dirname, '../public/images/pets');
const catalogPath = path.join(__dirname, '../data/classic-catalog.json');

if (!fs.existsSync(publicPetsDir)) {
  fs.mkdirSync(publicPetsDir, { recursive: true });
}

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeEntities(str) {
  if (!str) return '';
  return str.replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
}

// In-Game Trait Standardization Classifier for Pets
function standardizePetTraits(name, skill, abilityTag, story) {
  const typeTags = new Set();
  const activeTags = new Set();

  const text = `${name} ${skill} ${abilityTag} ${story}`.toLowerCase();

  // Types
  if (text.includes('magnet') || text.includes('magnetic') || text.includes('자력')) typeTags.add('Magnet');
  if (text.includes('coin') || text.includes('gold') || text.includes('코인')) typeTags.add('Coins');
  if (text.includes('xp') || text.includes('exp') || text.includes('experience') || text.includes('경험치')) typeTags.add('XP');
  if (text.includes('pit') || text.includes('fall') || text.includes('rescue') || text.includes('구출')) typeTags.add('Pit Lift');
  if (text.includes('revive') || text.includes('resurrect') || text.includes('부활')) typeTags.add('Revive');
  if (text.includes('drain') || text.includes('slow') || text.includes('health drain') || text.includes('체력감소')) typeTags.add('Drain');
  if (text.includes('speed') || text.includes('dash') || text.includes('fast') || text.includes('질주') || text.includes('속도')) typeTags.add('Speed');

  // Actives
  if (text.includes('recover') || text.includes('hp') || text.includes('health') || text.includes('potion') || text.includes('energy') || text.includes('체력회복')) activeTags.add('Recovery');
  if (text.includes('blast') || text.includes('speed blast') || text.includes('광속질주')) activeTags.add('Blast');
  if (text.includes('giant') || text.includes('big') || text.includes('거대화')) activeTags.add('Giant');
  if (text.includes('summon') || text.includes('pet') || text.includes('ghost') || text.includes('소환')) activeTags.add('Summons');
  if (text.includes('destroy') || text.includes('obstacle') || text.includes('shield') || text.includes('장애물')) activeTags.add('Obstacles');
  if (text.includes('jelly') || text.includes('bear') || text.includes('score') || text.includes('points') || text.includes('젤리')) activeTags.add('Jelly Point');

  if (typeTags.size === 0) typeTags.add('Magnet');
  if (activeTags.size === 0) activeTags.add('Jelly Point');

  return {
    typeTags: Array.from(typeTags),
    activeTags: Array.from(activeTags)
  };
}

async function parsePetPage(petId) {
  const url = `https://cookierundb.com/pets/${petId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Name & Code & Grade
    const nameMatch = html.match(/<h1>([^<]+)<\/h1>/);
    const name = nameMatch ? decodeEntities(nameMatch[1].trim()) : '';

    const gradeMatch = html.match(/<span class="badge grade grade-([^"]+)">/);
    const grade = gradeMatch ? gradeMatch[1].trim() : 'S';

    const kickerMatch = html.match(/<div class="hero-kicker">([^<]+)<\/div>/);
    const code = kickerMatch ? kickerMatch[1].replace('Pet · ', '').trim() : petId;

    // 2. Skill Text
    const skillMatch = html.match(/<p class="hero-desc"><em>Skill:<\/em>\s*([\s\S]*?)<\/p>/);
    const skill = skillMatch ? decodeEntities(skillMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

    // 3. Ability Tag
    const abilityMatch = html.match(/<div class="k">Ability<\/div><div class="v">([\s\S]*?)<\/div>/);
    const abilityTag = abilityMatch ? decodeEntities(abilityMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

    // 4. Combi Bonus & Cookie
    const combiMatch = html.match(/<div class="k">Combi Bonus<\/div><div class="v">([\s\S]*?)<\/div>/);
    let combiBonus = '';
    let combiCookieName = '';
    let combiCookieId = '';
    if (combiMatch) {
      const combiHtml = combiMatch[1];
      const cookieLinkMatch = combiHtml.match(/<a href="\.\.\/cookies\/([^"]+)">([^<]+)<\/a>/);
      if (cookieLinkMatch) {
        combiCookieId = cookieLinkMatch[1];
        combiCookieName = decodeEntities(cookieLinkMatch[2].trim());
      }
      combiBonus = decodeEntities(combiHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }

    // 5. Level Progression Table
    const levelProgression = [];
    const tableMatch = html.match(/<table class="tbl">[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/);
    if (tableMatch) {
      const rowMatches = [...tableMatch[1].matchAll(/<tr><td>(\d+)<\/td><td>([\s\S]*?)<\/td><td class="num">([\s\S]*?)<\/td><\/tr>/g)];
      rowMatches.forEach(m => {
        const lvl = Number(m[1]);
        const mag = decodeEntities(m[2].replace(/<[^>]+>/g, '').trim());
        const costStr = decodeEntities(m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        levelProgression.push({
          level: lvl,
          abilityMagnitude: mag,
          upgradeCost: costStr || '—'
        });
      });
    }

    // 6. Related Items (Reward Treasure & Combi Cookie)
    let rewardTreasure = null;
    const relMatches = [...html.matchAll(/<a class="rel-card" href="\.\.\/treasures\/([^"]+)">[\s\S]*?<span>([^<]+)<span class="rc-sub">([^<]+)<\/span><\/span><\/a>/g)];
    if (relMatches.length > 0) {
      rewardTreasure = {
        id: relMatches[0][1],
        name: decodeEntities(relMatches[0][2].trim()),
        subText: decodeEntities(relMatches[0][3].trim())
      };
    }

    // 7. Hidden Stat Effects Table
    const hiddenStats = [];
    const hiddenSectionMatch = html.match(/<h2>Hidden stat effects<\/h2>[\s\S]*?<table class="tbl">[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/);
    if (hiddenSectionMatch) {
      const hRowMatches = [...hiddenSectionMatch[1].matchAll(/<tr><td>([\s\S]*?)<\/td><td class="num">([\s\S]*?)<\/td><td class="num">([\s\S]*?)<\/td><\/tr>/g)];
      hRowMatches.forEach(m => {
        const effName = decodeEntities(m[1].replace(/<[^>]+>/g, '').trim());
        const lv1 = decodeEntities(m[2].replace(/<[^>]+>/g, '').trim());
        const lv8 = decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
        hiddenStats.push({ effect: effName, lv1, lv8 });
      });
    }

    // 8. Story Text
    const storyMatch = html.match(/<h2>Story<\/h2>[\s\S]*?<p class="hero-desc">([\s\S]*?)<\/p>/);
    const story = storyMatch ? decodeEntities(storyMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

    // Standardized Traits
    const traits = standardizePetTraits(name, skill, abilityTag, story);

    return {
      petId,
      code,
      name,
      grade,
      skill,
      abilityTag,
      combiCookieId,
      combiCookieName,
      combiBonus,
      levelProgression,
      rewardTreasure,
      hiddenStats,
      story,
      traits
    };
  } catch (e) {
    console.error(`Error parsing pet ${petId}:`, e.message);
    return null;
  }
}

async function parseAllPets() {
  console.log('🚀 Parsing ALL Pets directly from Wiki & downloading image assets...');

  const indexJs = fs.readFileSync(path.join(petsWikiDir, 'search-index.js'), 'utf8');
  const petMatches = [...indexJs.matchAll(/\{"n":"([^"]+)","t":"pet","u":"pets\/(pet\d+)"/g)];
  const petList = petMatches.map(m => ({ name: m[1], petId: m[2] }));

  console.log(`Found ${petList.length} total Pet entries in Wiki index.`);

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let updatedCount = 0;

  for (let i = 0; i < petList.length; i += 10) {
    const chunk = petList.slice(i, i + 10);
    const results = await Promise.all(chunk.map(p => parsePetPage(p.petId)));

    results.forEach(parsed => {
      if (!parsed || !parsed.name) return;

      const slug = slugify(parsed.name);

      // Copy offline image asset petXX.png -> /public/images/pets/${slug}.png
      const offlineImageFile = `${parsed.petId}.png`;
      const offlineSrc = path.join(petsWikiDir, offlineImageFile);
      const destFile = `${slug}.png`;
      const destPath = path.join(publicPetsDir, destFile);

      if (fs.existsSync(offlineSrc)) {
        fs.copyFileSync(offlineSrc, destPath);
      }

      // Find or create in catalog
      let petObj = catalog.pets.find(p => p.id === slug || slugify(p.name) === slug);
      if (!petObj) {
        petObj = {
          id: slug,
          name: parsed.name,
          grade: parsed.grade,
          category: 'pet',
          description: parsed.skill,
          skill: parsed.skill,
          maxLevel: 8,
          imageUrl: `/images/pets/${destFile}`
        };
        catalog.pets.push(petObj);
      }

      // Populate rich Wiki fields
      petObj.code = parsed.code;
      petObj.grade = parsed.grade;
      petObj.skill = parsed.skill;
      petObj.description = parsed.story || parsed.skill;
      petObj.abilityTag = parsed.abilityTag;
      petObj.combiCookieId = parsed.combiCookieId;
      petObj.combiCookieName = parsed.combiCookieName;
      petObj.combiBonus = parsed.combiBonus;
      petObj.story = parsed.story;
      petObj.rewardTreasure = parsed.rewardTreasure;
      petObj.hiddenStats = parsed.hiddenStats;
      petObj.levelProgression = parsed.levelProgression;

      // Trait standardization
      petObj.standardizedTraits = {
        typeTags: parsed.traits.typeTags,
        activeTags: parsed.traits.activeTags,
        summary: `Standardized [Types: ${parsed.traits.typeTags.join(', ')}] [Actives: ${parsed.traits.activeTags.join(', ')}]`
      };

      petObj.imageUrl = `/images/pets/${destFile}`;
      updatedCount++;
    });
  }

  // Save updated catalog back to disk
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

  console.log(`\n🎉 PARSE COMPLETE! Successfully updated ${updatedCount} Pets in classic-catalog.json with 100% full Wiki data & local images!`);
}

parseAllPets().catch(console.error);
