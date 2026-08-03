async function testComboIdRegex() {
  const url = 'https://www.cookierunhub.com/en/episodes?page=2';
  const res = await fetch(url);
  const html = await res.text();

  const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
  let payload = '';
  matches.forEach(m => {
    payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  });

  // Extract combo IDs: objects with "purpose": or "author": or "first_cookie":
  const comboObjs = [...payload.matchAll(/"id":(\d+),[\s\S]*?"purpose":"([^"]+)"/g)];
  const comboIds = [...new Set(comboObjs.map(m => Number(m[1])))];
  console.log(`Page 2: Found ${comboIds.length} combination IDs:`, comboIds);
}

testComboIdRegex().catch(console.error);
