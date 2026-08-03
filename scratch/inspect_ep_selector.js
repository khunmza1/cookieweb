async function checkSelector() {
  const url = 'https://www.cookierunhub.com/_next/static/chunks/0wyvf322fn8ai.js';
  const res = await fetch(url);
  const js = await res.text();

  // Search for arrays or objects containing ep1, ep2, ep3 or episode list
  const epArrayMatches = [...js.matchAll(/\[[\"']ep1[\"'][\s\S]*?\]/g)].map(m => m[0]);
  console.log('EP Array matches:', epArrayMatches);

  // Search for any string array containing ep2
  const ep2Matches = [...js.matchAll(/\"ep[1-7]\"/g)].map(m => m[0]);
  console.log('EP string matches:', [...new Set(ep2Matches)]);
}

checkSelector().catch(console.error);
