// Isolated desktop stat path, not a full desktop UI/ROM test.
// Requires the original pinned Git object (available in a full repository clone).
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { referenceRuntime } from './reference-fixture-runtime.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Verify cached reference bytes before executing any browser-style scripts.
await referenceRuntime();
for (const origin of ['original', 'reference']) {
  const read = name => origin === 'original'
    ? execFileSync('git', ['show', `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74:${name}`],
      { cwd: root, encoding: 'utf8', maxBuffer: 5e6 })
    : readFileSync(`${root}/.baseline-cache/emerald-kaizo/reference/${name}`, 'utf8');
  const html = read('index.html');
  assert.match(html, /function require\(\) \{ return exports \}/);
  assert.match(html, /o\[k\] = m\[k\]/);
  assert.match(read('js/shared_controls.js'), /nature: pokeInfo.find\("\.nature"\).val\(\)/);
  const context = vm.createContext({ console, TITLE: 'Emerald Kaizo', window: {}, settings: {},
    type_chart: 3, damageGen: 3, type_mod: null });
  vm.runInContext('this.__createBinding=function(o,m,k){o[k]=m[k]}; var calc=exports={}; function require(){return exports}', context);
  // Only the stat API's dependencies are needed; retain their HTML script order.
  const needed = new Set(['util', 'stats', 'data/natures', 'data/abilities', 'data/items',
    'data/moves', 'data/species', 'data/types', 'data/index', 'move', 'pokemon', 'field', 'result', 'index']);
  for (const match of html.matchAll(/src="\.\/calc\/([^"?]+)\.js(?:\?[^" ]*)?"/g)) {
    const name = match[1];
    if (!needed.delete(name)) continue;
    vm.runInContext(read(`calc/${name}.js`), context, { filename: `${origin}/calc/${name}.js`, timeout: 15000 });
  }
  assert.equal(needed.size, 0, 'All stat-path scripts must be present in the pinned HTML');
  const actual = vm.runInContext("['Lax','Modest','Adamant','Hardy'].map(n=>[n,calc.calcStat(3,'spa',105,31,0,100,n)])", context);
  assert.equal(JSON.stringify(actual), JSON.stringify([['Lax',246],['Modest',270],['Adamant',221],['Hardy',246]]));
  console.log(origin, actual);
}
