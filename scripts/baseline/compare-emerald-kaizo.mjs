import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest, verify } from './emerald-kaizo.mjs';
import { validateFixtureSchema } from './fixture-schema.mjs';
import { forkRuntime, runForkCase } from './fork-comparison-runtime.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = path.join(root, 'baselines/emerald-kaizo');
const cache = path.join(root, '.baseline-cache/emerald-kaizo');

export function normalizeKoText(value) {
  return value == null ? null : value.replace(/\s+/g, ' ').trim();
}

export function differences(fixture, actual) {
  const expected = fixture.expected;
  const result = [];
  function compare(key, before, after) {
    if (JSON.stringify(before) !== JSON.stringify(after)) result.push({ key, expected: before, actual: after });
  }
  compare('rawDamage', expected.rawDamage, actual.rawDamage);
  compare('rangeHp', expected.rangeHp, actual.rangeHp);
  const percent = actual.rangeHp.map(hp => Math.round(1000 * hp / fixture.inputs.defender.calculatedStats.hp) / 10);
  compare('rangePercent', expected.rangePercent, percent);
  if (expected.ko !== null) {
    compare('ko.chance', expected.ko.chance, actual.ko?.chance ?? null);
    compare('ko.turns', expected.ko.turns, actual.ko?.turns ?? null);
    compare('ko.description', normalizeKoText(expected.ko.description), normalizeKoText(actual.ko?.description));
  }
  return result;
}

export async function compareBaseline(fixturePath = path.join(baseline, 'reference-fixtures.json')) {
  const fixtureText = await readFile(fixturePath, 'utf8');
  const fixtures = JSON.parse(fixtureText);
  const schema = JSON.parse(await readFile(path.join(baseline, 'reference-fixtures.schema.json'), 'utf8'));
  const errors = validateFixtureSchema(fixtures, schema);
  assert.equal(errors.length, 0, `Invalid fixture schema:\n${errors.slice(0, 20).join('\n')}`);
  assert.equal(fixtures.provenance.revision, manifest.sources.reference.revision, 'Fixture reference revision');
  assert.equal(fixtures.provenance.snapshotSha256, manifest.files.find(f => f.path === 'backups/ek2.js').sha256, 'Fixture snapshot');
  assert.equal(fixtures.provenance.dataSha256, manifest.outputs['data.json'], 'Fixture data identity');
  assert.equal(fixtures.provenance.configurationSha256, manifest.outputs['effective-settings.json'], 'Fixture configuration identity');
  assert.equal(new Set(fixtures.cases.map(c => c.id)).size, fixtures.cases.length, 'Duplicate fixture ID');
  const known = JSON.parse(await readFile(path.join(baseline, 'known-comparison-differences.json'), 'utf8'));
  assert.equal(known.schemaVersion, 1, 'Known-difference version');
  const runtime = await forkRuntime();
  const results = [];
  for (const fixture of fixtures.cases) {
    assert.equal(fixture.inputs.configuration.configurationSha256, manifest.outputs['effective-settings.json'], `${fixture.id} configuration`);
    assert.equal(fixture.inputs.configuration.mechanicsGeneration, 3, `${fixture.id} mechanics generation`);
    assert.equal(fixture.inputs.configuration.dataGeneration, 8, `${fixture.id} data generation`);
    assert.equal(fixture.inputs.field.gameType, 'Singles', `${fixture.id} battle format`);
    let actual;
    try { actual = runForkCase(runtime, fixture); }
    catch (error) { throw new Error(`${fixture.id}: fork calculation failed: ${error.message}`, { cause: error }); }
    results.push({ id: fixture.id, differences: differences(fixture, actual), actual });
  }
  for (const [id, detail] of Object.entries(known.cases)) {
    assert.ok(fixtures.cases.some(c => c.id === id), `Stale known-difference ID ${id}`);
    assert.ok(detail.auditFinding && detail.rationale && known.trackingIssue, `Incomplete known-difference annotation ${id}`);
  }
  return { fixtures, known, results };
}

function format(value) { return JSON.stringify(value); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert.ok(args.length === 0 || args.length === 2 && args[0] === '--fixtures', 'Usage: npm run baseline:compare [-- --fixtures path]');
    // One command can start from a clean checkout; retrieval is pinned and verified.
    await verify(cache, true);
    const report = await compareBaseline(args.length ? path.resolve(args[1]) : undefined);
    let failures = 0;
    for (const item of report.results) {
      if (item.differences.length === 0) continue;
      failures += 1;
      const known = report.known.cases[item.id];
      console.error(`${item.id}: ${item.differences.length} mismatch(es)${known ? `; tracked by ${report.known.trackingIssue} / ${known.auditFinding}` : '; untracked'}`);
      for (const diff of item.differences) console.error(`  ${diff.key}: expected ${format(diff.expected)}; actual ${format(diff.actual)}`);
      if (known) console.error(`  Rationale: ${known.rationale}`);
    }
    const stale = Object.keys(report.known.cases).filter(id => !report.results.some(r => r.id === id && r.differences.length));
    for (const id of stale) console.error(`${id}: known-difference annotation is stale; remove or update it`);
    console.log(`Emerald Kaizo fork comparison: ${report.results.length} cases, ${report.results.length - failures} match, ${failures} mismatch, ${stale.length} stale annotations.`);
    if (failures || stale.length) process.exitCode = 1;
  } catch (error) { console.error(`Emerald Kaizo comparison failed: ${error.stack || error}`); process.exitCode = 1; }
}
