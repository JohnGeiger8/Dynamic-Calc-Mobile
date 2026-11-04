import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { capture, inputs, verify, check, manifest, canonical, sha256 } from './emerald-kaizo.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const cache = path.join(root, '.baseline-cache/emerald-kaizo');

test('canonical output does not depend on object insertion order', () => {
  assert.equal(canonical({ b: 1, a: [{ z: 2, a: 3 }] }), canonical({ a: [{ a: 3, z: 2 }], b: 1 }));
});

test('every manifest entry rejects missing/truncated/changed content', async () => {
  const files = await inputs(cache);
  for (const f of manifest.files) {
    const bytes = Buffer.from(files[`${f.source}/${f.path}`]);
    check(bytes, f);
    for (const invalid of [Buffer.alloc(0), bytes.subarray(1), Buffer.from(bytes)]) {
      if (invalid.length === bytes.length) invalid[0] ^= 1;
      assert.throws(() => check(invalid, f), /Checksum mismatch.*No fallback allowed/);
    }
  }
});

test('missing input fails offline; retrieval rejects wrong bytes before caching or executing', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'ek-negative-'));
  const fetchOriginal = globalThis.fetch;
  try {
    await assert.rejects(inputs(temp), /Missing baseline input.*baseline:fetch/);
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from('incorrect snapshot') });
    await assert.rejects(inputs(temp, true), /Checksum mismatch/);
    await assert.rejects(readFile(path.join(temp, 'reference/backups/ek2.js')), { code: 'ENOENT' });
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    await assert.rejects(inputs(temp, true), /Retrieval failed \(404\).*No fallback/);
  } finally { globalThis.fetch = fetchOriginal; await rm(temp, { recursive: true, force: true }); }
});

test('all data and effective settings reproduce the locked output hashes', async () => {
  const r = await verify(cache);
  assert.equal(r.criticalMultiplier, 2);
  assert.deepEqual([r.settings.gen, r.settings.damageGen, r.settings.typeChart, r.settings.switchIn, r.settings.critGen], [8, 3, 3, 3, 5]);
  for (const [name, expected] of Object.entries(manifest.outputs)) {
    assert.equal(sha256(await readFile(path.join(cache, 'verified', name))), expected);
  }
});

test('isolated capture ignores user storage; explicit reference overrides demonstrate why isolation matters', async () => {
  const files = await inputs(cache);
  const clean = capture(files);
  const dirty = capture(files, {
    calcHasEvs: '0', 'calcPhysSpecSplit:Emerald Kaizo': '1',
    'calcInvertTypes:Emerald Kaizo': '1', 'calcSwitchPreview:Emerald Kaizo': '0',
  });
  assert.equal(dirty.settings.hasEvs, false);
  assert.equal(dirty.settings.physSpecSplit, true);
  assert.equal(dirty.settings.invertTypes, true);
  assert.equal(dirty.settings.noSwitch, true);
  assert.deepEqual(capture(files), clean);
  const url = capture(files, {}, '?data=ek&gen=7&critGen=8&dmgGen=6&types=6&noSwitch=1');
  assert.equal(url.settings.gen, 7); // URL changes base pool; EK forces damage/type/crit selectors.
  assert.deepEqual([url.settings.damageGen, url.settings.typeChart, url.settings.critGen], [3, 3, 5]);
  assert.equal(url.settings.noSwitch, true);
});

test('CLI failure removes previous verified outputs and exits nonzero', async () => {
  // A temporary script checkout exercises the real CLI without altering user cache.
  const temp = await mkdtemp(path.join(os.tmpdir(), 'ek-cli-'));
  try {
    for (const file of ['scripts/baseline/emerald-kaizo.mjs', 'baselines/emerald-kaizo/manifest.json']) {
      const target = path.join(temp, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, await readFile(path.join(root, file)));
    }
    const stale = path.join(temp, '.baseline-cache/emerald-kaizo/verified/data.json');
    await mkdir(path.dirname(stale), { recursive: true }); await writeFile(stale, '{}');
    const result = spawnSync(process.execPath, [path.join(temp, 'scripts/baseline/emerald-kaizo.mjs'), 'verify'], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.match(result.stderr, /Missing baseline input/);
    await assert.rejects(readFile(stale), { code: 'ENOENT' });
  } finally { await rm(temp, { recursive: true, force: true }); }
});
