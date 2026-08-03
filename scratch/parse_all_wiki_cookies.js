const fs = require('fs');
const path = require('path');

const wikiFilesDir = path.join(__dirname, '../Cookies · CookieRun Classic Wiki_files');
const publicCookiesDir = path.join(__dirname, '../public/images/cookies');
const catalogPath = path.join(__dirname, '../data/classic-catalog.json');

if (!fs.existsSync(publicCookiesDir)) {
  fs.mkdirSync(publicCookiesDir, { recursive: true });
}

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// In-Game Trait Standardization Classifier for Cookies
function standardizeCookieTraits(name, skill, story) {
  const typeTags = new Set();
  const activeTags = new Set();

  const text = `${name} ${skill} ${story}`.toLowerCase();

  // Types
  if (text.includes('magnet') || text.includes('magnetic') || text.includes('자력')) typeTags.add('Magnet');
  if (text.includes('coin') || text.includes('gold') || text.includes('코인')) typeTags.add('Coins');
  if (text.includes('xp') || text.includes('exp') || text.includes('experience') || text.includes('경험치')) typeTags.add('XP');
  if (text.includes('pit') || text.includes('fall') || text.includes('rescue') || text.includes('구출')) typeTags.add('Pit Lift');
  if (text.includes('revive') || text.includes('resurrect') || text.includes('부활')) typeTags.add('Revive');
  if (text.includes('drain') || text.includes('slow') || text.includes('health drain') || text.includes('체력감소')) typeTags.add('Drain');
  if (text.includes('speed') || text.includes('dash') || text.includes('fast') || text.includes('질주') || text.includes('속도')) typeTags.add('Speed');

  // Actives
  if (text.includes('recover') || text.includes('hp') || text.includes('health') || text.includes('energy') || text.includes('체력회복')) activeTags.add('Recovery');
  if (text.includes('blast') || text.includes('speed blast') || text.includes('광속질주')) activeTags.add('Blast');
  if (text.includes('giant') || text.includes('big') || text.includes('거대화')) activeTags.add('Giant');
  if (text.includes('summon') || text.includes('pet') || text.includes('ghost') || text.includes('소환')) activeTags.add('Summons');
  if (text.includes('destroy') || text.includes('obstacle') || text.includes('shield') || text.includes('장애물')) activeTags.add('Obstacles');
  if (text.includes('jelly') || text.includes('score') || text.includes('points') || text.includes('젤리')) activeTags.add('Jelly Point');

  if (typeTags.size === 0) typeTags.add('Speed');
  if (activeTags.size === 0) activeTags.add('Jelly Point');

  return {
    typeTags: Array.from(typeTags),
    activeTags: Array.from(activeTags)
  };
}

