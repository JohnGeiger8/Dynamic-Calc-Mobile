import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BattleAdapter, PokemonInput, Stats } from './adapter';
import { ResultsPanel } from './ResultsPanel';

export type Runtime = Awaited<ReturnType<BattleAdapter['load']>>;
export type Side = 'your' | 'opponent';
export type Combatant = PokemonInput & { critical: boolean[] };
const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const stats = (n: number): Stats => ({hp:n, atk:n, def:n, spa:n, spd:n, spe:n});
const empty = (): Combatant => ({species:'', level:100, nature:'Hardy', ability:'', item:'', itemOn:true, ivs:stats(31), evs:stats(0), boosts:stats(0), status:'', currentHp:1, moves:['','','',''], critical:[false,false,false,false]});
const toID = (s:string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
const statusNames: Record<string,string> = {brn:'Burn', par:'Paralysis', psn:'Poison', tox:'Badly poisoned', slp:'Sleep', frz:'Freeze'};
const validNumber = (n:number, min:number, max:number) => Number.isInteger(n) && n >= min && n <= max;

function maximumHp(p:Combatant, {data,engine}:Runtime): number {
  if (!p.species || !data.speciesById[toID(p.species)] || !validNumber(p.level,1,100) || keys.some(k=>!validNumber(p.ivs[k],0,31)||!validNumber(p.evs[k],0,255))) return 0;
  const gen = {num:3, species:{get:(id:string)=>data.speciesById[id]}, natures:{get:(id:string)=>Object.entries(data.natures).find(([name])=>toID(name)===id)?.[1]}};
  return new engine.Pokemon(gen, p.species, {level:p.level, nature:p.nature, ivs:p.ivs, evs:p.evs}).stats.hp as number;
}

function Picker({label,value,choices,onChange,onPending,optional=false,preferred=[],observed=[]}:{label:string;value:string;choices:string[];onChange:(value:string)=>void;onPending:(pending:boolean)=>void;optional?:boolean;preferred?:string[];observed?:string[]}) {
  const input=useRef<HTMLInputElement>(null); const returningFocus=useRef(false);
  const focusInput=()=>{returningFocus.current=true;input.current?.focus();};
  const [query,setQuery]=useState(value); const [expanded,setExpanded]=useState(false);
  const search=preferred.length && query===value ? '' : query.toLowerCase();
  const listed=[...preferred,...observed.filter(x=>!preferred.some(p=>toID(p)===toID(x)))];
  const matches=[...listed,...choices.filter(x=>!listed.some(p=>toID(p)===toID(x)))].filter(x=>x.toLowerCase().includes(search)).slice(0,50);
  return <div className="picker"><label>{label}<input ref={input} type="search" value={query} autoComplete="off" onFocus={()=>{if(returningFocus.current) returningFocus.current=false; else setExpanded(true);}} onChange={e=>{setQuery(e.target.value);onPending(true);setExpanded(true);}} /></label>
    {expanded && <div className="choices">{optional&&!preferred.length&&<button type="button" onClick={()=>{onChange('');onPending(false);setQuery('');setExpanded(false);focusInput();}}>None</button>}{matches.length ? matches.map(x=><button type="button" key={x} onClick={()=>{onChange(x);onPending(false);setQuery(x);setExpanded(false);focusInput();}}>{preferred.includes(x)?`Ability ${preferred.indexOf(x)+1}: ${x}`:observed.includes(x)?`Used in trainer sets: ${x}`:x}</button>) : <p>No matches. <button type="button" onClick={()=>setQuery('')}>Clear search</button></p>}{optional&&preferred.length>0&&<button type="button" onClick={()=>{onChange('');onPending(false);setQuery('');setExpanded(false);focusInput();}}>None</button>}</div>}</div>;
}

function Editor({initial,runtime,side,onCancel,onDone}:{initial?:Combatant;runtime:Runtime;side:Side;onCancel:()=>void;onDone:(p:Combatant)=>void}) {
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement | null; dialog.current?.querySelector<HTMLElement>('button')?.focus(); return ()=>previous?.focus();},[]);
  const [p,setP]=useState(()=>initial?structuredClone(initial):empty());
  const [tab,setTab]=useState('Basics'); const [attempt,setAttempt]=useState(false);
  const [unselected,setUnselected]=useState<Record<string,boolean>>({});
  const update=(patch:Partial<Combatant>)=>setP(old=>({...old,...patch}));
  const max=maximumHp(p,runtime);
  const valid=!!p.species && !Object.values(unselected).some(Boolean) && validNumber(p.level,1,100) && validNumber(p.currentHp,0,max) && keys.every(k=>validNumber(p.ivs[k],0,31)&&validNumber(p.evs[k],0,255)&&validNumber(p.boosts[k],-6,6));
  const num=(label:string,value:number,change:(n:number)=>void,min:number,max:number)=><label>{label}<input type="number" inputMode="numeric" aria-invalid={max > 0 && !validNumber(value,min,max)} value={Number.isNaN(value)?'':value} min={min} max={max} onChange={e=>change(e.target.value===''?NaN:Number(e.target.value))}/>{max > 0 && !validNumber(value,min,max)&&<span className="error">Enter a whole number from {min} to {max}.</span>}</label>;
  const pending=(field:string)=>(value:boolean)=>setUnselected(old=>({...old,[field]:value}));
  const species=Object.values(runtime.data.speciesById).map(x=>(x as {name:string}).name).sort();
  const abilitiesFor=(name:string)=>Object.values((runtime.data.speciesById[toID(name)] as {abilities?:Record<string,string>} | undefined)?.abilities || {});
  const moves=Object.values(runtime.data.movesById).map(x=>(x as {name:string}).name).sort();
  return <div className="overlay"><section ref={dialog} className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onCancel();} if(e.key==='Tab'){const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])') || []); const first=controls[0], last=controls[controls.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}}}}><header><h2 id="editor-title">Edit {side==='your'?'your Pokémon':'opponent'}</h2><button onClick={onCancel}>Cancel</button></header>
    <nav className="tabs" aria-label="Editor sections">{['Basics','Moves','Stats','Conditions'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</nav>
    <div className="editor-body">
    {tab==='Basics'&&<><Picker label="Species or form" value={p.species} choices={species} onPending={pending('species')} onChange={species=>{const next={...p,species};update({species,currentHp:species === p.species ? p.currentHp : maximumHp(next,runtime),ability:species === p.species ? p.ability : abilitiesFor(species)[0] || ''}); if(species!==p.species)setUnselected(old=>({...old,ability:false}));}}/>{num('Level',p.level,n=>update({level:n}),1,100)}{num(`Current HP (maximum ${max || '—'})`,p.currentHp,n=>update({currentHp:n}),0,max)}<p>Zero HP can be saved, but calculations are unavailable for it.</p><Picker key={p.species} label="Ability" value={p.ability} choices={runtime.data.abilities} preferred={abilitiesFor(p.species)} observed={runtime.data.observedAbilities[toID(p.species)] || []} onPending={pending('ability')} optional onChange={ability=>{setUnselected(old=>({...old,ability:false}));update({ability});}}/><Picker label="Item" value={p.item} choices={runtime.data.items} onPending={pending('item')} optional onChange={item=>{setUnselected(old=>({...old,item:false}));update({item});}}/><label className="check"><input type="checkbox" checked={p.itemOn} onChange={e=>update({itemOn:e.target.checked})}/> Item active</label></>}
    {tab==='Moves'&&p.moves.map((move,i)=><div className="move" key={i}><Picker label={`Move ${i+1}`} value={move} choices={moves} onPending={pending(`move${i}`)} optional onChange={v=>update({moves:p.moves.map((m,j)=>j===i?v:m)})}/><label className="check"><input type="checkbox" checked={p.critical[i]} onChange={e=>update({critical:p.critical.map((v,j)=>j===i?e.target.checked:v)})}/> Critical hit</label></div>)}
    {tab==='Stats'&&<><label>Nature<select value={p.nature} onChange={e=>update({nature:e.target.value})}>{Object.keys(runtime.data.natures).map(n=><option key={n}>{n}</option>)}</select></label>{keys.map(k=><div className="stat" key={k}><strong>{k.toUpperCase()}</strong>{num(`${k.toUpperCase()} IV`,p.ivs[k],n=>update({ivs:{...p.ivs,[k]:n}}),0,31)}{num(`${k.toUpperCase()} EV`,p.evs[k],n=>update({evs:{...p.evs,[k]:n}}),0,255)}</div>)}</>}
    {tab==='Conditions'&&<><label>Status<select value={p.status} onChange={e=>update({status:e.target.value})}><option value="">None</option><option value="brn">Burn</option><option value="par">Paralysis</option><option value="psn">Poison</option><option value="tox">Badly poisoned</option><option value="slp">Sleep</option><option value="frz">Freeze</option></select></label>{keys.filter(k=>k!=='hp').map(k=>num(`${k.toUpperCase()} boost`,p.boosts[k],n=>update({boosts:{...p.boosts,[k]:n}}),-6,6))}</>}
    {attempt&&!valid&&<p role="alert" className="error">Choose a species and enter valid values: level 1–100, HP 0–maximum, IVs 0–31, EVs 0–255, boosts −6–6. Finish any search by selecting a choice.</p>}</div><footer><button onClick={()=>{setAttempt(true);if(valid)onDone(p);}}>Done</button></footer></section></div>;
}

function HpEditor({side, current, max, onCancel, onDone}:{side:Side;current:number;max:number;onCancel:()=>void;onDone:(hp:number)=>void}) {
  const dialog=useRef<HTMLElement>(null);
  const [mode,setMode]=useState<'hp'|'percent'>('hp');
  const [value,setValue]=useState(String(current));
  const [attempt,setAttempt]=useState(false);
  useEffect(()=>{dialog.current?.querySelector<HTMLInputElement>('input')?.focus(); },[]);
  const number=Number(value);
  const valid=value.trim()!=='' && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) && Number.isFinite(number) && number>=0 && number<=(mode==='hp'?max:100) && (mode==='percent'||Number.isInteger(number));
  const hp=valid ? (mode==='hp'?number:Math.round(number*max/100)) : null;
  const switchMode=(next:'hp'|'percent')=>{if(next===mode)return; if(hp!==null) setValue(next==='hp'?String(hp):String(hp/max*100)); else setValue(''); setMode(next);setAttempt(false);};
  return <div className="overlay"><section ref={dialog} className="editor hp-editor" role="dialog" aria-modal="true" aria-labelledby="hp-title" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onCancel();} if(e.key==='Tab'){const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')||[]);if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0]?.focus();}}}}>
    <header><h2 id="hp-title">Edit {side==='your'?'your Pokémon':'opponent'} HP</h2><button onClick={()=>onCancel()}>Cancel</button></header>
    <div className="editor-body"><p>Current HP: {current} / {max}</p><div className="hp-modes" aria-label="HP entry mode"><button type="button" aria-pressed={mode==='hp'} onClick={()=>switchMode('hp')}>Exact HP</button><button type="button" aria-pressed={mode==='percent'} onClick={()=>switchMode('percent')}>Percentage</button></div>
    <label htmlFor="hp-value">{mode==='hp'?'Current HP':'Current HP percentage'}</label><input id="hp-value" type="text" inputMode={mode==='hp'?'numeric':'decimal'} value={value} aria-invalid={!valid} aria-describedby="hp-help hp-error" onChange={e=>setValue(e.target.value)} onFocus={e=>e.currentTarget.scrollIntoView({block:'nearest'})}/>
    <p id="hp-help">{mode==='hp'?`Enter a whole number from 0 to ${max}.`:'Enter 0 to 100. Percentages are rounded to the nearest whole HP; halves round up.'} Zero HP makes calculations unavailable.</p>
    <p id="hp-error" className="error" aria-live="polite">{!valid&&(attempt||value!==String(current))?(mode==='hp'?`Enter a whole number from 0 to ${max}.`:'Enter a number from 0 to 100.'):''}</p>{valid&&mode==='percent'&&<p>Will save {hp} / {max} HP.</p>}</div>
    <footer><button onClick={()=>{setAttempt(true);if(hp!==null)onDone(hp);}}>Done</button></footer></section></div>;
}

