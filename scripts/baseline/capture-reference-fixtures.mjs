import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { additional, referenceRuntime } from './reference-fixture-runtime.mjs';
import { canonical, manifest, sha256 } from './emerald-kaizo.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = path.join(root, 'baselines/emerald-kaizo/reference-fixtures.json');
const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const legacy = { hp: 'hp', at: 'atk', df: 'def', sa: 'spa', sd: 'spd', sp: 'spe' };
const all = value => Object.fromEntries(stats.map(stat => [stat, value]));
const trainer = (species, label) => ({ species, trainer: label });
const custom = (species, options = {}) => ({ species, ...options });
const cases = [
  { id: 'EK4-01', purpose: 'Brick Break removes Reflect', a: trainer('Anorith', 'Leader Roxanne'), d: custom('Geodude'), move: 'Brick Break', field: { defenderSide: { isReflect: true } }, audit: ['EK-AUDIT-06'] },
  { id: 'EK4-02', purpose: 'Reverse physical attack into a dual-type trainer', a: custom('Geodude'), d: trainer('Anorith', 'Leader Roxanne'), move: 'Rock Slide', audit: ['EK-AUDIT-03', 'EK-AUDIT-07'] },
  { id: 'EK4-03', purpose: 'Explosion defense handling', a: trainer('Camerupt', 'Mt. Chimney'), d: custom('Geodude', { level: 36 }), move: 'Explosion', audit: ['EK-AUDIT-06'] },
  { id: 'EK4-04', purpose: 'Choice Band Weather Ball in clear weather', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', audit: ['EK-AUDIT-05', 'EK-AUDIT-06'] },
  { id: 'EK4-05', purpose: 'Weather Ball in rain', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', field: { weather: 'Rain' }, audit: ['EK-AUDIT-06'] },
  { id: 'EK4-06', purpose: 'Weather Ball in sun', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', field: { weather: 'Sun' }, audit: ['EK-AUDIT-06'] },
  { id: 'EK4-07', purpose: 'Weather Ball in sand', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', field: { weather: 'Sand' }, audit: ['EK-AUDIT-06'] },
  { id: 'EK4-08', purpose: 'Pursuit while defender switches', a: trainer('Crawdaunt', 'Ranger Jackson'), d: custom('Gardevoir', { level: 45 }), move: 'Pursuit', field: { defenderSide: { isSwitching: 'out' } }, audit: ['EK-AUDIT-06'] },
  { id: 'EK4-09', purpose: 'Pursuit without switching', a: trainer('Crawdaunt', 'Ranger Jackson'), d: custom('Gardevoir', { level: 45 }), move: 'Pursuit', audit: ['EK-AUDIT-06'] },
  { id: 'EK4-10', purpose: 'Pain Split at unequal current HP', a: trainer('Duskull', 'Ruin Maniac Bryan'), d: custom('Geodude', { level: 30, hpFraction: 0.5 }), move: 'Pain Split', audit: ['EK-AUDIT-06'] },
  { id: 'EK4-11', purpose: 'Huge Power and Return base-power override', a: trainer('Azumarill', 'Guitarist Beth'), d: custom('Geodude', { level: 47 }), move: 'Return', audit: ['EK-AUDIT-02', 'EK-AUDIT-05'] },
  { id: 'EK4-12', purpose: 'Magnitude fixed UI base power', a: trainer('Barboach', 'Rusturf Tunnel'), d: custom('Geodude'), move: 'Magnitude', audit: ['EK-AUDIT-02'] },
  { id: 'EK4-13', purpose: 'Typed Hidden Power Water', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Geodude', { level: 71 }), move: 'Hidden Power Water', audit: ['EK-AUDIT-09'] },
  { id: 'EK4-14', purpose: 'Generic Hidden Power from default explicit IVs', a: trainer('Electabuzz', 'Expert Edgar'), d: custom('Geodude', { level: 88 }), move: 'Hidden Power', audit: ['EK-AUDIT-09'] },
  { id: 'EK4-15', purpose: 'Generic Hidden Power from trainer IVs', a: trainer('Unown', 'Psychic Brandi'), d: custom('Geodude', { level: 23 }), move: 'Hidden Power', audit: ['EK-AUDIT-09'] },
  { id: 'EK4-16', purpose: 'Double Kick per-hit roll matrix', a: trainer('Combusken', 'Battle Girl Lilith'), d: custom('Geodude', { level: 16 }), move: 'Double Kick', audit: ['EK-AUDIT-08'] },
  { id: 'EK4-17', purpose: 'Critical hit bypasses Reflect', a: trainer('Anorith', 'Leader Roxanne'), d: custom('Geodude'), move: 'Aerial Ace', critical: true, field: { defenderSide: { isReflect: true } }, audit: ['EK-AUDIT-05'] },
  { id: 'EK4-18', purpose: 'Negative attack and positive defense boosts', a: trainer('Anorith', 'Leader Roxanne'), d: custom('Geodude', { boosts: { def: 2 } }), move: 'Aerial Ace', aOptions: { boosts: { atk: -2 } }, audit: ['EK-AUDIT-05'] },
  { id: 'EK4-19', purpose: 'Partial-HP KO with residual and Leftovers', a: trainer('Azumarill', 'Guitarist Beth'), d: custom('Geodude', { level: 47, hpFraction: 0.5, item: 'Leftovers' }), move: 'Return', field: { defenderSide: { isSeeded: true } }, audit: ['EK-AUDIT-08'] },
  { id: 'EK4-20', purpose: 'Special attack into Light Screen', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', field: { defenderSide: { isLightScreen: true } }, audit: ['EK-AUDIT-05'] },
  { id: 'EK4-21', purpose: 'Item activation disabled', a: trainer('Castform', 'Camper Beau'), d: custom('Geodude', { level: 40 }), move: 'Weather Ball', aOptions: { itemOn: false }, audit: ['EK-AUDIT-04'] },
  { id: 'EK4-22', purpose: 'Reverse special attack direction', a: custom('Gardevoir', { level: 45 }), d: trainer('Crawdaunt', 'Ranger Jackson'), move: 'Thunderbolt', audit: ['EK-AUDIT-04'] },
  { id: 'EK4-23', purpose: 'Burned physical attacker', a: trainer('Azumarill', 'Guitarist Beth'), d: custom('Geodude', { level: 47 }), move: 'Return', aOptions: { status: 'brn' }, audit: ['EK-AUDIT-05'] },
  { id: 'EK4-24', purpose: 'Fourfold dual-type effectiveness', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Gyarados', { level: 71 }), move: 'Thunder', audit: ['EK-AUDIT-07'] },
  { id: 'EK4-25', purpose: 'Half dual-type effectiveness', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Vileplume', { level: 71 }), move: 'Thunder', audit: ['EK-AUDIT-07'] },
  { id: 'EK4-26', purpose: 'Quarter dual-type effectiveness', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Ludicolo', { level: 71 }), move: 'Hidden Power Water', audit: ['EK-AUDIT-07', 'EK-AUDIT-09'] },
  { id: 'EK4-27', purpose: 'Dual-type immunity', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Whiscash', { level: 71 }), move: 'Thunder', audit: ['EK-AUDIT-07'] },
  { id: 'EK4-28', purpose: 'Twofold dual-type effectiveness', a: trainer('Ampharos', 'Parasol Lady Daphne'), d: custom('Crawdaunt', { level: 71 }), move: 'Thunder', audit: ['EK-AUDIT-07'] },
  { id: 'EK4-29', purpose: 'Normal into Ghost immunity', a: trainer('Azumarill', 'Guitarist Beth'), d: custom('Duskull', { level: 47 }), move: 'Return', audit: ['EK-AUDIT-07'] },
  { id: 'EK4-30', purpose: 'Foresight into Ghost', a: trainer('Azumarill', 'Guitarist Beth'), d: custom('Duskull', { level: 47 }), move: 'Return', field: { defenderSide: { isForesight: true } }, audit: ['EK-AUDIT-07'] },
];

function normalizeStats(source, fallback) {
  return { ...all(fallback), ...Object.fromEntries(Object.entries(source || {}).map(([key, value]) => [legacy[key] || key, value])) };
}

function buildPokemon(runtime, source, override = {}) {
  const { data, gen, Pokemon } = runtime;
  let set = {}, key = null;
  if (source.trainer) {
    const matches = Object.entries(data.trainerSets[source.species] || {}).filter(([label]) => label.includes(source.trainer));
    assert.equal(matches.length, 1, `Unique trainer set: ${source.species} / ${source.trainer}`);
    [key, set] = matches[0];
  }
  const input = {
    species: source.species, trainerSet: key ? { key, trId: set.tr_id, subIndex: set.sub_index } : null,
    level: override.level ?? source.level ?? set.level ?? 50,
    nature: override.nature ?? source.nature ?? set.nature ?? 'Hardy',
    ability: override.ability ?? source.ability ?? set.ability ?? data.species[source.species]?.abilities?.[0] ?? '',
    item: override.item ?? source.item ?? set.item ?? '', itemOn: override.itemOn ?? source.itemOn ?? true,
    ivs: normalizeStats(override.ivs ?? source.ivs ?? set.ivs, 31),
    evs: normalizeStats(override.evs ?? source.evs ?? set.evs, 0),
    boosts: normalizeStats(override.boosts ?? source.boosts, 0),
    status: override.status ?? source.status ?? '',
    moves: override.moves ?? source.moves ?? set.moves ?? ['Tackle'],
  };
  const pokemon = new Pokemon(gen, input.species, { ...input, name: input.species });
  const hpFraction = override.hpFraction ?? source.hpFraction ?? 1;
  input.currentHp = Math.max(1, Math.floor(pokemon.maxHP() * hpFraction));
  pokemon.originalCurHP = input.currentHp;
  input.calculatedStats = { ...pokemon.stats };
  return { input, pokemon };
}

export async function captureFixtures(retrieve = false) {
  const runtime = await referenceRuntime(retrieve);
  const { data, config, gen, Move, Field, Stats, calculate } = runtime;
  const configBytes = await readFile(path.join(root, 'baselines/emerald-kaizo/configuration.json'));
  assert.equal(sha256(configBytes), manifest.outputs['effective-settings.json'], 'Pinned configuration checksum');
  const output = { schemaVersion: 1, dataset: 'emerald-kaizo-original',
    provenance: { repository: manifest.sources.reference.repository, revision: manifest.sources.reference.revision,
      snapshot: 'backups/ek2.js', snapshotSha256: manifest.files.find(f => f.path === 'backups/ek2.js').sha256,
      dataSha256: manifest.outputs['data.json'], configurationSha256: sha256(configBytes),
      extraSourceSha256: additional, licenses: ['reference/calc/LICENSE', 'trainerSource/LICENSE'] },
    conventions: { mechanicsGeneration: 3, dataGeneration: 8, movePickerGeneration: 9,
      damageUnit: 'HP, integer; roll order is reference random factor 85 through 100',
      percentDenominator: 'defender calculated maximum HP', percentRounding: 'one decimal, nearest',
      status: 'empty string means healthy', koText: 'exact pinned-reference Result.kochance().text; chance is a fraction' },
    cases: [] };
  for (const spec of cases) {
    const trainerFirst = spec.a.trainer ? buildPokemon(runtime, spec.a, spec.aOptions) : buildPokemon(runtime, spec.d, spec.dOptions);
    const a = spec.a.trainer ? trainerFirst : buildPokemon(runtime, { ...spec.a, moves: spec.a.moves ?? [spec.move] }, { level: trainerFirst.input.level, ...spec.aOptions });
    const d = spec.d.trainer ? trainerFirst : buildPokemon(runtime, spec.d, { level: trainerFirst.input.level, ...spec.dOptions });
    const moveTable = data.moves[spec.move];
    assert.ok(moveTable, `Unknown UI move ${spec.move}`);
    let moveOptions = { isCrit: !!spec.critical };
    if (spec.move === 'Return') moveOptions.overrides = { basePower: 102 };
    if (spec.move === 'Magnitude') moveOptions.overrides = { basePower: 70 };
    if (spec.move === 'Hidden Power') {
      const inferred = Stats.getHiddenPower(gen, a.input.ivs, true);
      moveOptions.overrides = { type: inferred.type, basePower: inferred.power };
    }
    const move = new Move(gen, spec.move, moveOptions);
    const fieldInput = structuredClone(config.field);
    fieldInput.weather = spec.field?.weather ?? null;
    fieldInput.terrain = null;
    fieldInput.attackerSide.isSwitching = false;
    fieldInput.defenderSide.isSwitching = false;
    for (const side of ['attackerSide', 'defenderSide']) Object.assign(fieldInput[side], spec.field?.[side]);
    const field = new Field(fieldInput);
    const result = calculate(gen, a.pokemon, d.pokemon, move, field);
    const rawDamage = result.damage;
    const rangeHp = result.range();
    let ko = null, note = null;
    try { ko = result.kochance(); } catch (error) { note = `KO API unavailable: ${error.message}`; }
    const maxHp = d.pokemon.maxHP();
    output.cases.push({ id: spec.id, purpose: spec.purpose, auditFindings: spec.audit,
      provenance: { trainerKeys: [a.input, d.input].map(p => p.trainerSet).filter(Boolean), calculation: 'calc/mechanics/gen3.js:calculateADV' },
      inputs: { configuration: { dataset: output.dataset, configurationSha256: output.provenance.configurationSha256,
        mechanicsGeneration: 3, dataGeneration: 8, criticalModel: 5, physicalSpecialSplit: false },
        attacker: a.input, defender: d.input, move: { name: spec.move, type: move.type, basePower: move.bp,
          category: move.category, hits: move.hits, critical: move.isCrit }, field: fieldInput },
      expected: { rawDamage, rangeHp, rangePercent: rangeHp.map(hp => Math.round(1000 * hp / maxHp) / 10),
        ko: ko && { chance: ko.chance ?? null, turns: ko.n ?? null, description: ko.text ?? null },
        uncertainty: spec.move === 'Pain Split' ? `Pinned Gen 3 path returns zero before its Pain Split hook; status effect unresolved. ${note || ''}`.trim() :
          spec.audit.includes('EK-AUDIT-07') || spec.audit.includes('EK-AUDIT-09') ?
            'Reference output recorded; type rounding and/or Hidden Power convention remain unverified against the game.' : note },
    });
  }
  assert.equal(new Set(output.cases.map(c => c.id)).size, output.cases.length, 'Unique fixture IDs');
  for (const fixture of output.cases) {
    assert.equal(fixture.inputs.field.gameType, 'Singles', `${fixture.id} battle format`);
    assert.ok(fixture.inputs.attacker.moves.includes(fixture.inputs.move.name), `${fixture.id} selected attack`);
    assert.equal(fixture.expected.rangeHp.length, 2, `${fixture.id} HP range`);
    const damage = fixture.expected.rawDamage;
    if (Array.isArray(damage)) {
      if (Array.isArray(damage[0])) for (const hit of damage) assert.equal(hit.length, 16, `${fixture.id} hit rolls`);
      else assert.equal(damage.length, 16, `${fixture.id} rolls`);
    } else assert.equal(damage, 0, `${fixture.id} non-damage result`);
  }
  return output;
}

const mode = process.argv[2];
if (mode) {
  try {
    assert.ok(['fetch', 'write', 'verify'].includes(mode), 'Usage: capture-reference-fixtures.mjs fetch|write|verify');
    const output = await captureFixtures(mode === 'fetch');
    if (mode === 'write') await writeFile(destination, canonical(output));
    if (mode === 'verify') assert.equal(canonical(output), await readFile(destination, 'utf8'), 'Fixture capture drift');
    console.log(`${mode}: ${output.cases.length} pinned Emerald Kaizo reference cases`);
  } catch (error) { console.error(`Reference fixture capture failed: ${error.stack}`); process.exitCode = 1; }
}
