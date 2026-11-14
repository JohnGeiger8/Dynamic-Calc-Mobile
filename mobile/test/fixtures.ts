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
// Active factors come from the engine's description, not from merely selected inputs.
const sceptile = structuredClone(fixtures.cases[21].inputs) as Parameters<BattleAdapter['calculate']>[0];
sceptile.attacker = {...sceptile.attacker, species:'Sceptile', level:100, nature:'Lax', ability:'Overgrow', item:'Miracle Seed', itemOn:true, currentHp:1, moves:['Leaf Blade']};
sceptile.move = {name:'Leaf Blade', type:'Grass', basePower:95, critical:false, hits:1};
const setup = await adapter.load();
const gen = {num:3, species:{get:(id:string)=>setup.data.speciesById[id]}, natures:new setup.engine.Natures()};
const maxHp = new setup.engine.Pokemon(gen, 'Sceptile', {level:100, nature:'Lax', ivs:sceptile.attacker.ivs, evs:sceptile.attacker.evs}).stats.hp as number;
sceptile.attacker.currentHp=maxHp;
const full = await adapter.calculate(sceptile);
sceptile.attacker.currentHp=Math.floor(maxHp/4);
sceptile.attacker.nature='Modest';
const low = await adapter.calculate(sceptile);
if(full.status!=='success' || low.status!=='success') differences.push('Sceptile factor fixture failed');
else {
  if(!full.value.attackerDescription.includes('31 SpA IV') || !full.value.attackerDescription.includes('@Miracle Seed') || full.value.attackerDescription.includes('Overgrow')) differences.push('Inactive Overgrow or active Miracle Seed description incorrect');
  if(!low.value.attackerDescription.includes('Overgrow') || !low.value.attackerDescription.includes('@Miracle Seed')) differences.push('Active Overgrow description incorrect');
}
// Check positive/negative/neutral effects on both sides for every stat and nature.
for (const side of ['attacker','defender'] as const) {
  const input = structuredClone(sceptile);
  input.attacker.currentHp=maxHp;
  input.attacker.nature='Hardy'; input.defender.nature='Hardy';
  const neutral = await adapter.calculate(input);
  if (neutral.status !== 'success') throw Error('Neutral nature setup failed');
  for (const [nature, pair] of Object.entries(setup.data.natures)) {
    const [plus,minus] = pair as string[];
    input[side].nature=nature;
    const result=await adapter.calculate(input);
    if(result.status!=='success') {differences.push(`${side} ${nature}: failed`);continue;}
    for(const stat of ['hp','atk','def','spa','spd','spe'] as const) {
      const multiplier=stat==='hp'||plus===minus?1:stat===plus?1.1:stat===minus?0.9:1;
      if(result.value[`${side}Stats`][stat]!==Math.floor(neutral.value[`${side}Stats`][stat]*multiplier)) differences.push(`${side} ${nature} ${stat}`);
    }
  }
}
if(full.status==='success' && low.status==='success') {
  if(full.value.attackerStats.spa!==246 || low.value.attackerStats.spa!==270) differences.push('Sceptile SpA must be Lax 246 / Modest 270');
  if(!low.value.attackerDescription.includes('+SpA Nature') || full.value.attackerDescription.includes('Nature')) differences.push('Applied nature factor description');
}
for(const [side,stat,positive,negative,move] of [
  ['attacker','atk','Adamant','Modest','Tackle'],
  ['attacker','spa','Modest','Adamant','Leaf Blade'],
  ['defender','def','Bold','Lonely','Tackle'],
  ['defender','spd','Calm','Naughty','Leaf Blade'],
] as const) {
  const input=structuredClone(sceptile);
  input.attacker={...input.attacker,nature:'Hardy',ability:'',item:'',currentHp:maxHp};
  input.defender={...input.attacker};
  const m=setup.data.movesById[setup.engine.toID(move)] as {type:string;basePower:number};
  input.move={name:move,type:m.type,basePower:m.basePower,critical:false,hits:1};
  const maximum:number[]=[];
  for(const nature of [negative,'Hardy',positive]) {
    input[side].nature=nature;
    const result=await adapter.calculate(input);
    if(result.status!=='success') throw Error(`${side} ${stat} damage failed`);
    maximum.push(result.value.rangeHp[1]);
  }
  if(side==='attacker' ? !(maximum[0]<maximum[1]&&maximum[1]<maximum[2]) : !(maximum[0]>maximum[1]&&maximum[1]>maximum[2])) differences.push(`${side} ${stat}: nature damage ordering ${maximum}`);
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
