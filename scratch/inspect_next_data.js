const fs = require('fs');

async function checkNextData() {
  const url = 'https://www.cookierunhub.com/en/episodes?episode=ep1&page=1';
  console.log('Fetching:', url);
  const res = await fetch(url);
  const html = await res.text();

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    console.log('Found __NEXT_DATA__!');
    const data = JSON.parse(nextDataMatch[1]);
    console.log('Keys in pageProps:', Object.keys(data.props?.pageProps || {}));
    fs.writeFileSync('scratch/next_data_sample.json', JSON.stringify(data.props?.pageProps, null, 2));
  } else {
    console.log('No __NEXT_DATA__ found, checking html snippet...');
    console.log(html.slice(0, 1000));
  }
}

checkNextData().catch(console.error);
