const fs = require('fs');

const html = fs.readFileSync('Encyclopedia - Cookie Run for Kakao Data _ CookieRunHUB.html', 'utf8');

console.log('HTML Total length:', html.length);

const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/g)];
console.log(`Found ${scriptMatches.length} script tags.`);

scriptMatches.forEach((m, idx) => {
  const content = m[1];
  if (content.includes('first_cookie') || content.includes('ability') || content.includes('Pistachio Cookie') || content.includes('fire_spirit_cookie')) {
    console.log(`Script tag #${idx} contains cookie data! Length: ${content.length}`);
    fs.writeFileSync(`scratch/cookie_script_${idx}.txt`, content);
  }
});
