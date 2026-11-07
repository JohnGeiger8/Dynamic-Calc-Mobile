import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const inventoryPath = path.join(root, 'baselines/emerald-kaizo/difference-inventory.json');

function argumentsByName(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    assert.match(key || '', /^--(fork|reference|trainer-source)$/);
    assert.ok(args[index + 1], `Missing path after ${key}`);
    const source = key === '--trainer-source' ? 'trainerSource' : key.slice(2);
    values[source] = path.resolve(args[index + 1]);
  }
  return values;
}

function revision(directory) {
  return execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function filesBelow(directory, relative = '') {
  const result = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(directory, child));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

async function repositoryFileSummary(inventory, directories) {
  const lists = {};
  for (const source of ['fork', 'reference']) {
    lists[source] = (await Promise.all(inventory.repositoryFileSummary.roots.map(
      async rootPath => (await filesBelow(directories[source], rootPath)).map(file => file.replaceAll(path.sep, '/')),
    ))).flat().sort();
  }
  const fork = new Set(lists.fork);
  const reference = new Set(lists.reference);
  const common = lists.fork.filter(file => reference.has(file));
  let commonChanged = 0;
  for (const file of common) {
    if (await sha256(path.join(directories.fork, file)) !== await sha256(path.join(directories.reference, file))) {
      commonChanged += 1;
    }
  }
  return {
    forkOnly: lists.fork.filter(file => !reference.has(file)).length,
    referenceOnly: lists.reference.filter(file => !fork.has(file)).length,
    common: common.length,
    commonChanged,
  };
}

export async function verifyDifferenceInventory(directories) {
  const inventory = JSON.parse(await readFile(inventoryPath));
  for (const source of ['fork', 'reference', 'trainerSource']) {
    assert.ok(directories[source], `Missing --${source === 'trainerSource' ? 'trainer-source' : source}`);
    assert.equal(revision(directories[source]), inventory.sources[source].revision, `${source} revision`);
  }
  for (const entry of inventory.files) {
    const file = path.join(directories[entry.source], entry.path);
    assert.equal(await sha256(file), entry.sha256, `${entry.source}:${entry.path}`);
  }
  const actualSummary = await repositoryFileSummary(inventory, directories);
  for (const [key, value] of Object.entries(actualSummary)) {
    assert.equal(value, inventory.repositoryFileSummary[key], `repository file summary ${key}`);
  }
  const allowed = new Set(['relevant', 'irrelevant-to-baseline', 'requires-investigation']);
  const ids = new Set();
  for (const finding of inventory.findings) {
    assert.match(finding.id, /^EK-AUDIT-\d{2}$/);
    assert.ok(!ids.has(finding.id), `Duplicate finding ${finding.id}`);
    ids.add(finding.id);
    assert.ok(allowed.has(finding.classification), `${finding.id} classification`);
    for (const field of ['category', 'difference', 'likelyEffect', 'evidenceNeeded', 'minimumAction']) {
      assert.ok(finding[field], `${finding.id} missing ${field}`);
    }
    assert.ok(finding.locations.length > 0, `${finding.id} missing locations`);
    assert.ok(finding.candidateFixtures.length > 0, `${finding.id} missing candidate fixtures`);
  }
  return inventory;
}

function summary(inventory) {
  const counts = inventory.findings.reduce((result, finding) => {
    result[finding.classification] = (result[finding.classification] || 0) + 1;
    return result;
  }, {});
  const lines = [
    `Verified ${inventory.findings.length} Emerald Kaizo difference findings against all ${inventory.files.length} locked source files.`,
    `Relevant: ${counts.relevant || 0}; requires investigation: ${counts['requires-investigation'] || 0}; irrelevant to initial baseline: ${counts['irrelevant-to-baseline'] || 0}.`,
  ];
  for (const finding of inventory.findings) {
    lines.push(`${finding.id} [${finding.classification}] ${finding.category}: ${finding.minimumAction}`);
  }
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const inventory = await verifyDifferenceInventory(argumentsByName(process.argv.slice(2)));
    console.log(summary(inventory));
  } catch (error) {
    console.error(`Emerald Kaizo audit verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
