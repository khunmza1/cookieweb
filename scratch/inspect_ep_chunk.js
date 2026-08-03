async function checkChunk() {
  const url = 'https://www.cookierunhub.com/_next/static/chunks/0wyvf322fn8ai.js';
  const res = await fetch(url);
  const js = await res.text();

  const pos = js.indexOf('episode=');
  if (pos !== -1) {
    console.log('Snippet around episode=:');
    console.log(js.slice(Math.max(0, pos - 300), Math.min(js.length, pos + 500)));
  }
}

checkChunk().catch(console.error);
