const fs = require('fs');
const path = require('path');

const filesDir = path.join(__dirname, '../Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB_files');
const catalogPath = path.join(__dirname, '../data/classic-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const publicTreasuresDir = path.join(__dirname, '../public/images/treasures');

const krMap = {
  '프로의_골든_글러브.png': 'pros-golden-glove.png',
  '블루베리_백마_오르골.png': 'blueberry-white-horse-music-box.png',
  '꿀_호리병의_황금빛_밀랍_마개.png': 'honey-jar-golden-beeswax-stopper.png',
  '라즈베리_회전목마_오르골.png': 'raspberry-carousel-music-box.png',
  '아티스트의_팔레트_세트.png': 'artists-palette-set.png',
  '카이막맛_쿠키의_구름_장화.png': 'kaymak-cookie-cloud-boots.png',
  '컬러풀_키즈_물감.png': 'colorful-kids-paint.png',
  '튼튼한_캐치볼_글러브.png': 'sturdy-catchball-glove.png'
};

Object.entries(krMap).forEach(([krFile, engFile]) => {
  const src = path.join(filesDir, krFile);
  if (fs.existsSync(src)) {
    const dest = path.join(publicTreasuresDir, engFile);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${krFile} -> ${engFile}`);
  }
});

// Update catalog
const goldenGlove = catalog.treasures.find(t => t.id === 'pro-s-golden-glove');
if (goldenGlove) goldenGlove.imageUrl = '/images/treasures/pros-golden-glove.png';

const musicBox = catalog.treasures.find(t => t.id === 'blueberry-white-horse-music-box');
if (musicBox) musicBox.imageUrl = '/images/treasures/blueberry-white-horse-music-box.png';

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Successfully updated Korean-named treasure assets in public/images/treasures and classic-catalog.json!');
