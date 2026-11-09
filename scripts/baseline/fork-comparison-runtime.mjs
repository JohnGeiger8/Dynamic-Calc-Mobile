import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { manifest, sha256 } from './emerald-kaizo.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cache = path.join(root, '.baseline-cache/emerald-kaizo');

export async function forkRuntime() {
  const dataBytes = await readFile(path.join(cache, 'verified/data.json'));
  assert.equal(sha256(dataBytes), manifest.outputs['data.json'], 'Pinned data checksum');
  const data = JSON.parse(dataBytes);
  const configBytes = await readFile(path.join(root, 'baselines/emerald-kaizo/configuration.json'));
  assert.equal(sha256(configBytes), manifest.outputs['effective-settings.json'], 'Pinned configuration checksum');
  const config = JSON.parse(configBytes);
  const context = vm.createContext({ TITLE: 'Emerald Kaizo', settings: config.referenceSettings,
    typeChart: data.typeChart, type_chart: 3, damageGen: 3, invert: false,
    window: { location: { search: '?dmgGen=3' } }, URLSearchParams,
    localStorage: config.referenceRuntime.storage, console: { log() {}, warn() {} } });
  const modules = new Map();
  function loadSync(name) {
    // calc/calc.js imports every generation eagerly. Only its Gen 3 dispatch is in scope.
    if (/^calc\/mechanics\/gen(?:12|4|56|78)$/.test(name)) return {};
    if (modules.has(name)) return modules.get(name).exports;
    const source = sourceFiles.get(name);
    assert.ok(source, `Missing fork calculation module ${name}`);
    const module = { exports: {} }; modules.set(name, module);
    const dirname = path.posix.dirname(name);
    const localRequire = spec => loadSync(path.posix.normalize(path.posix.join(dirname, spec)));
    const fn = vm.runInContext(`(function(exports, require, module) { ${source}\n})`, context, { filename: name, timeout: 15000 });
    fn(module.exports, localRequire, module);
    return module.exports;
  }
  const sourceFiles = new Map();
  for (const name of ['util', 'stats', 'pokemon', 'move', 'field', 'items', 'result', 'desc', 'calc',
    'mechanics/util', 'mechanics/gen3']) {
    sourceFiles.set(`calc/${name}`, await readFile(path.join(root, `calc/${name}.js`), 'utf8'));
  }
  const { toID } = loadSync('calc/util');
  const gen = { num: 3,
    species: { get: id => data.speciesById[id] },
    moves: { get: id => data.movesById[id] },
    items: { get: id => data.items[id] },
    abilities: { get: id => data.abilities[id] },
    types: { get: id => ({ effectiveness: data.typeChart[Object.keys(data.typeChart).find(k => toID(k) === id)] }) },
    natures: { get: id => Object.entries(data.natures).find(([k]) => toID(k) === id)?.[1] },
  };
  return { data, config, gen,
    Pokemon: loadSync('calc/pokemon').Pokemon,
    Move: loadSync('calc/move').Move,
    Field: loadSync('calc/field').Field,
    calculate: loadSync('calc/calc').calculate };
}

export function runForkCase(runtime, fixture) {
  const { gen, Pokemon, Move, Field, calculate } = runtime;
  const { attacker, defender, move, field } = fixture.inputs;
  const pokemon = input => new Pokemon(gen, input.species, {
    name: input.species, level: input.level, nature: input.nature, ability: input.ability,
    item: input.itemOn ? input.item : '', ivs: input.ivs, evs: input.evs,
    boosts: input.boosts, status: input.status, curHP: input.currentHp, moves: input.moves,
  });
  const a = pokemon(attacker);
  const d = pokemon(defender);
  const m = new Move(gen, move.name, { isCrit: move.critical,
    overrides: { type: move.type, basePower: move.basePower } });
  const f = new Field(field);
  const result = calculate(gen, a, d, m, f);
  let ko = null, koError = null;
  try { ko = result.kochance(); } catch (error) { koError = error.message; }
  return { rawDamage: result.damage, rangeHp: result.range(),
    ko: ko && { chance: ko.chance ?? null, turns: ko.n ?? null, description: ko.text ?? null },
    koError, attackerStats: a.stats, defenderStats: d.stats };
}
