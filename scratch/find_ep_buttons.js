const fs = require('fs');

const html = fs.readFileSync('scratch/full_page.html', 'utf8');

// Search for any button text or onclick/href related to EP 2, EP 3, EP 4
const matches = [...html.matchAll(/EP\s*[1-7]/gi)].map(m => m[0]);
console.log('EP matches in full_page.html:', matches);

// Search for episode dropdown or tab options
const tabMatches = [...html.matchAll(/<button[^>]*?>[\s\S]*?EP[\s\S]*?<\/button>/gi)].map(m => m[0]);
console.log('EP Tab Buttons:', tabMatches.slice(0, 10));
