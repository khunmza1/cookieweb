async function checkApiResponse() {
  const url = 'https://www.cookierunhub.com/api/combinations?page=1';
  const res = await fetch(url);
  const data = await res.json();

  console.log('Total combos:', data.total, 'Total pages:', data.pages);
  console.log('Items returned in page 1:', data.items.length);
  if (data.items.length > 0) {
    console.log('\n--- Sample Combo JSON from REST API ---');
    console.log(JSON.stringify(data.items[0], null, 2));
  }
}

checkApiResponse().catch(console.error);