export default function Battle() {
  const adapter=useRef<BattleAdapter | null>(null); const hpTrigger=useRef<HTMLElement | null>(null);
  const [runtime,setRuntime]=useState<Runtime>(); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const [sides,setSides]=useState<Partial<Record<Side,Combatant>>>({}); const [editing,setEditing]=useState<Side>(); const [editingHp,setEditingHp]=useState<Side>();
  const load=async()=>{setError('');setLoading(true);try {const {BattleAdapter}=await import('./adapter'); adapter.current ||= new BattleAdapter(); setRuntime(await adapter.current.load());} catch(e){setError(e instanceof Error?e.message:String(e));} finally {setLoading(false);}};
  useEffect(()=>()=>adapter.current?.invalidate(),[]);
  useLayoutEffect(()=>{if(!editingHp && hpTrigger.current){hpTrigger.current.focus();hpTrigger.current=null;}},[editingHp]);
  const edit=(side:Side)=>{adapter.current?.invalidate();setEditing(side);if(!runtime&&!loading)void load();};
  return <div className="shell"><header className="header"><div><p className="eyebrow">DYNAMIC CALC</p><h1>Battle</h1></div><span className="game">Emerald Kaizo</span></header><main id="main"><div className="intro"><p className="eyebrow">MATCHUP</p><h2>Set up your battle</h2><p>Choose both Pokémon to compare their moves.</p></div>
    <div className="combatants">{(['your','opponent'] as const).map(side=>{const p=sides[side];return <section className="card" key={side}><p className="side">{side==='your'?'YOUR SIDE':'OPPOSING SIDE'}</p><h2>{side==='your'?'Your Pokémon':'Opponent'}</h2>{p&&runtime?<div className="summary"><h3>{p.species}</h3><p>Level {p.level} · {statusNames[p.status]||'No status'}</p><button className="hp-trigger" aria-label={`Edit ${side==='your'?'your Pokémon':'opponent'} HP, ${p.currentHp} of ${maximumHp(p,runtime)}`} onClick={e=>{hpTrigger.current=e.currentTarget;adapter.current?.invalidate();setEditingHp(side);}}>HP {p.currentHp}/{maximumHp(p,runtime)}</button><p>Ability: {p.ability||'None'} · Item: {p.item||'None'}{p.item&&!p.itemOn?' (inactive)':''}</p></div>:<p>No Pokémon selected.</p>}<button onClick={()=>edit(side)}>{p?'Edit':'Select Pokémon'}</button></section>})}</div>
    <ResultsPanel sides={sides} runtime={runtime} adapter={adapter.current} editing={!!(editing || editingHp)}/></main><footer><span aria-current="page">Battle</span><a href="../index.html">Desktop calculator</a></footer>
    {editing&&!runtime&&<div className="overlay"><section className="editor" role="dialog" aria-modal="true" aria-label="Emerald Kaizo data"><p role={error?'alert':'status'}>{loading?'Loading verified Emerald Kaizo data…':`Emerald Kaizo data could not load: ${error}`}</p>{error&&<button onClick={()=>void load()}>Retry</button>}<button onClick={()=>setEditing(undefined)}>Cancel</button></section></div>}
    {editingHp&&runtime&&sides[editingHp]&&<HpEditor side={editingHp} current={sides[editingHp]!.currentHp} max={maximumHp(sides[editingHp]!,runtime)} onCancel={()=>setEditingHp(undefined)} onDone={hp=>{adapter.current?.invalidate();setSides(old=>({...old,[editingHp]:{...old[editingHp]!,currentHp:hp}}));setEditingHp(undefined);}}/>}
    {editing&&runtime&&<Editor key={editing} initial={sides[editing]} runtime={runtime} side={editing} onCancel={()=>setEditing(undefined)} onDone={p=>{setSides(s=>({...s,[editing]:p}));setEditing(undefined);}}/>}</div>;
}
