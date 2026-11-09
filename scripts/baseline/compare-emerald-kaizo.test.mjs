import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { compareBaseline, normalizeKoText } from './compare-emerald-kaizo.mjs';
import { validateFixtureSchema } from './fixture-schema.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtureFile = path.join(root, 'baselines/emerald-kaizo/reference-fixtures.json');
const schemaFile = path.join(root, 'baselines/emerald-kaizo/reference-fixtures.schema.json');

test('fixture schema rejects omitted inputs and invalid raw roll values', async () => {
  const schema = JSON.parse(await readFile(schemaFile));
  const fixtures = JSON.parse(await readFile(fixtureFile));
  assert.deepEqual(validateFixtureSchema(fixtures, schema), []);
  delete fixtures.cases[0].inputs.attacker.ivs;
  fixtures.cases[1].expected.rawDamage[0] = 'not damage';
  const errors = validateFixtureSchema(fixtures, schema);
  assert.ok(errors.some(error => error.includes('attacker.ivs: missing')));
  assert.ok(errors.some(error => error.includes('rawDamage')));
});

test('fork executes all cases and matches the pinned Emerald Kaizo reference', async () => {
  const report = await compareBaseline();
  assert.equal(report.results.length, 30);
  for (const id of ['EK4-01', 'EK4-08', 'EK4-16', 'EK4-19']) {
    assert.ok(report.results.some(result => result.id === id), `${id} remains a regression case`);
  }
  const mismatches = report.results.filter(result => result.differences.length).map(result => result.id);
  assert.deepEqual(mismatches, []);
  assert.deepEqual(Object.keys(report.known.cases).sort(), mismatches);
  assert.equal(normalizeKoText('  guaranteed\n2HKO  '), 'guaranteed 2HKO');
});

test('a deliberately changed expected roll fails with its case ID, then the original fixture still compares', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ek-compare-'));
  try {
    const fixtures = JSON.parse(await readFile(fixtureFile));
    const target = fixtures.cases.find(fixture => fixture.id === 'EK4-03');
    target.expected.rawDamage[0] += 1;
    const changed = path.join(temporary, 'changed-fixtures.json');
    await writeFile(changed, JSON.stringify(fixtures));
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./compare-emerald-kaizo.mjs', import.meta.url)), '--fixtures', changed],
      { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /EK4-03: 1 mismatch\(es\); untracked/);
    assert.match(result.stderr, /rawDamage: expected .* actual /);
    const restored = await compareBaseline();
    assert.ok(restored.results.find(item => item.id === 'EK4-03').differences.length === 0);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
