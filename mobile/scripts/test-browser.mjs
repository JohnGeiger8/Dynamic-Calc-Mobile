import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const chrome = process.env.CHROME_BIN || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4177', '--strictPort'], {stdio:'pipe'});
const profile = await mkdtemp(path.join(tmpdir(), 'ek-browser-'));
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timed out')), 10000); server.stdout.on('data', data => { if (String(data).includes('Local:')) {clearTimeout(timer); resolve();} }); server.on('exit', code => reject(new Error(`Vite exited ${code}`))); });
  const {stdout} = await promisify(execFile)(chrome, ['--headless', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--virtual-time-budget=15000', '--dump-dom', 'http://127.0.0.1:4177/Dynamic-Calc-Mobile/mobile/test/fixtures.html'], {timeout:30000, maxBuffer: 2_000_000});
  const result = stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
  if (!result?.startsWith('PASS 30 cases')) throw new Error(`Browser fixture failure: ${result || 'no result'}`);
  console.log(result);
} finally { server.kill(); await rm(profile, {recursive:true, force:true}); }
