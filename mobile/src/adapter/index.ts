import { identity } from '../generated/identity';

export { identity };
export type Stats = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
export type PokemonInput = { species: string; level: number; nature: string; ability: string; item: string; itemOn: boolean; ivs: Stats; evs: Stats; boosts: Stats; status: string; currentHp: number; moves: string[] };
export type MoveInput = { name: string; type: string; basePower: number; critical: boolean; hits: number };
export type SideInput = { spikes?: number; isSR?: boolean; isReflect?: boolean; isLightScreen?: boolean; isSeeded?: boolean; isSwitching?: boolean | string; [key: string]: boolean | number | string | undefined };
export type FieldInput = { gameType: 'Singles'; weather: string | null; terrain: null; attackerSide: SideInput; defenderSide: SideInput; [key: string]: unknown };
export type BattleInput = { attacker: PokemonInput; defender: PokemonInput; move: MoveInput; field: FieldInput; configuration: { dataset: string; configurationSha256: string; mechanicsGeneration: number; dataGeneration: number } };
export type Calculation = { rawDamage: number | number[] | number[][]; rangeHp: [number, number]; rangePercent: [number, number]; ko: { chance: number | null; turns: number | null; description: string | null } | null; koError: string | null; attackerStats: Stats; defenderStats: Stats };
export type Outcome = { status: 'success'; value: Calculation; identity: typeof identity } | { status: 'unsupported' | 'error' | 'stale'; message: string };
type Data = { dataset: string; speciesById: Record<string, unknown>; movesById: Record<string, unknown>; items: string[]; abilities: string[]; typeChart: Record<string, unknown>; natures: Record<string, unknown> };
type Engine = typeof import('../generated/engine.js');

