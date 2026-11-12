import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const chrome = process.env.CHROME_BIN || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4177', '--strictPort'], {stdio:'pipe'});
const profile = await mkdtemp(path.join(tmpdir(), 'ek-browser-'));
try {
  const deadline = Date.now() + 15000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try { ready = (await fetch('http://127.0.0.1:4177/Dynamic-Calc-Mobile/mobile/test/fixtures.html')).ok; } catch { /* server is still starting */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error(`Vite did not start (exit ${server.exitCode})`);
  for (const [page, expected] of [['fixtures.html','PASS 30 cases'], ['results.html','PASS rendered pinned cases']]) {
    const {stdout} = await promisify(execFile)(chrome, ['--headless', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--virtual-time-budget=15000', '--dump-dom', `http://127.0.0.1:4177/Dynamic-Calc-Mobile/mobile/test/${page}`], {timeout:30000, maxBuffer: 2_000_000});
    const result = stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
    if (!result?.startsWith(expected)) throw new Error(`Browser ${page} failure: ${result || 'no result'}`);
    console.log(result);
  }
} finally { server.kill(); await rm(profile, {recursive:true, force:true}); }
