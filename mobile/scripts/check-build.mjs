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
const entries = urls.filter(url => url.endsWith('.js'));
assert(entries.length, 'missing entry scripts');
assert(entries.every(url => !/adapter-|engine-/.test(url)), 'adapter or engine loaded at startup');
const sizes = await Promise.all(entries.map(url => stat(`dist/${url.split('/').slice(-2).join('/')}`).then(info => info.size)));
const bytes = sizes.reduce((sum, size) => sum + size, 0);
assert(bytes < 1_500_000, `startup scripts exceed 1.5 MB budget: ${bytes}`);
console.log(`Subpath and Mastersheet checks passed; startup scripts ${bytes} bytes (budget 1,500,000).`);
