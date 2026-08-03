const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/classic-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const publicCookiesDir = path.join(__dirname, '../public/images/cookies');
const filesDir = path.join(__dirname, '../Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB_files');

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchAllCookiesFull() {
  console.log('🚀 Scanning ALL 85 pages for complete Cookie Skill, HP & Portrait data...');

  const cookieMap = new Map();

  for (let page = 1; page <= 85; page += 5) {
    const promises = [];
    for (let p = page; p < page + 5 && p <= 85; p++) {
      promises.push(fetch(`https://www.cookierunhub.com/api/combinations?page=${p}`).then(r => r.json()).catch(() => null));
    }
    const results = await Promise.all(promises);
    results.forEach(data => {
      if (!data || !data.items) return;
      data.items.forEach(item => {
        if (item.first_cookie) {
          const s1 = slugify(item.first_cookie.english_name || item.first_cookie.name);
          const s2 = item.first_cookie.name;
          if (s1 && !cookieMap.has(s1)) cookieMap.set(s1, item.first_cookie);
          if (s2 && !cookieMap.has(s2)) cookieMap.set(s2, item.first_cookie);
        }
        if (item.second_cookie) {
          const s1 = slugify(item.second_cookie.english_name || item.second_cookie.name);
          const s2 = item.second_cookie.name;
          if (s1 && !cookieMap.has(s1)) cookieMap.set(s1, item.second_cookie);
          if (s2 && !cookieMap.has(s2)) cookieMap.set(s2, item.second_cookie);
        }
      });
    });
  }

  console.log(`Gathered ${cookieMap.size} unique cookie definition objects across all 85 pages!`);

  let updatedCount = 0;

  catalog.cookies.forEach(c => {
    const hubCookie = cookieMap.get(c.id) || cookieMap.get(slugify(c.name)) || cookieMap.get(c.name);

    if (hubCookie) {
      // 1. Skill & Level Breakdown
      if (hubCookie.ability) {
        c.skill = hubCookie.ability;
        c.description = hubCookie.ability;

        const hpMatch = hubCookie.ability.match(/체력\s*:\s*(\d+(?:~\d+)?)/);
        if (hpMatch) {
          c.hp = `${hpMatch[1]} HP`;
        }
      }

      // 2. Cookie Portrait Image (clean cookie portrait, NOT treasure image!)
      if (hubCookie.image_path) {
        const rawFilename = path.basename(hubCookie.image_path);
        const offlineSrc = path.join(filesDir, rawFilename);
        const cleanSlug = slugify(hubCookie.english_name || hubCookie.name);
        const ext = path.extname(rawFilename) || '.png';
        const targetFilename = `${cleanSlug}${ext}`;
        const targetPath = path.join(publicCookiesDir, targetFilename);

        if (fs.existsSync(offlineSrc)) {
          fs.copyFileSync(offlineSrc, targetPath);
          c.imageUrl = `/images/cookies/${targetFilename}`;
          updatedCount++;
        } else {
          const onlineUrl = hubCookie.image_path.startsWith('http')
            ? hubCookie.image_path
            : `https://www.cookierunhub.com/${hubCookie.image_path.replace(/^\//, '')}`;
          c.imageUrl = onlineUrl;
          updatedCount++;
        }
      }
    }

    if (!c.hp) c.hp = '140 ~ 160 HP';
    if (!c.maxLevel) c.maxLevel = 8;
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`🎉 Complete! Updated ${updatedCount} Cookie portraits and skills in classic-catalog.json!`);
}

fetchAllCookiesFull().catch(console.error);
