import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const html = await readFile('dist/index.html', 'utf8');
const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('data:'));
assert(urls.length > 0 && urls.every(url => url.startsWith('/Dynamic-Calc-Mobile/mobile/')), 'built entry assets must use the mobile repository subpath');
const assets = await readdir('dist/assets');
for (const file of assets) {
  assert(!/mastersheet/i.test(file), `unexpected Mastersheet asset: ${file}`);
  if (/\.(js|css)$/.test(file)) {
    const content = await readFile(`dist/assets/${file}`, 'utf8');
    assert(!/mastersheet/i.test(content), `unexpected Mastersheet content: ${file}`);
  }
}
const entry = urls.find(url => url.endsWith('.js'));
assert(entry, 'missing entry script');
const bytes = (await stat(`dist/${entry.split('/').slice(-2).join('/')}`)).size;
assert(bytes < 1_500_000, `entry script exceeds 1.5 MB budget: ${bytes}`);
console.log(`Subpath and Mastersheet checks passed; entry script ${bytes} bytes (budget 1,500,000).`);