// Fetch and parse single cookie page
async function parseCookiePage(chId) {
  const url = `https://cookierundb.com/cookies/${chId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Name & Kicker
    const nameMatch = html.match(/<h1>([^<]+)<\/h1>/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    const gradeMatch = html.match(/<span class="badge grade grade-([^"]+)">/);
    const grade = gradeMatch ? gradeMatch[1].trim() : 'S';

    const kickerMatch = html.match(/<div class="hero-kicker">([^<]+)<\/div>/);
    const code = kickerMatch ? kickerMatch[1].replace('Cookie · ', '').trim() : chId;

    // 2. Skill Text
    const skillMatch = html.match(/<p class="hero-desc"><em>Skill:<\/em>\s*([\s\S]*?)<\/p>/);
    const skill = skillMatch ? skillMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 3. How to unlock
    const unlockMatch = html.match(/<div class="k">How to unlock<\/div><div class="v">([\s\S]*?)<\/div>/);
    const unlockRequirement = unlockMatch ? unlockMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 4. Combi Bonus
    const combiMatch = html.match(/<div class="k">Combi Bonus<\/div><div class="v">([\s\S]*?)<\/div>/);
    let combiBonus = '';
    let combiPetName = '';
    if (combiMatch) {
      const combiHtml = combiMatch[1];
      const petLinkMatch = combiHtml.match(/<a[^>]*>([^<]+)<\/a>/);
      if (petLinkMatch) combiPetName = petLinkMatch[1].trim();
      combiBonus = combiHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // 5. Level Progression Table
    const levelProgression = [];
    const tableMatch = html.match(/<table class="tbl">[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/);
    if (tableMatch) {
      const rowMatches = [...tableMatch[1].matchAll(/<tr><td>(\d+)<\/td><td>([^<]*)<\/td><td class="num">(\d+)<\/td><td class="num">([\s\S]*?)<\/td><\/tr>/g)];
      rowMatches.forEach(m => {
        const lvl = Number(m[1]);
        const title = m[2].trim();
        const energy = Number(m[3]);
        const costStr = m[4].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        levelProgression.push({
          level: lvl,
          title,
          energy,
          upgradeCost: costStr || '—'
        });
      });
    }

    // 6. Related (Treasure Reward & Combi Pet)
    let rewardTreasure = null;
    const relMatches = [...html.matchAll(/<a class="rel-card" href="\.\.\/treasures\/([^"]+)">[\s\S]*?<span>([^<]+)<span class="rc-sub">([^<]+)<\/span><\/span><\/a>/g)];
    if (relMatches.length > 0) {
      rewardTreasure = {
        id: relMatches[0][1],
        name: relMatches[0][2].trim(),
        subText: relMatches[0][3].trim()
      };
    }

    // 7. Skins
    const skins = [];
    const skinSectionMatch = html.match(/<h2>Skins<\/h2>[\s\S]*?<div class="rel-strip">([\s\S]*?)<\/div>/);
    if (skinSectionMatch) {
      const skinMatches = [...skinSectionMatch[1].matchAll(/<span>([^<]+)<span class="rc-sub">([^<]+)<\/span><\/span>/g)];
      skinMatches.forEach(m => {
        skins.push({
          name: m[1].trim(),
          subText: m[2].trim()
        });
      });
    }

    // 8. Story Text
    const storyMatch = html.match(/<h2>Story<\/h2>[\s\S]*?<p class="hero-desc">([\s\S]*?)<\/p>/);
    const story = storyMatch ? storyMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Standardized Traits
    const traits = standardizeCookieTraits(name, skill, story);

    return {
      chId,
      code,
      name,
      grade,
      skill,
      unlockRequirement,
      combiPetName,
      combiBonus,
      levelProgression,
      rewardTreasure,
      skins,
      story,
      traits
    };
  } catch (e) {
    console.error(`Error parsing ${chId}:`, e.message);
    return null;
  }
}

async function parseAllCookies() {
  console.log('🚀 Parsing ALL 93 Cookies directly from Wiki & downloading assets...');

  // Search index contains all cookie IDs: ch01..ch95
  const indexJs = fs.readFileSync(path.join(wikiFilesDir, 'search-index.js'), 'utf8');
  const cookieMatches = [...indexJs.matchAll(/\{"n":"([^"]+)","t":"cookie","u":"cookies\/(ch\d+)"/g)];
  const cookieList = cookieMatches.map(m => ({ name: m[1], chId: m[2] }));

  console.log(`Found ${cookieList.length} total cookie entries in Wiki index.`);

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let updatedCount = 0;

  for (let i = 0; i < cookieList.length; i += 10) {
    const chunk = cookieList.slice(i, i + 10);
    const results = await Promise.all(chunk.map(c => parseCookiePage(c.chId)));

    results.forEach(parsed => {
      if (!parsed || !parsed.name) return;

      const slug = slugify(parsed.name);

      // Copy offline image file chXX.png -> /public/images/cookies/${slug}.png
      const offlineImageFile = `${parsed.chId}.png`;
      const offlineSrc = path.join(wikiFilesDir, offlineImageFile);
      const destFile = `${slug}.png`;
      const destPath = path.join(publicCookiesDir, destFile);

      if (fs.existsSync(offlineSrc)) {
        fs.copyFileSync(offlineSrc, destPath);
      }

      // Find or create in catalog
      let cookieObj = catalog.cookies.find(c => c.id === slug || slugify(c.name) === slug);
      if (!cookieObj) {
        cookieObj = {
          id: slug,
          name: parsed.name,
          grade: parsed.grade,
          category: 'cookie',
          description: parsed.skill,
          skill: parsed.skill,
          maxLevel: 8,
          imageUrl: `/images/cookies/${destFile}`
        };
        catalog.cookies.push(cookieObj);
      }

      // Populate rich Wiki fields
      cookieObj.code = parsed.code;
      cookieObj.grade = parsed.grade;
      cookieObj.skill = parsed.skill;
      cookieObj.description = parsed.story || parsed.skill;
      cookieObj.unlockedBy = parsed.unlockRequirement;
      cookieObj.combiBonus = parsed.combiBonus;
      cookieObj.combiPetName = parsed.combiPetName;
      cookieObj.story = parsed.story;
      cookieObj.rewardTreasure = parsed.rewardTreasure;
      cookieObj.skins = parsed.skins;
      cookieObj.levelProgression = parsed.levelProgression;

      // Extract max energy (HP)
      if (parsed.levelProgression.length > 0) {
        const l1 = parsed.levelProgression[0].energy;
        const lMax = parsed.levelProgression[parsed.levelProgression.length - 1].energy;
        cookieObj.hp = `${l1} ~ ${lMax} HP`;
      }

      // Trait standardization
      cookieObj.standardizedTraits = {
        typeTags: parsed.traits.typeTags,
        activeTags: parsed.traits.activeTags,
        summary: `Standardized [Types: ${parsed.traits.typeTags.join(', ')}] [Actives: ${parsed.traits.activeTags.join(', ')}]`
      };

      cookieObj.imageUrl = `/images/cookies/${destFile}`;
      updatedCount++;
    });
  }

  // Save updated catalog back to disk
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

  console.log(`\n🎉 PARSE COMPLETE! Successfully updated ${updatedCount} Cookies in classic-catalog.json with 100% full Wiki data & local images!`);
}

parseAllCookies().catch(console.error);
