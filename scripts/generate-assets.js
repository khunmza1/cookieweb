const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/classic-catalog.json'), 'utf-8'));

function generateSVG(name, grade, category, color1, color2, iconSymbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#bg)"/>
  <circle cx="60" cy="55" r="34" fill="#ffffff" fill-opacity="0.25" />
  <text x="60" y="65" font-family="system-ui, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#ffffff" filter="url(#shadow)">${iconSymbol}</text>
  
  <!-- Grade Badge -->
  <g transform="translate(82, 8)">
    <rect width="30" height="20" rx="6" fill="#18181b" fill-opacity="0.8"/>
    <text x="15" y="14" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="${grade === 'S' || grade === 'L' || grade === 'S+' ? '#f59e0b' : '#3b82f6'}">${grade}</text>
  </g>
  
  <!-- Category Label -->
  <text x="60" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" text-anchor="middle" fill="#ffffff" opacity="0.9">${name}</text>
</svg>`;
}

const colorPairs = {
  cookie: ['#ef4444', '#b91c1c'],
  pet: ['#8b5cf6', '#6d28d9'],
  treasure: ['#f59e0b', '#b45309']
};

const symbols = {
  gingerbrave: '🍪',
  gingerbright: '☀️',
  'buttercream-choco': '🧈',
  'strawberry-cookie': '🍓',
  'zombie-cookie': '🧟',
  'skater-cookie': '🛹',
  'ninja-cookie': '🥷',
  'angel-cookie': '👼',
  'pirate-cookie': '🏴‍☠️',
  'hero-cookie': '🦸',
  'cheesecake-cookie': '🍰',
  'mint-choco-cookie': '🎻',
  'lemon-cookie': '🍋',
  'soda-cookie': '🏄',
  'cherry-cookie': '🍒',
  'vampire-cookie': '🦇',
  'herb-cookie': '🌿',
  'fire-spirit-cookie': '🔥',
  'moonlight-cookie': '🌙',
  'sea-fairy-cookie': '🌊',

  // Pets
  'choco-drop': '💧',
  'cheese-drop': '🧀',
  'witty-dumbbell': '🏋️',
  'brain-gum': '🧠',
  'flowercopter': '🌸',
  'celestial-star': '⭐',
  'giggle-bomb': '💣',
  'fluffy-cheese-cat': '🐱',
  'mr-fa-sol-la-si': '🎶',
  'electro-lemon': '⚡',
  'herb-teapot': '🫖',
  'king-choco-drop': '👑',

  // Treasures
  'angel-feather': '🪶',
  'pirate-boots': '👢',
  'ginseng-root-500': '🌱',
  'ginseng-root-1000': '🌿',
  'cheesecake-piece': '🍰',
  'mint-violin-case': '🎻',
  'heavenly-donut': '🍩',
  'magnetic-rainbow-drink': '🥤',
  'lemon-mp3-player': '🎧',
  'hero-mint-candy': '🍬'
};

const publicDir = path.join(__dirname, '../public/images');

['cookies', 'pets', 'treasures'].forEach(sub => {
  const dir = path.join(publicDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let count = 0;
const processItems = (items, category) => {
  items.forEach(item => {
    const symbol = symbols[item.id] || '✨';
    const pair = colorPairs[category];
    const svgContent = generateSVG(item.name, item.grade, category, pair[0], pair[1], symbol);
    
    // Write SVG (and update item imageUrl to .svg)
    const filePath = path.join(publicDir, `${category}s`, `${item.id}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf-8');
    item.imageUrl = `/images/${category}s/${item.id}.svg`;
    count++;
  });
};

processItems(catalog.cookies, 'cookie');
processItems(catalog.pets, 'pet');
processItems(catalog.treasures, 'treasure');

// Update catalog JSON with updated svg paths
fs.writeFileSync(path.join(__dirname, '../data/classic-catalog.json'), JSON.stringify(catalog, null, 2), 'utf-8');

console.log(`Generated ${count} SVG image assets in public/images/!`);
