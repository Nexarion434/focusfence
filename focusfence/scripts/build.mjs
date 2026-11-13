// Builds the store package: dist/focusfence/ (unpacked) + dist/focusfence-<version>.zip
// - copies src/ and flips DEV to false (no "Simulate Pro", real ExtensionPay calls)
// - writes a deterministic zip with Node's zlib (no external zip binary needed)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, SRC } from './launch.mjs';

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

function writeZip(files, baseDir, target) {
  const chunks = [];
  const central = [];
  let offset = 0;
  // fixed timestamp (1980-01-01) so builds are reproducible
  const dosTime = 0;
  const dosDate = (0 << 9) | (1 << 5) | 1;
  for (const file of files) {
    const name = Buffer.from(path.relative(baseDir, file).split(path.sep).join('/'));
    const data = fs.readFileSync(file);
    const crc = zlib.crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, name, body);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(method, 10);
    cen.writeUInt16LE(dosTime, 12);
    cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += local.length + name.length + body.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(target, Buffer.concat([...chunks, cenBuf, end]));
}

const files = walk(OUT);
fs.rmSync(ZIP, { force: true });
writeZip(files, OUT, ZIP);
console.log(`built ${path.relative(ROOT, ZIP)} (${files.length} files, ${(fs.statSync(ZIP).size / 1024).toFixed(1)} KB)`);
for (const f of files) console.log('  ' + path.relative(OUT, f));
