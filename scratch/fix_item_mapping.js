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
  
  // 1. Match by ID or English slug
  let found = catalog.cookies.find(c => c.id === item.id || (item.english_name && c.id === slugify(item.english_name)));
  if (found) return found.id;

  // 2. Match by exact Korean name
  found = catalog.cookies.find(c => c.name === item.name || (item.english_name && c.name === item.english_name));
  if (found) return found.id;

  // 3. Match by image filename
  if (item.image_file_name) {
    found = catalog.cookies.find(c => c.imageUrl?.includes(item.image_file_name));
    if (found) return found.id;
  }

  // Auto-register missing cookie in catalog so it displays perfectly with image & name!
  const newId = slugify(item.english_name || item.name || `cookie-${item.id}`);
  const newCookie = {
    id: newId,
    name: item.english_name || item.name,
    grade: item.grade || 'S',
    category: 'cookie',
    description: item.ability || 'CookieRun Classic Cookie',
    skill: item.ability || 'Special Skill',
    maxLevel: 8,
    imageUrl: item.image_path ? (item.image_path.startsWith('http') ? item.image_path : `https://www.cookierunhub.com${item.image_path}`) : '/images/cookies/gingerbrave.png'
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

console.log('Testing auto-registering missing items...');
const testCombo = {
  first_cookie: { id: 92, name: "동파육맛 쿠키", english_name: "Braised Pork Cookie", grade: "S", image_path: "https://res.cloudinary.com/ddlgnadxl/image/upload/v1784846227/cookierun/cookies/game_item_4e320abcaf.png" },
  pet: { id: 100, name: "청경채 방석", english_name: "Bok Choy Cushion", grade: "S", image_path: "https://res.cloudinary.com/ddlgnadxl/image/upload/v1785418292/cookierun/pets/game_item_6061f0db28.png" }
};

const cId = findOrCreateCookie(testCombo.first_cookie);
const pId = findOrCreatePet(testCombo.pet);

console.log('Resolved Cookie ID:', cId);
console.log('Resolved Pet ID:', pId);
console.log('Catalog cookies length now:', catalog.cookies.length);
