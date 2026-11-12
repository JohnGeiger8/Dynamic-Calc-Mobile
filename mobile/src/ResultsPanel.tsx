import { useEffect, useRef, useState } from 'react';
import { identity } from './adapter';
import type { BattleAdapter, Outcome } from './adapter';
import type { Combatant, Runtime, Side } from './Battle';

type Sides = Partial<Record<Side, Combatant>>;
type Row = { name:string; type:string; critical:boolean; outcome?:Outcome; label?:string };
type ResultSet = { version:number; your:Row[]; opponent:Row[] };
type Props = { sides:Sides; runtime?:Runtime; adapter:Pick<BattleAdapter, 'calculate' | 'invalidate'> | null; editing:boolean };
const toID = (s:string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');

export function ResultsPanel({sides, runtime, adapter, editing}:Props) {
  const [direction,setDirection]=useState<Side>('your');
  const [results,setResults]=useState<ResultSet>();
  // Invalidate visible results during render, before effects run, including after Cancel.
  const snapshot=useRef({sides, runtime, adapter, editing, version:0});
  if (snapshot.current.sides!==sides || snapshot.current.runtime!==runtime || snapshot.current.adapter!==adapter || snapshot.current.editing!==editing) {
    snapshot.current={sides,runtime,adapter,editing,version:snapshot.current.version+1};
  }
  const version=snapshot.current.version;
  useEffect(()=>{
    let active=true;
    if (!runtime || !adapter || editing || !sides.your || !sides.opponent || !sides.your.currentHp || !sides.opponent.currentHp) return;
    const run=async()=>{
      const calculateSide=async(side:Side):Promise<Row[]>=>{
        const attacker=sides[side]!, defender=sides[side==='your'?'opponent':'your']!;
        const rows:Row[]=[];
        for(let i=0;i<4;i++){
          if(!active) break;
          const name=attacker.moves[i] || '';
          const data=runtime.data.movesById[toID(name)] as {type:string; basePower:number; category:string} | undefined;
          const row:Row={name,type:data?.type || '',critical:attacker.critical[i]};
          if(!name) row.label='Empty move slot';
          else if(!data) row.label='Move data unavailable';
          else if(data.category==='Status') row.label='Status move — no damage calculation';
          else if(!data.basePower) row.label='Unsupported — move power or fixed damage requires additional inputs';
          else {
            try {
              row.outcome=await adapter.calculate({attacker,defender,move:{name,type:data.type,basePower:data.basePower,critical:row.critical,hits:name==='Double Kick'?2:1},field:{gameType:'Singles',weather:null,terrain:null,attackerSide:{},defenderSide:{}},configuration:{dataset:identity.dataset,configurationSha256:identity.configurationSha256,mechanicsGeneration:3,dataGeneration:8}});
            } catch (error) {
              row.outcome={status:'error',message:error instanceof Error?error.message:String(error)};
            }
          }
          rows.push(row);
        }
        return rows;
      };
      const your=await calculateSide('your'); const opponent=await calculateSide('opponent');
      if(active && snapshot.current.version===version) setResults({version,your,opponent});
    };
    void run();
    return ()=>{active=false;adapter.invalidate();};
  },[runtime,sides,editing,adapter,version]);
  const available=!editing&&results?.version===version ? results : undefined;
  const opposing=available?.opponent.filter(r=>r.outcome?.status==='success') || [];
  const maximum=opposing.reduce<Row | undefined>((best,row)=>!best || (row.outcome?.status==='success' && best.outcome?.status==='success' && row.outcome.value.rangePercent[1]>best.outcome.value.rangePercent[1])?row:best,undefined);
  const unavailable=editing?'Results unavailable while editing.':!sides.your||!sides.opponent?'Select both Pokémon to compare.':sides.your.currentHp===0||sides.opponent.currentHp===0?'Calculations are unavailable at zero HP.':'Calculating results…';
  return <section className="results" aria-labelledby="results-heading"><p className="eyebrow">RESULTS</p><h2 id="results-heading">Damage comparison</h2>
    <nav className="directions" aria-label="Attack direction">{(['your','opponent'] as const).map(side=><button key={side} aria-pressed={direction===side} onClick={()=>setDirection(side)}>{side==='your'?'Your attacks':'Opponent attacks'}</button>)}</nav>
    {!available?<p role="status">{unavailable}</p>:<><div className="result-list">{available[direction].map((row,i)=><article className="result-row" key={i}>
      <h3>{row.name || `Move ${i+1}: empty`}{row.type && ` · ${row.type}`}</h3>
      {row.label?<p>{row.label}</p>:row.outcome?.status==='success'?<><p>{row.outcome.value.rangePercent.join('–')}% of target maximum HP · {row.outcome.value.ko?.description || 'KO description unavailable'}</p>
        <details><summary>Damage details</summary><p>Damage: {row.outcome.value.rangeHp.join('–')} HP. Rolls: {JSON.stringify(row.outcome.value.rawDamage)}.</p><p>Critical setting: {row.critical?'Yes':'No'}. Singles; clear weather; no screens or hazards. KO description uses current HP.</p>{row.outcome.value.koError&&<p>KO details unavailable: {row.outcome.value.koError}</p>}</details></>:<p>{row.outcome?.status==='unsupported'?'Unsupported':'Calculation unavailable'}: {row.outcome?.message}</p>}
    </article>)}</div>{direction==='your'&&<p className="opposing">Maximum calculated opposing damage among displayed damaging moves: {maximum?.outcome?.status==='success'?`${maximum.name} — ${maximum.outcome.value.rangePercent[1]}% of your maximum HP`:'unavailable'}. {opposing.length<available.opponent.filter(r=>r.name && !r.label?.startsWith('Status')).length?'Some moves could not be calculated.':''}</p>}</>}
  </section>;
}
