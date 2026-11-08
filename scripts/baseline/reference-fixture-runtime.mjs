import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { inputs, manifest, sha256 } from './emerald-kaizo.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cache = path.join(root, '.baseline-cache/emerald-kaizo');
export const additional = {
  'calc/result.js': 'd963bc0cdc7a3fdebedad48587916d2c9968666b5665daf89d3332c8c551bedd',
  'calc/desc.js': '61fc811cb3f224e1792fefa7667a61aba9ff88d2ea6f33b8748ecbd3b787efaa',
  'calc/items.js': '5e465a9b3c16decf00b404a689510b3ffdaf8864d477061cf6c611f3c811b7d7',
};

export async function referenceRuntime(retrieve = false) {
  const files = await inputs(cache);
  for (const [name, hash] of Object.entries(additional)) {
    const target = path.join(cache, 'reference', name);
    let bytes;
    try { bytes = await readFile(target); }
    catch (error) {
      if (!retrieve || error.code !== 'ENOENT') throw error;
      const url = `https://raw.githubusercontent.com/${manifest.sources.reference.repository}/${manifest.sources.reference.revision}/${name}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: 'error' });
      assert.ok(response.ok, `Pinned fixture source retrieval failed: ${name} (${response.status})`);
      bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha256(bytes), hash, `Pinned reference ${name}`);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    assert.equal(sha256(bytes), hash, `Pinned reference ${name}`);
    files[`reference/${name}`] = bytes.toString('utf8');
  }
  const dataBytes = await readFile(path.join(cache, 'verified/data.json'));
  assert.equal(sha256(dataBytes), manifest.outputs['data.json'], 'Verified data checksum');
  const data = JSON.parse(dataBytes);
  const config = JSON.parse(await readFile(path.join(root, 'baselines/emerald-kaizo/configuration.json')));
  const context = vm.createContext({ TITLE: 'Emerald Kaizo', settings: config.referenceSettings,
    typeChart: data.typeChart, localStorage: config.referenceRuntime.storage,
    window: { baseGame: 'g3' }, console: { log() {}, warn() {} } });
  const modules = new Map();
  function requireModule(name) {
    if (modules.has(name)) return modules.get(name).exports;
    const module = { exports: {} }; modules.set(name, module);
    const source = files[`reference/${name}.js`];
    assert.ok(source, `Missing pinned module ${name}`);
    const dirname = path.posix.dirname(name);
    const localRequire = spec => requireModule(path.posix.normalize(path.posix.join(dirname, spec)));
    const fn = vm.runInContext(`(function(exports, require, module) { ${source}\n})`, context, { filename: name, timeout: 15000 });
    fn(module.exports, localRequire, module);
    return module.exports;
  }
  const { toID } = requireModule('calc/util');
  const gen = { num: 3,
    species: { get: id => data.speciesById[id] },
    moves: { get: id => data.movesById[id] },
    items: { get: id => data.items[id] },
    abilities: { get: id => data.abilities[id] },
    types: { get: id => ({ effectiveness: data.typeChart[Object.keys(data.typeChart).find(k => toID(k) === id)] }) },
    natures: { get: id => Object.entries(data.natures).find(([k]) => toID(k) === id)?.[1] },
  };
  return { data, config, gen, Pokemon: requireModule('calc/pokemon').Pokemon,
    Move: requireModule('calc/move').Move, Field: requireModule('calc/field').Field,
    Stats: requireModule('calc/stats').Stats,
    calculate: requireModule('calc/mechanics/gen3').calculateADV };
}
