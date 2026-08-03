const fs = require('fs');
const path = require('path');

const filesDir = path.join(__dirname, '../Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB_files');
const catalogPath = path.join(__dirname, '../data/classic-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const publicTreasuresDir = path.join(__dirname, '../public/images/treasures');
const publicCookiesDir = path.join(__dirname, '../public/images/cookies');
const publicPetsDir = path.join(__dirname, '../public/images/pets');

[publicTreasuresDir, publicCookiesDir, publicPetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// 1. Get all image files in Encyclopedia_files
const files = fs.readdirSync(filesDir);
const imageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg'));

console.log(`Found ${imageFiles.length} offline image assets in Encyclopedia_files folder.`);

let copiedTreasures = 0;
let copiedCookies = 0;
let copiedPets = 0;

imageFiles.forEach(file => {
  const srcPath = path.join(filesDir, file);
  const ext = path.extname(file);
  const baseName = path.basename(file, ext);
  const cleanSlug = slugify(baseName);

  if (file.includes('cookie') || file.startsWith('cookies_')) {
    const destPath = path.join(publicCookiesDir, `${cleanSlug}${ext}`);
    fs.copyFileSync(srcPath, destPath);
    copiedCookies++;
  } else if (file.includes('pet') || file.includes('fly') || file.includes('drop')) {
    const destPath = path.join(publicPetsDir, `${cleanSlug}${ext}`);
    fs.copyFileSync(srcPath, destPath);
    copiedPets++;
  } else {
    const destPath = path.join(publicTreasuresDir, `${cleanSlug}${ext}`);
    fs.copyFileSync(srcPath, destPath);
    copiedTreasures++;
  }
});

console.log(`Copied ${copiedTreasures} treasures, ${copiedCookies} cookies, ${copiedPets} pets into /public/images/!`);

// 2. Map catalog items to local offline image paths
let updatedCatalogCount = 0;

function resolveLocalImage(item, category) {
  if (!item) return;
  const slug = item.id || slugify(item.name);
  const targetDir = category === 'cookie' ? publicCookiesDir : category === 'pet' ? publicPetsDir : publicTreasuresDir;
  
  // Look for exact slug or matching file in targetDir
  const localFiles = fs.readdirSync(targetDir);
  const match = localFiles.find(f => {
    const base = path.basename(f, path.extname(f));
    return base === slug || slug.includes(base) || base.includes(slug);
  });

  if (match) {
    const folder = category === 'cookie' ? 'cookies' : category === 'pet' ? 'pets' : 'treasures';
    item.imageUrl = `/images/${folder}/${match}`;
    updatedCatalogCount++;
  } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
    // If image filename exists in imageFiles, copy it directly with item.id!
    const originalFilename = path.basename(item.imageUrl);
    const offlineMatch = imageFiles.find(f => f.toLowerCase() === originalFilename.toLowerCase());
    if (offlineMatch) {
      const ext = path.extname(offlineMatch);
      const folder = category === 'cookie' ? 'cookies' : category === 'pet' ? 'pets' : 'treasures';
      const destFile = `${slug}${ext}`;
      const destPath = path.join(targetDir, destFile);
      fs.copyFileSync(path.join(filesDir, offlineMatch), destPath);
      item.imageUrl = `/images/${folder}/${destFile}`;
      updatedCatalogCount++;
    }
  }
}

catalog.cookies.forEach(c => resolveLocalImage(c, 'cookie'));
catalog.pets.forEach(p => resolveLocalImage(p, 'pet'));
catalog.treasures.forEach(t => resolveLocalImage(t, 'treasure'));

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

console.log(`Updated ${updatedCatalogCount} items in classic-catalog.json to use local /images/... WebP assets!`);
