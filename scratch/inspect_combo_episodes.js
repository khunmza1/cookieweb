const fs = require('fs');

async function inspectComboEpisodes() {
  const epCounts = {};

  for (let page = 1; page <= 5; page++) {
    const url = `https://www.cookierunhub.com/en/episodes?page=${page}`;
    const res = await fetch(url);
    const html = await res.text();

    const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    let payload = '';
    matches.forEach(m => {
      payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    });

    const comboIds = [...payload.matchAll(/"id":(\d+),"episode":"([^"]+)"/g)].map(m => Number(m[1]));
    const uniqueIds = [...new Set(comboIds)];

    for (const id of uniqueIds.slice(0, 5)) {
      const detailUrl = `https://www.cookierunhub.com/en/episodes/${id}`;
      const dRes = await fetch(detailUrl);
      const dHtml = await dRes.text();

      const dMatches = [...dHtml.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
      let dPayload = '';
      dMatches.forEach(m => {
        dPayload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      });

      const idx = dPayload.indexOf('"initialData":{');
      if (idx !== -1) {
        const start = idx + '"initialData":'.length;
        let depth = 0;
        let end = -1;
        for (let i = start; i < dPayload.length; i++) {
          if (dPayload[i] === '{') depth++;
          else if (dPayload[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        if (end !== -1) {
          const comboObj = JSON.parse(dPayload.slice(start, end));
          const ep = comboObj.episode || 'unknown';
          epCounts[ep] = (epCounts[ep] || 0) + 1;
          console.log(`Combo ID ${id}: Episode = "${ep}", Title = "${comboObj.first_cookie?.name} + ${comboObj.second_cookie?.name}"`);
        }
      }
    }
  }

  console.log('\nEpisode distribution:', epCounts);
}

inspectComboEpisodes().catch(console.error);
