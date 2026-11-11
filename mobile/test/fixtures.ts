import { BattleAdapter } from '../src/adapter';
import fixtures from '../../baselines/emerald-kaizo/reference-fixtures.json';
const output = document.querySelector('#result')!;
const adapter = new BattleAdapter();
const differences: string[] = [];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const normalize = (s: string | null | undefined) => s == null ? null : s.replace(/\s+/g, ' ').trim();
for (const fixture of fixtures.cases) {
  const result = await adapter.calculate(fixture.inputs as Parameters<BattleAdapter['calculate']>[0]);
  if (result.status !== 'success') { differences.push(`${fixture.id}: ${result.status} ${result.message}`); continue; }
  const actual = result.value, expected = fixture.expected;
  for (const key of ['rawDamage', 'rangeHp', 'rangePercent'] as const) if (!same(actual[key], expected[key])) differences.push(`${fixture.id} ${key}: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`);
  if (expected.ko) {
    for (const key of ['chance', 'turns'] as const) if (!same(actual.ko?.[key] ?? null, expected.ko[key])) differences.push(`${fixture.id} ko.${key}`);
    if (normalize(actual.ko?.description) !== normalize(expected.ko.description)) differences.push(`${fixture.id} ko.description: ${actual.ko?.description} != ${expected.ko.description}`);
  }
}
const broken = await new BattleAdapter('/missing-ek-data').calculate(fixtures.cases[0].inputs as Parameters<BattleAdapter['calculate']>[0]);
if (broken.status !== 'error') differences.push('Missing data did not return error');
const corrupted = await new BattleAdapter(`${import.meta.env.BASE_URL}index.html`).calculate(fixtures.cases[0].inputs as Parameters<BattleAdapter['calculate']>[0]);
if (corrupted.status !== 'error') differences.push('Corrupt data did not return error');
const unsupportedInput = structuredClone(fixtures.cases[0].inputs);
unsupportedInput.field.terrain = 'Electric';
if ((await adapter.calculate(unsupportedInput as Parameters<BattleAdapter['calculate']>[0])).status !== 'unsupported') differences.push('Unsupported terrain was accepted');
const invalid = structuredClone(fixtures.cases[0].inputs);
invalid.defender.currentHp = -1;
if ((await adapter.calculate(invalid as Parameters<BattleAdapter['calculate']>[0])).status !== 'error') differences.push('Invalid HP was accepted');
const zero = structuredClone(fixtures.cases[0].inputs);
zero.defender.currentHp = 0;
if ((await adapter.calculate(zero as Parameters<BattleAdapter['calculate']>[0])).status !== 'unsupported') differences.push('Zero HP was accepted');
const multi = structuredClone(fixtures.cases[0].inputs);
multi.move.name = 'Bullet Seed';
if ((await adapter.calculate(multi as Parameters<BattleAdapter['calculate']>[0])).status !== 'unsupported') differences.push('General multi-hit was accepted');
const delayed = new BattleAdapter();
const first = delayed.calculate(fixtures.cases[0].inputs as Parameters<BattleAdapter['calculate']>[0]);
const second = delayed.calculate(fixtures.cases[1].inputs as Parameters<BattleAdapter['calculate']>[0]);
if ((await first).status !== 'stale' || (await second).status !== 'success') differences.push('Stale result suppression failed');
output.textContent = differences.length ? `FAIL ${differences.length}\n${differences.join('\n')}` : `PASS ${fixtures.cases.length} cases; missing/corrupt data, unsupported/invalid inputs and stale results`;
document.title = differences.length ? 'FAIL' : 'PASS';
