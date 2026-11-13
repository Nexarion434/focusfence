// Pre-submission checks for the Chrome Web Store package.
// Usage: node scripts/cws-check.mjs [path/to.zip]     (default: dist/focusfence-<version>.zip)
// Exits 1 on any error; warnings are printed but don't fail.
//
// Checks (mirrors the usual Chrome Web Store / Chrome loader rejections):
//  - zip readable, CRC-valid, manifest.json at the root, size limits
//  - Manifest V3, valid version, no MV2-only keys, required fields
//  - __MSG_*__ resolvable in every locale; name ≤ 75, short_name ≤ 12, description ≤ 132
//  - icons 16/32/48/128 present, real PNGs with the declared size
//  - every file referenced by the manifest and by HTML <script>/<link> exists
//  - no remotely hosted code: no remote <script>/<link>/@import/url(), no remote
//    importScripts/import(), no eval / new Function, CSP without remote hosts or unsafe-*
//  - no <all_urls> install-time host access; no reserved "_" names except _locales
//  - no junk (dotfiles, source maps, node_modules, tests, scripts)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readZip } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function checkZip(zipPath) {
  const errors = [];
  const warnings = [];
  const info = {};
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const size = fs.statSync(zipPath).size;
  info.zipBytes = size;
  if (size > 2 * 1024 ** 3) err(`zip is ${size} bytes (Chrome Web Store limit is 2 GB)`);
  else if (size > 10 * 1024 ** 2) warn(`zip is ${(size / 1024 ** 2).toFixed(1)} MB; keep it small for review speed`);

  let entries;
  try {
    entries = readZip(zipPath);
  } catch (e) {
    return { errors: ['zip unreadable: ' + e.message], warnings, info };
  }
  const files = new Map(entries.filter((e) => !e.name.endsWith('/')).map((e) => [e.name, e.data]));
  info.files = files.size;
  const text = (n) => files.get(n).toString('utf8');
  const has = (n) => files.has(n.replace(/^\//, ''));

  // ---- file names
  for (const name of files.keys()) {
    const parts = name.split('/');
    if (parts.some((p) => p.startsWith('_') && p !== '_locales')) err(`reserved name (leading "_"): ${name}`);
    if (parts.some((p) => p.startsWith('.'))) err(`hidden file in package: ${name}`);
    if (/(^|\/)(node_modules|tests?|scripts|test-results)\//.test(name)) err(`development file in package: ${name}`);
    if (/\.map$/.test(name)) warn(`source map shipped: ${name}`);
    if (name.includes('\\')) err(`backslash in path: ${name}`);
  }

  // ---- manifest
  if (!has('manifest.json')) return { errors: [...errors, 'manifest.json missing at zip root'], warnings, info };
  let mf;
  try {
    mf = JSON.parse(text('manifest.json'));
  } catch (e) {
    return { errors: [...errors, 'manifest.json is not valid JSON: ' + e.message], warnings, info };
  }
  info.manifest_version = mf.manifest_version;
  if (mf.manifest_version !== 3) err('manifest_version must be 3');
  if (!/^\d{1,5}(\.\d{1,5}){0,3}$/.test(mf.version || '') || String(mf.version).split('.').some((n) => +n > 65535)) {
    err(`invalid version "${mf.version}"`);
  }
  for (const k of ['browser_action', 'page_action', 'background.scripts', 'background.persistent', 'web_accessible_resources(strings)']) {
    const [a, b] = k.split('.');
    if (b && mf[a] && b in mf[a]) err(`MV2-only key: ${k}`);
    if (!b && k in mf) err(`MV2-only key: ${k}`);
  }
  if (mf.web_accessible_resources && mf.web_accessible_resources.some((w) => typeof w === 'string')) err('MV2-style web_accessible_resources');
  if (!mf.background || !mf.background.service_worker) err('background.service_worker missing');
  if ('key' in mf) warn('"key" in manifest: the store assigns its own; remove it for upload');
  if ('update_url' in mf) err('update_url must not be set for Chrome Web Store items');

  // ---- localization
  const locales = [...files.keys()].filter((n) => /^_locales\/[^/]+\/messages\.json$/.test(n)).map((n) => n.split('/')[1]);
  info.locales = locales.sort();
  const messages = {};
  for (const l of locales) {
    try {
      messages[l] = JSON.parse(text(`_locales/${l}/messages.json`));
    } catch (e) {
      err(`_locales/${l}/messages.json invalid JSON`);
    }
  }
  const usesMsg = JSON.stringify(mf).includes('__MSG_');
  if (usesMsg && !mf.default_locale) err('manifest uses __MSG_ but has no default_locale');
  if (mf.default_locale && !messages[mf.default_locale]) err(`default_locale "${mf.default_locale}" has no _locales/${mf.default_locale}/messages.json`);
  if (!mf.default_locale && locales.length) err('_locales present but no default_locale');
  const resolve = (v, l) => {
    const m = /^__MSG_(\w+)__$/.exec(v || '');
    if (!m) return v;
    const msg = (messages[l] && messages[l][m[1]]) || (messages[mf.default_locale] || {})[m[1]];
    if (!msg) err(`${v} not found in locale ${l}`);
    return msg ? msg.message : '';
  };
  for (const l of locales.length ? locales : [null]) {
    const name = resolve(mf.name, l);
    const shortName = resolve(mf.short_name, l);
    const desc = resolve(mf.description, l);
    const tag = l ? ` [${l}]` : '';
    if (!name) err('name missing' + tag);
    else if (name.length > 75) err(`name is ${name.length} chars (max 75)${tag}`);
    if (shortName && shortName.length > 12) warn(`short_name is ${shortName.length} chars (12 recommended)${tag}`);
    if (!desc) err('description missing' + tag);
    else if (desc.length > 132) err(`description is ${desc.length} chars (max 132)${tag}`);
  }

  // ---- icons
  const pngSize = (n) => {
    const b = files.get(n);
    if (!b || b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  };
  const icons = mf.icons || {};
  if (!icons['128']) err('icons.128 missing (required by the Chrome Web Store)');
  for (const [sz, file] of Object.entries({ ...icons, ...Object.fromEntries(Object.entries((mf.action || {}).default_icon || {})) })) {
    if (!has(file)) {
      err(`icon ${sz} missing: ${file}`);
      continue;
    }
    const dim = pngSize(file);
    if (!dim) err(`icon ${file} is not a PNG`);
    else if (dim[0] !== +sz || dim[1] !== +sz) err(`icon ${file} is ${dim.join('x')}, declared ${sz}`);
  }

  // ---- referenced files
  const refs = [
    mf.background && mf.background.service_worker,
    mf.action && mf.action.default_popup,
    mf.options_ui && mf.options_ui.page,
    mf.options_page,
    ...(mf.content_scripts || []).flatMap((c) => [...(c.js || []), ...(c.css || [])]),
    ...(mf.web_accessible_resources || []).flatMap((w) => w.resources || []),
  ].filter(Boolean);
  for (const r of refs) if (!r.includes('*') && !has(r)) err(`manifest references missing file: ${r}`);

  // ---- remote code / resources
  const remote = /^(https?:)?\/\//i;
  for (const [name, data] of files) {
    if (!/\.(js|mjs|html|css)$/.test(name)) continue;
    const src = data.toString('utf8');
    const dir = path.posix.dirname(name);
    if (name.endsWith('.html')) {
      for (const m of src.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
        if (remote.test(m[1])) err(`${name}: remote script ${m[1]}`);
        else if (!has(path.posix.normalize(path.posix.join(dir, m[1])))) err(`${name}: missing script ${m[1]}`);
      }
      for (const m of src.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi)) {
        if (remote.test(m[1])) err(`${name}: remote stylesheet/resource ${m[1]}`);
        else if (/stylesheet/.test(m[0]) && !has(path.posix.normalize(path.posix.join(dir, m[1])))) err(`${name}: missing stylesheet ${m[1]}`);
      }
      if (/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(src)) err(`${name}: inline <script> (blocked by MV3 CSP)`);
    }
    if (name.endsWith('.css')) {
      for (const m of src.matchAll(/url\(\s*["']?([^"')]+)/g)) {
        if (remote.test(m[1])) err(`${name}: remote url() ${m[1]}`);
        else if (!m[1].startsWith('data:') && !has(path.posix.normalize(path.posix.join(dir, m[1])))) err(`${name}: missing asset ${m[1]}`);
      }
      if (/@import\s+(url\()?["']?(https?:)?\/\//.test(src)) err(`${name}: remote @import`);
    }
    if (/\.m?js$/.test(name)) {
      if (/\beval\s*\(/.test(src)) err(`${name}: eval()`);
      if (/\bnew\s+Function\s*\(/.test(src)) err(`${name}: new Function()`);
      if (/importScripts\(\s*["'`](https?:)?\/\//.test(src)) err(`${name}: remote importScripts`);
      if (/\bimport\s*\(\s*["'`](https?:)?\/\//.test(src) || /\bfrom\s+["'](https?:)?\/\//.test(src)) err(`${name}: remote import`);
    }
  }

  // ---- permissions / CSP
  const hostPerms = mf.host_permissions || [];
  if (hostPerms.some((h) => h === '<all_urls>' || h === '*://*/*')) err('install-time access to all sites (<all_urls>)');
  info.permissions = mf.permissions || [];
  info.optional_host_permissions = mf.optional_host_permissions || [];
  const csp = (mf.content_security_policy || {}).extension_pages || '';
  if (/unsafe-eval|unsafe-inline/.test(csp.split(';').find((d) => d.trim().startsWith('script-src')) || '')) err('script-src allows unsafe-*');
  if (/script-src[^;]*https?:/.test(csp)) err('script-src allows a remote host');

  return { errors, warnings, info };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/manifest.json'), 'utf8'));
  const zip = process.argv[2] || path.join(ROOT, 'dist', `focusfence-${mf.version}.zip`);
  const { errors, warnings, info } = checkZip(zip);
  console.log(`Chrome Web Store pre-check: ${path.relative(process.cwd(), zip)}`);
  console.log(`  ${(info.zipBytes / 1024).toFixed(1)} KB, ${info.files} files, MV${info.manifest_version}, locales: ${(info.locales || []).join(', ')}`);
  console.log(`  permissions: ${(info.permissions || []).join(', ')}; optional hosts: ${(info.optional_host_permissions || []).join(', ')}`);
  for (const w of warnings) console.log('  WARN  ' + w);
  for (const e of errors) console.log('  ERROR ' + e);
  console.log(errors.length ? `FAILED (${errors.length} errors)` : 'PASSED');
  process.exit(errors.length ? 1 : 0);
}
