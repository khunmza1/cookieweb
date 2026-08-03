async function inspectPet01() {
  const res = await fetch('https://cookierundb.com/pets/pet01');
  const html = await res.text();
  console.log(html);
}

inspectPet01().catch(console.error);
