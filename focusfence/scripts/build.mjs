// Builds the store package: dist/focusfence/ (unpacked) + dist/focusfence-<version>.zip
// - copies src/ and flips DEV to false (no "Simulate Pro", real ExtensionPay calls)
// - writes a deterministic zip with Node's zlib (no external zip binary needed)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SRC } from './launch.mjs';
import { writeZip } from './zip.mjs';

const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'focusfence');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const ZIP = path.join(DIST, `focusfence-${manifest.version}.zip`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(SRC, OUT, { recursive: true, filter: (p) => !/(^|\/)\.|\.map$/.test(path.relative(SRC, p)) });

const cfgPath = path.join(OUT, 'config.js');
const cfg = fs.readFileSync(cfgPath, 'utf8');
const prodCfg = cfg.replace(/DEV:\s*true/, 'DEV: false');
if (prodCfg === cfg && !/DEV:\s*false/.test(cfg)) throw new Error('could not flip DEV flag in config.js');
fs.writeFileSync(cfgPath, prodCfg);

// sanity checks for store review
const mf = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
if (mf.host_permissions && mf.host_permissions.length) throw new Error('unexpected host_permissions in manifest');
for (const size of Object.values(mf.icons)) {
  if (!fs.existsSync(path.join(OUT, size))) throw new Error('missing icon ' + size);
}

function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
    .sort();
}

const files = walk(OUT);
fs.rmSync(ZIP, { force: true });
writeZip(files, OUT, ZIP);
console.log(`built ${path.relative(ROOT, ZIP)} (${files.length} files, ${(fs.statSync(ZIP).size / 1024).toFixed(1)} KB)`);
for (const f of files) console.log('  ' + path.relative(OUT, f));
