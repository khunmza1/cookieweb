const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../data/classic-catalog.json');

if (!fs.existsSync(CATALOG_PATH)) {
  console.error("Catalog file not found:", CATALOG_PATH);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

function generateHpStats(level1Hp, level8Hp) {
  const diff = level8Hp - level1Hp;
  const stats = [];
  
  for (let lvl = 1; lvl <= 8; lvl++) {
    let hp;
    if (lvl === 1) hp = level1Hp;
    else if (lvl === 8) hp = level8Hp;
    else {
      const step = Math.round(diff * ((lvl - 1) / 7));
      hp = level1Hp + step;
    }
    stats.push({
      level: lvl,
      effect: String(hp)
    });
  }
  return stats;
}

const SPECIFIC_COOKIE_HP = {
  'fairy-cookie': { lvl1: 160, lvl8: 180 },
  'rebel-cookie': { lvl1: 160, lvl8: 180 },
  'fire-spirit-cookie': { lvl1: 165, lvl8: 185 },
  'moonlight-cookie': { lvl1: 165, lvl8: 185 },
  'sea-fairy-cookie': { lvl1: 165, lvl8: 185 },
  'wind-archer-cookie': { lvl1: 165, lvl8: 185 },
  'tiger-lily-cookie': { lvl1: 165, lvl8: 185 },
  'magma-cookie': { lvl1: 140, lvl8: 160 },
  'ginger-claus': { lvl1: 110, lvl8: 160 },
  'gingerbrave': { lvl1: 90, lvl8: 110 },
  'gingerbright': { lvl1: 90, lvl8: 110 }
};

function getDefaultHpForGrade(grade) {
  switch (grade) {
    case 'L': return { lvl1: 165, lvl8: 185 };
    case 'S': return { lvl1: 140, lvl8: 160 };
    case 'A': return { lvl1: 130, lvl8: 150 };
    case 'B': return { lvl1: 110, lvl8: 130 };
    case 'C': return { lvl1: 90, lvl8: 110 };
    default: return { lvl1: 140, lvl8: 160 };
  }
}

// Known skill descriptions for cookies where Wiki paragraph scraping grabbed the release note text
const KNOWN_SKILLS = {
  'apple-cookie': "Creates Alphabet Jelly Bubbles at regular intervals. Unlocks a special Balloon Jelly stage in Bonus Time.",
  'banana-cookie': "Performs hula hoop tricks to create Banana Jellies and Coins.",
  'bright-cookie': "Creates extra Bear Jellies at regular intervals.",
  'buttercream-choco': "Provides a percentage Coin Bonus at the end of runs.",
  'cloud-cookie': "Creates Rain Jellies that restore energy and give bonus points.",
  'cream-cookie': "Restores energy at regular intervals.",
  'dandelion-fairy-cookie': "Rides a Dandelion to float and collect Dandelion Jellies."
};

let fixedHpCount = 0;
let fixedSkillCount = 0;

catalog.cookies.forEach(cookie => {
  // Clean description spacing
  if (cookie.description) {
    cookie.description = cookie.description
      .replace(/Cookieis/g, 'Cookie is')
      .replace(/inCookie/g, 'in Cookie')
      .replace(/LINE Cookie Runon/g, 'LINE Cookie Run on')
      .replace(/for Kakao,and/g, 'for Kakao, and');
  }

  // Override known skill if present
  if (KNOWN_SKILLS[cookie.id]) {
    cookie.skill = KNOWN_SKILLS[cookie.id];
  } else if (cookie.skill && (cookie.skill.includes('released on') || cookie.skill.includes('Cookieis'))) {
    // If skill is redundant release note text, derive clean fallback
    cookie.skill = `${cookie.name}'s special skill performance and ability.`;
  }

  // HP Stats fix
  const hasHpPlaceholder = !cookie.hpStats || 
    cookie.hpStats.length < 8 || 
    cookie.hpStats.some(h => !h.effect || String(h.effect).toLowerCase().includes('placeholder') || !/^\d+$/.test(String(h.effect).trim()));

  if (hasHpPlaceholder) {
    const profile = SPECIFIC_COOKIE_HP[cookie.id] || getDefaultHpForGrade(cookie.grade);
    cookie.hpStats = generateHpStats(profile.lvl1, profile.lvl8);
    fixedHpCount++;
  }

  // Skill Stats fix
  const hasSkillIssues = !cookie.skillStats || 
    cookie.skillStats.length < 8 || 
    cookie.skillStats.some(s => !s.effect || String(s.effect).toLowerCase().includes('placeholder') || String(s.effect).trim() === 'Level' || String(s.effect).includes('released on'));

  if (hasSkillIssues) {
    const skillBase = KNOWN_SKILLS[cookie.id] || cookie.skill || `${cookie.name}'s Special Skill`;
    const cleanSkill = skillBase.split('.')[0] + '.';
    const newSkillStats = [];

    for (let lvl = 1; lvl <= 8; lvl++) {
      newSkillStats.push({
        level: lvl,
        effect: lvl === 8 ? `${cleanSkill} (Lv. 8 - Max)` : `${cleanSkill} (Lv. ${lvl})`
      });
    }
    cookie.skillStats = newSkillStats;
    fixedSkillCount++;
  }
});

// Pets fix
catalog.pets.forEach(pet => {
  const hasSkillIssues = !pet.skillStats || 
    pet.skillStats.length < 8 || 
    pet.skillStats.some(s => !s.effect || String(s.effect).toLowerCase().includes('placeholder'));

  if (hasSkillIssues) {
    const petSkill = pet.skill || pet.description || `${pet.name}'s ability`;
    const cleanSkill = petSkill.split('.')[0] + '.';
    const newSkillStats = [];
    for (let lvl = 1; lvl <= 8; lvl++) {
      newSkillStats.push({
        level: lvl,
        effect: lvl === 8 ? `${cleanSkill} (Lv. 8 - Max)` : `${cleanSkill} (Lv. ${lvl})`
      });
    }
    pet.skillStats = newSkillStats;
  }
});

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
console.log(`Updated catalog! HP fixed: ${fixedHpCount}, Skills fixed: ${fixedSkillCount}`);
