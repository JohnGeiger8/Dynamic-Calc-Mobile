import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = new URL('../../', import.meta.url);
const read = p => readFile(new URL(p, root));
const manifest = JSON.parse(await read('baselines/emerald-kaizo/manifest.json'));
const bytes = await read('.baseline-cache/emerald-kaizo/verified/data.json').catch(() => { throw new Error('Pinned data missing: run npm run baseline:fetch from the repository root'); });
const hash = b => createHash('sha256').update(b).digest('hex');
if (hash(bytes) !== manifest.outputs['data.json']) throw new Error('Pinned data checksum mismatch; run npm run baseline:fetch');
const configuration = await read('baselines/emerald-kaizo/configuration.json');
if (hash(configuration) !== manifest.outputs['effective-settings.json']) throw new Error('Pinned configuration checksum mismatch');
const source = JSON.parse(bytes);
// Trainer and Mastersheet content is not needed for calculations.
const data = Object.fromEntries(['dataset', 'speciesById', 'movesById', 'items', 'abilities', 'typeChart', 'natures'].map(k => [k, source[k]]));
const payload = JSON.stringify(data);
await mkdir(new URL('../public/ek/', import.meta.url), { recursive: true });
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/ek/data.json', import.meta.url), payload);
await writeFile(new URL('../src/generated/identity.ts', import.meta.url), `export const identity = ${JSON.stringify({dataset: manifest.dataset.id, sourceRevision: manifest.sources.reference.revision, dataSha256: manifest.outputs['data.json'], payloadSha256: hash(payload), configurationSha256: manifest.outputs['effective-settings.json']})} as const;\n`);
const engine = new URL('../../calc/', import.meta.url).pathname;
await build({stdin: {contents: `export { Pokemon } from '${engine}pokemon.js'; export { Move } from '${engine}move.js'; export { Field } from '${engine}field.js'; export { calculate } from '${engine}calc.js'; export { toID } from '${engine}util.js';`, resolveDir: engine}, bundle:true, platform:'browser', format:'esm', target:'es2022', outfile:new URL('../src/generated/engine.js', import.meta.url).pathname, define: {TITLE: '"Emerald Kaizo"', type_chart:'3', damageGen:'3', invert:'false', 'window.location.search':'"?dmgGen=3"'}, plugins:[{name:'unused-generations', setup(b) { b.onResolve({filter:/^\.\/mechanics\/gen(?:12|4|56|78)$/}, () => ({path:'empty', namespace:'empty'})); b.onLoad({filter:/.*/,namespace:'empty'}, () => ({contents:'module.exports = {}', loader:'js'})); }}]});
console.log(`Prepared verified EK calculation data: ${Buffer.byteLength(payload)} bytes, sha256 ${hash(payload)}`);
