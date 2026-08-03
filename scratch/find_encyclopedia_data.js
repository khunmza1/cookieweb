const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
console.log(`Found ${matches.length} RSC pushes.`);

matches.forEach((m, idx) => {
  const content = m[1];
  if (content.includes('cookies/') || content.includes('health_stat') || content.includes('ability_desc') || content.includes('피스타치오')) {
    console.log(`RSC push #${idx} has length ${content.length}`);
    fs.writeFileSync(`scratch/rsc_push_${idx}.txt`, content.replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
  }
});
