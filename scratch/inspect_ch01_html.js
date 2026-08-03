async function inspectCh01() {
  const res = await fetch('https://cookierundb.com/cookies/ch01');
  const html = await res.text();
  console.log(html);
}

inspectCh01().catch(console.error);
