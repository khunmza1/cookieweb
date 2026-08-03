async function checkEpisodes() {
  const episodes = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', '1', '2', '3', '4', '5', '6', '7'];
  
  for (const ep of episodes) {
    const url = `https://www.cookierunhub.com/en/episodes?episode=${ep}&page=1`;
    const res = await fetch(url);
    const html = await res.text();

    const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    let payload = '';
    matches.forEach(m => {
      payload += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    });

    const comboIds = [...payload.matchAll(/"id":(\d+),"episode":"([^"]+)"/g)];
    console.log(`Query episode=${ep}: Found ${comboIds.length} combos. Sample episode tags:`, comboIds.slice(0, 3).map(m => m[2]));
  }
}

checkEpisodes().catch(console.error);
