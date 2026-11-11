import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const engine = path.join(root, 'calc');

// The inherited browser scripts use one shared `require()` shim. The path below
// resolves under that shim, but not under a normal CommonJS bundler.
const legacyPath = {
  name: 'legacy-custom-stats-path',
  setup(api) {
    api.onResolve({ filter: /^\.\.\/stats$/ }, args => {
      if (args.importer === path.join(engine, 'mechanics/custom/util.js')) {
        return { path: path.join(engine, 'stats.js') };
      }
      return undefined;
    });
  },
};

const result = await build({
  entryPoints: [path.join(engine, 'index.js')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  write: false,
  metafile: true,
  plugins: [legacyPath],
  logLevel: 'silent',
});

const output = result.outputFiles[0];
assert.ok(output, 'Expected a browser bundle');
assert.match(output.text, /calculate/, 'Expected the inherited calculation API');
assert.ok(Object.keys(result.metafile.inputs).some(file => file.endsWith('calc/index.js')));
console.log(`Browser-target engine bundle: ${output.contents.byteLength} bytes from ${Object.keys(result.metafile.inputs).length} inherited modules`);
console.log('Boundary smoke check passed. Runtime configuration and 30-case comparison remain in issue #17.');
