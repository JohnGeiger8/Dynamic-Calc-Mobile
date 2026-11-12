import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ResultsPanel } from '../src/ResultsPanel';
import type { Combatant, Side } from '../src/Battle';
import { BattleAdapter } from '../src/adapter';
import type { BattleInput, Outcome } from '../src/adapter';
import fixtures from '../../baselines/emerald-kaizo/reference-fixtures.json';

const root=createRoot(document.querySelector('#root')!);
const output=document.querySelector('#result')!;
const adapter=new BattleAdapter();
const runtime=await adapter.load();
const errors:string[]=[];
const check=(condition:unknown,message:string)=>{if(!condition) errors.push(message);};
const pause=()=>new Promise(resolve=>setTimeout(resolve,10));
const wait=async(test:()=>boolean)=>{for(let n=0;n<200;n++){if(test()) return; await pause();} throw Error(`Timed out: ${document.querySelector('#root')?.textContent}`);};
const render=(sides:Partial<Record<Side,Combatant>>,editing=false,source:Pick<BattleAdapter,'calculate'|'invalidate'>=adapter)=>flushSync(()=>root.render(<ResultsPanel sides={sides} editing={editing} runtime={runtime} adapter={source}/>));
const text=()=>document.querySelector('#root')!.textContent || '';
const click=(name:string)=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===name);if(!button) throw Error(`Missing button ${name}`);flushSync(()=>button.click());};
const combatant=(p:typeof fixtures.cases[number]['inputs']['attacker'],move:string):Combatant=>({...p,moves:[move,'','',''],critical:[false,false,false,false]});
try {
  // Both pinned cases use the clean field exposed by this screen.
  for (const [index,direction] of [[1,'Your attacks'],[21,'Opponent attacks']] as const) {
    const fixture=fixtures.cases[index];
    const attacker=combatant(fixture.inputs.attacker,fixture.inputs.move.name), defender=combatant(fixture.inputs.defender,'');
    const sides=direction==='Your attacks'?{your:attacker,opponent:defender}:{your:defender,opponent:attacker};
    render(sides); click(direction);
    await wait(()=>text().includes(fixture.expected.rangePercent.join('–')+'%'));
    check(text().includes(fixture.expected.ko!.description!),`${fixture.id}: KO text`);
    check(document.querySelectorAll('.result-row').length===4,`${fixture.id}: four slots`);
    const detail=document.querySelector('details')!; detail.open=true;
    check(detail.textContent!.includes(fixture.expected.rangeHp.join('–')+' HP'),`${fixture.id}: HP range`);
    check(detail.textContent!.includes(JSON.stringify(fixture.expected.rawDamage)),`${fixture.id}: rolls`);
  }
  const fixture=fixtures.cases[1];
  const a=combatant(fixture.inputs.attacker,'Rock Slide'), d=combatant(fixture.inputs.defender,'');
  const sides={your:a,opponent:d}; render(sides); click('Your attacks'); await wait(()=>text().includes('100–120%'));
  const before=structuredClone(sides); click('Opponent attacks'); click('Your attacks'); check(JSON.stringify(sides)===JSON.stringify(before),'Direction changed combatants or exact HP');
  render(sides,true); check(text().includes('Results unavailable while editing')&&!text().includes('100–120%'),'Editing showed old results');
  render(sides,false); check(!text().includes('100–120%'),'Cancel briefly showed old results'); await wait(()=>text().includes('100–120%'));
  render({your:a,opponent:{...d,currentHp:0}}); check(text().includes('unavailable at zero HP')&&!text().includes('100–120%'),'Zero HP displayed a result');
  render({your:d,opponent:{...a,moves:['Rock Slide','Aerial Ace','Bullet Seed','']}}); await wait(()=>text().includes('Rock Slide — 120%'));
  check(text().includes('Some moves could not be calculated'),'Opposing maximum omitted unsupported move caveat');
  const mixed={your:{...a,moves:['Swords Dance','Bullet Seed','','Return']},opponent:d}; render(mixed); await wait(()=>text().includes('General multi-hit'));
  check(text().includes('Status move')&&text().includes('Empty move slot')&&text().includes('Unsupported')&&text().includes('additional inputs'),'Missing explicit move states');
  // Keep damage percentage fixed while current HP changes the KO description.
  const f=fixtures.cases[16], attacker={...combatant(f.inputs.attacker,'Aerial Ace'),critical:[true,false,false,false]}, defender=combatant(f.inputs.defender,'');
  render({your:attacker,opponent:defender}); await wait(()=>text().includes(f.expected.rangePercent.join('–')+'%'));
  const full=text(); render({your:attacker,opponent:{...defender,currentHp:1}}); await wait(()=>text().includes(f.expected.rangePercent.join('–')+'%'));
  check(text().includes('guaranteed OHKO')&&full.includes(f.expected.ko!.description!)&&!full.includes('guaranteed OHKO'),'Current HP KO description');
  // A deliberately non-cooperative adapter resolves old requests after newer ones.
  const pending:{input:BattleInput;resolve:(o:Outcome)=>void}[]=[];
  const delayed={calculate:(input:BattleInput)=>new Promise<Outcome>(resolve=>pending.push({input,resolve})),invalidate:()=>{}};
  const first={your:a,opponent:d}; render(first,false,delayed); await wait(()=>pending.length===1);
  const newer={your:{...a,moves:['Aerial Ace','','','']},opponent:d}; render(newer,false,delayed); await wait(()=>pending.length===2);
  const latest={your:{...a,moves:['Thunderbolt','','','']},opponent:d}; render(latest,false,delayed); await wait(()=>pending.length===3);
  const realLatest=await adapter.calculate(pending[2].input); pending[2].resolve(realLatest); await wait(()=>text().includes('Thunderbolt'));
  const realNew=await adapter.calculate(pending[1].input); pending[1].resolve(realNew);
  const realOld=await adapter.calculate(pending[0].input); pending[0].resolve(realOld); await pause();
  check(text().includes('Thunderbolt')&&!text().includes('Rock Slide')&&!text().includes('Aerial Ace'),'Superseded async outcome replaced latest result');
  render(latest,true,delayed); check(text().includes('Results unavailable while editing')&&!text().includes('Thunderbolt'),'Pending edit displayed results');
  render(latest,false,delayed); await wait(()=>pending.length===4);
  render(latest,true,delayed); const canceled=await adapter.calculate(pending[3].input); pending[3].resolve(canceled); await pause();
  check(text().includes('Results unavailable while editing')&&!text().includes('Thunderbolt'),'Canceled async outcome became visible');
  const failing={calculate:async()=>{throw new Error('test failure');},invalidate:()=>{}};
  render(sides,false,failing); await wait(()=>text().includes('Calculation unavailable: test failure'));
  root.unmount();
  output.textContent=errors.length?`FAIL ${errors.join('; ')}`:'PASS rendered pinned cases in both directions, HP, move states and superseded async results';
} catch(e) {output.textContent=`FAIL ${e instanceof Error?e.stack:String(e)}`;}
document.title=output.textContent.startsWith('PASS')?'PASS':'FAIL';
