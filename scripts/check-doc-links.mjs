import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['AGENTS.md', 'README.md'];

async function collect(dir) {
  for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(relative);
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative);
  }
}

await collect('docs');
for (const dir of ['calc', 'scripts/baseline']) {
  files.push(path.join(dir, 'AGENTS.md'));
}

let links = 0;
const errors = [];
for (const file of files) {
  const source = await readFile(path.join(root, file), 'utf8');
  // These guides use inline Markdown links. External URLs and mail links have separate owners.
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:[a-z]+:|\/\/)/i.test(target)) continue;
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(target));
    if (!resolved.startsWith(root + path.sep)) {
      errors.push(`${file}: link leaves repository: ${match[1]}`);
      continue;
    }
    try { await stat(resolved); links++; }
    catch { errors.push(`${file}: missing target: ${match[1]}`); }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${links} local targets in ${files.length} Markdown files.`);
}