const supportedSide = new Set(['spikes', 'isSR', 'isReflect', 'isLightScreen', 'isSeeded', 'isSwitching', 'isForesight']);
const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
export class BattleAdapter {
  private sequence = 0;
  state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  private runtime?: Promise<{ data: Data; engine: Engine }>;
  constructor(private readonly dataUrl = `${import.meta.env.BASE_URL}ek/data.json`) {}
  invalidate() { this.sequence++; }
  private load() {
    if (!this.runtime) {
      this.state = 'loading';
      this.runtime = (async () => {
      const [response, engine] = await Promise.all([fetch(this.dataUrl), import('../generated/engine.js')]);
      if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
      const bytes = await response.arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
      if (digest !== identity.payloadSha256) throw new Error('Pinned data integrity check failed');
      const data = JSON.parse(new TextDecoder().decode(bytes)) as Data;
      if (data.dataset !== identity.dataset || !data.speciesById || !data.movesById || !data.typeChart) throw new Error('Pinned data is incomplete');
      this.state = 'ready';
      return { data, engine };
    })().catch(error => { this.state = 'error'; this.runtime = undefined; throw error; });
    }
    return this.runtime;
  }
  async calculate(input: BattleInput): Promise<Outcome> {
    const sequence = ++this.sequence;
    const stale = (): Outcome => ({ status: 'stale', message: 'A newer calculation superseded this request' });
    try {
      if (input.configuration.dataset !== identity.dataset || input.configuration.configurationSha256 !== identity.configurationSha256 || input.configuration.mechanicsGeneration !== 3 || input.configuration.dataGeneration !== 8 || input.field.gameType !== 'Singles' || input.field.terrain || input.field.inverse || input.field.isInverse || input.field.isInverseBattle) return { status: 'unsupported', message: 'Only the pinned original Emerald Kaizo Singles configuration is supported' };
      const allowedField = new Set(['gameType', 'weather', 'terrain', 'attackerSide', 'defenderSide']);
      if (Object.entries(input.field).some(([k, v]) => !allowedField.has(k) && Boolean(v)) || [input.field.attackerSide, input.field.defenderSide].some(side => Object.entries(side).some(([k,v]) => !supportedSide.has(k) && Boolean(v)))) return {status:'unsupported', message:'Field condition is outside the supported Singles boundary'};
      if (input.field.weather && !['Sun', 'Rain', 'Sand', 'Hail'].includes(input.field.weather)) return {status:'unsupported', message:'Unsupported weather'};
      if (input.move.hits !== 1 && input.move.name !== 'Double Kick') return { status: 'unsupported', message: 'General multi-hit calculations are outside the validated baseline' };
      const { data, engine } = await this.load();
      if (sequence !== this.sequence) return stale();
      const { toID, Pokemon, Move, Field, calculate } = engine;
      for (const p of [input.attacker, input.defender]) {
        if (!Number.isInteger(p.level) || p.level < 1 || p.level > 100 || !Number.isInteger(p.currentHp) || p.currentHp < 0 || stats.some(k => !Number.isInteger(p.ivs[k]) || p.ivs[k] < 0 || p.ivs[k] > 31 || !Number.isInteger(p.evs[k]) || p.evs[k] < 0 || p.evs[k] > 255 || !Number.isInteger(p.boosts[k]) || p.boosts[k] < -6 || p.boosts[k] > 6)) return {status:'error', message:'Invalid Pokémon inputs'};
        if (p.itemOn && p.item && !data.items.some(item => toID(item) === toID(p.item))) return {status:'error', message:`Missing item data: ${p.item}`};
        if (p.ability && toID(p.ability) !== 'teammagmaarmor' && !data.abilities.some(ability => toID(ability) === toID(p.ability))) return {status:'error', message:`Missing ability data: ${p.ability}`};
        if (!data.speciesById[toID(p.species)] || !data.natures[toID(p.nature)] && !Object.keys(data.natures).some(n => toID(n) === toID(p.nature))) return {status:'error', message:`Missing species or nature data: ${p.species} / ${p.nature}`};
      }
      const moveData = data.movesById[toID(input.move.name)] as { multihit?: unknown } | undefined;
      if (!moveData) return {status:'error', message:`Missing move data: ${input.move.name}`};
      if (moveData.multihit && input.move.name !== 'Double Kick') return {status:'unsupported', message:'General multi-hit calculations are outside the validated baseline'};
      if (input.move.name === 'Double Kick' && input.move.hits !== 2 || !moveData.multihit && input.move.hits !== 1) return {status:'error', message:'Hit count does not match the move'};
      if (!input.attacker.currentHp || !input.defender.currentHp) return {status:'unsupported', message:'Zero current HP is not represented by the inherited engine'};
      const gen = { num:3, species:{get:(id:string)=>data.speciesById[id]}, moves:{get:(id:string)=>data.movesById[id]}, items:{get:(id:string)=>(data.items as unknown as Record<string, unknown>)[id]}, abilities:{get:(id:string)=>(data.abilities as unknown as Record<string, unknown>)[id]}, types:{get:(id:string)=>({effectiveness:data.typeChart[Object.keys(data.typeChart).find(k=>toID(k)===id) || '']})}, natures:{get:(id:string)=>Object.entries(data.natures).find(([k])=>toID(k)===id)?.[1]} };
      const pokemon = (p: PokemonInput) => new Pokemon(gen, p.species, {name:p.species, level:p.level, nature:p.nature, ability:p.ability, item:p.itemOn?p.item:'', ivs:p.ivs, evs:p.evs, boosts:p.boosts, status:p.status, curHP:p.currentHp, moves:p.moves});
      const a = pokemon(input.attacker), d = pokemon(input.defender);
      if (input.attacker.currentHp > a.stats.hp || input.defender.currentHp > d.stats.hp) return {status:'error', message:'Current HP exceeds maximum HP'};
      const move = new Move(gen, input.move.name, {isCrit:input.move.critical, overrides:{type:input.move.type, basePower:input.move.basePower}});
      const result = calculate(gen, a, d, move, new Field(input.field));
      let ko = null, koError = null;
      try { const k = result.kochance(); if (k) ko = {chance:k.chance ?? null, turns:k.n ?? null, description:k.text ?? null}; } catch (error) { koError = error instanceof Error ? error.message : String(error); }
      const rangeHp: [number, number] = result.range();
      const rangePercent = rangeHp.map(hp => Math.round(1000 * hp / d.stats.hp) / 10) as [number, number];
      return {status:'success', identity, value:{rawDamage:result.damage, rangeHp, rangePercent, ko, koError, attackerStats:a.stats, defenderStats:d.stats}};
    } catch (error) { return sequence !== this.sequence ? stale() : {status:'error', message:error instanceof Error ? error.message : String(error)}; }
  }
}
