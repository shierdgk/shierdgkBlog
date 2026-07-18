// Fix unescaped double quotes inside article content string literals
const fs = require('fs');
let src = fs.readFileSync('articles-data.js', 'utf-8');
const lines = src.split('\n');
const out = [];
let inContent = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (line.includes('content: [') || line.includes('content:[')) {
    inContent = true;
    out.push(line);
    continue;
  }
  if (inContent && trimmed === ']') {
    inContent = false;
    out.push(line);
    continue;
  }
  if (!inContent) {
    out.push(line);
    continue;
  }
  
  // Match content string lines:   "text...",
  const m = line.match(/^(\s*)"(.*)",?$/);
  if (m) {
    const indent = m[1];
    let text = m[2];
    // Escape all unescaped double quotes
    text = text.replace(/(?<!\\)"/g, '\\"');
    out.push(indent + '"' + text + '",');
  } else {
    out.push(line);
  }
}

fs.writeFileSync('articles-data.js', out.join('\n'), 'utf-8');
console.log('Fixed. Verifying...');

// Verify
global.window = {};
try {
  require('./articles-data.js');
  console.log('✅ OK - ' + window.BLOG_ARTICLES.length + ' articles');
} catch (e) {
  console.error('❌ Still broken:', e.message);
}
