import { realpathSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const manifest = JSON.parse(await readFile(path.join(root, 'baselines/emerald-kaizo/manifest.json')));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  const sorted = v => Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sorted(v[k])])) : v;
  return JSON.stringify(sorted(value), null, 2) + '\n';
}
export function check(bytes, entry) {
  if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
    throw new Error(`Checksum mismatch: ${entry.source}/${entry.path}; expected SHA-256 ${entry.sha256}. No fallback allowed.`);
  }
}
export async function inputs(cache, retrieve = false) {
  assert.equal(manifest.schemaVersion, 1, 'Unsupported manifest schema');
  const files = {};
  for (const entry of manifest.files) {
    const target = path.join(cache, entry.source, entry.path);
    let bytes;
    try { bytes = await readFile(target); }
    catch (e) {
      if (e.code !== 'ENOENT' || !retrieve) throw new Error(`Missing baseline input: ${target}. Run npm run baseline:fetch; no remote default will be used.`, { cause: e });
      const source = manifest.sources[entry.source];
      assert.match(source.revision, /^[a-f0-9]{40}$/);
      const url = `https://raw.githubusercontent.com/${source.repository}/${source.revision}/${entry.path}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: 'error' });
      if (!response.ok) throw new Error(`Retrieval failed (${response.status}): ${url}. No fallback allowed.`);
      bytes = Buffer.from(await response.arrayBuffer());
      check(bytes, entry);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target + '.tmp', bytes);
      await rename(target + '.tmp', target);
    }
    check(bytes, entry); // Verify every file before any upstream code executes.
    files[`${entry.source}/${entry.path}`] = bytes.toString('utf8');
  }
  return files;
}

// A headless source-capture harness, not a browser or a damage accuracy fixture.
// Ignore ready callbacks and UI decoration; never permit network or storage access.
export function capture(files, stored = {}, search = '?data=ek') {
  const storage = new Proxy({ ...stored, getItem(key) { return this[key] ?? null; }, setItem(key, value) { this[key] = value; } }, {
    set(target, key, value) { target[key] = String(value); return true; },
  });
  const chain = new Proxy({}, { get: () => () => chain });
  const context = vm.createContext({
    URL, URLSearchParams, console: { log() {}, warn() {} },
    window: { location: { search, href: `https://baseline.invalid/${search}` }, history: { replaceState() {} } },
    document: { querySelector() { return null; } }, localStorage: storage, SOURCES: {}, $: () => chain,
    syncSaveReaderControls() {}, cleanString: s => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
  });
  const run = code => vm.runInContext(code, context, { timeout: 15000 });
  const load = p => run(files[`reference/${p}`]);
  run('var calc = exports = {}; function require() { return exports; }');
  for (const p of ['util', 'stats', 'data/species', 'data/moves', 'data/items', 'data/abilities', 'data/types', 'data/natures', 'field']) load(`calc/${p}.js`);
  load('calc/mechanics/util.js');
  load('js/calc_ui/menu_settings.js');
  load('js/initialize.js');
  load('backups/ek2.js');
  load('backups/trainer_orders/ek2.js');
  run(`TITLE = 'Emerald Kaizo'; syncGameScopedSwitchSettings(TITLE); setGameSettings(TITLE);
    setBaseGame(TITLE);
    gen = g = settings.gen; pokedex = calc.SPECIES[gen]; moves = calc.MOVES[9];
    poksData = backup_data.poks; jsonMoves = backup_moves = backup_data.moves;
    applyBackupDataTypeChart(backup_data); loadPoksData(); loadMovesData();
    moves['(No Move)'] = moves['-'] = {bp: 0, category: 'Status', type: 'Normal'};`);
  const result = JSON.parse(run(`JSON.stringify({
    schemaVersion: 1, dataset: 'emerald-kaizo-original',
    settings, panels: {showDex, showAI},
    runtime: {gameGen, mechanics, saveExpansion: save_expansion, baseGame: window.baseGame, baseVersion,
      storage: Object.fromEntries(Object.entries(localStorage).filter(([k,v]) => typeof v !== 'function').map(([k,v]) => [k,String(v)]))},
    data: {species: pokedex, speciesById: SPECIES_BY_ID[8], moves,
      movesById: MOVES_BY_ID[8], items: calc.ITEMS[8], abilities: calc.ABILITIES[8],
      natures: calc.NATURES, typeChart: calc.TYPE_CHART[settings.typeChart],
      trainerSets: backup_data.formatted_sets, trainerOrder: trainerOrders},
    field: new calc.Field(), criticalMultiplier: calc.getCriticalHitMultiplier({num: 8})
  })`));
  assert.equal(Object.values(result.data.trainerSets).reduce((n, sets) => n + Object.keys(sets).length, 0), 1744);
  assert.equal(result.criticalMultiplier, 2, 'Effective critical multiplier changed');
  return result;
}

export async function verify(cache, retrieve = false) {
  const files = await inputs(cache, retrieve);
  const result = capture(files);
  const config = JSON.parse(await readFile(path.join(root, 'baselines/emerald-kaizo/configuration.json')));
  assert.deepEqual(result.settings, config.referenceSettings, 'Effective reference settings changed');
  assert.deepEqual(result.panels, config.panels, 'Reference panels changed');
  assert.deepEqual(result.field, config.field, 'Ordinary field defaults changed');
  assert.deepEqual(result.runtime, config.referenceRuntime, 'Effective integration/storage defaults changed');
  const outputs = { 'data.json': { schemaVersion: 1, dataset: result.dataset, ...result.data }, 'effective-settings.json': config };
  for (const [name, value] of Object.entries(outputs)) {
    const bytes = canonical(value);
    assert.equal(sha256(bytes), manifest.outputs[name], `Derived ${name} checksum mismatch`);
  }
  // Publish only after the entire input set and both derived outputs pass.
  await rm(path.join(cache, 'verified'), { recursive: true, force: true });
  await mkdir(path.join(cache, 'verified'), { recursive: true });
  for (const [name, value] of Object.entries(outputs)) await writeFile(path.join(cache, 'verified', name), canonical(value));
  return result;
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  try {
    assert.ok(['fetch', 'verify'].includes(mode) && rest.length === 0, 'Usage: node scripts/baseline/emerald-kaizo.mjs fetch|verify');
    const cache = path.join(root, '.baseline-cache/emerald-kaizo');
    // Invalidate a previous success even when this run fails on missing input.
    await rm(path.join(cache, 'verified'), { recursive: true, force: true });
    await verify(cache, mode === 'fetch');
    console.log('Verified original/unversioned Emerald Kaizo: 1,744 trainer sets; data and effective settings match manifest.');
  } catch (error) { console.error(`Emerald Kaizo baseline FAILED: ${error.message}`); process.exitCode = 1; }
}
