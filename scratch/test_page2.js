async function checkPage2() {
  const url = 'https://www.cookierunhub.com/en/episodes?page=2';
  const res = await fetch(url);
  const html = await res.text();

  const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
  let payload = '';
  matches.forEach(m => {
    payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  });

  const ids = [...payload.matchAll(/"id":(\d+)/g)].map(m => Number(m[1]));
  console.log('Page 2 combo IDs found with simple "id":', [...new Set(ids)]);
}

checkPage2().catch(console.error);
