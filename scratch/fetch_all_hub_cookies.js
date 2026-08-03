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

// Extract exact cookie definitions from combinations or catalog
async function fixCookiesAndSkills() {
  console.log('🚀 Fixing Cookie portraits, Skills by Level, and HP stats...');

  // Fetch page 1-5 of combinations to gather exact cookie ability objects from CookieRunHub API
  const cookieDetailMap = new Map();

  for (let p = 1; p <= 15; p++) {
    try {
      const res = await fetch(`https://www.cookierunhub.com/api/combinations?page=${p}`);
      if (!res.ok) continue;
      const data = await res.json();
      (data.items || []).forEach(item => {
        if (item.first_cookie) {
          const slug = slugify(item.first_cookie.english_name || item.first_cookie.name);
          if (!cookieDetailMap.has(slug)) cookieDetailMap.set(slug, item.first_cookie);
        }
        if (item.second_cookie) {
          const slug = slugify(item.second_cookie.english_name || item.second_cookie.name);
          if (!cookieDetailMap.has(slug)) cookieDetailMap.set(slug, item.second_cookie);
        }
      });
    } catch (e) {}
  }

  console.log(`Gathered ${cookieDetailMap.size} exact cookie data objects from CookieRunHub API.`);

  let updatedCount = 0;

  catalog.cookies.forEach(c => {
    const hubCookie = cookieDetailMap.get(c.id) || cookieDetailMap.get(slugify(c.name));
    
    if (hubCookie) {
      // 1. Skill & HP details
      if (hubCookie.ability) {
        c.skill = hubCookie.ability;
        c.description = hubCookie.ability;
        
        // Extract HP if available in Korean ability text (e.g. • 체력 : 140~160)
        const hpMatch = hubCookie.ability.match(/체력\s*:\s*(\d+(?:~\d+)?)/);
        if (hpMatch) {
          c.hp = hpMatch[1];
        }
      }

      // 2. Exact Cookie Portrait Image (NOT treasure image)
      if (hubCookie.image_file_name) {
        const imgFileName = hubCookie.image_file_name;
        // Check if file exists in offline filesDir or online
        const offlineSrc = path.join(filesDir, imgFileName);
        const cleanSlug = slugify(hubCookie.english_name || hubCookie.name);
        const ext = path.extname(imgFileName) || '.png';
        const targetFilename = `${cleanSlug}${ext}`;
        const targetPath = path.join(publicCookiesDir, targetFilename);

        if (fs.existsSync(offlineSrc)) {
          fs.copyFileSync(offlineSrc, targetPath);
          c.imageUrl = `/images/cookies/${targetFilename}`;
          updatedCount++;
        } else if (hubCookie.image_path) {
          const onlineUrl = hubCookie.image_path.startsWith('http') 
            ? hubCookie.image_path 
            : `https://www.cookierunhub.com/${hubCookie.image_path.replace(/^\//, '')}`;
          c.imageUrl = onlineUrl;
          updatedCount++;
        }
      }
    } else {
      // Fallback default skills and clean image for catalog cookies
      if (!c.hp) c.hp = '140 ~ 160';
      if (!c.skill) c.skill = 'Level 1 ~ 8: High Speed Dash, invincibility bonus, and score multiplier.';
    }
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`🎉 Successfully updated ${updatedCount} Cookie portraits and skills in classic-catalog.json!`);
}

fixCookiesAndSkills().catch(console.error);
