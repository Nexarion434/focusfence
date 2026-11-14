// Generates src/_locales/<lang>/messages.json from scripts/i18n/strings.mjs and
// validates the catalog (complete, same placeholders and rich markers, store limits).
// Usage: npm run i18n            (write)
//        node scripts/i18n/build.mjs --check   (validate + verify files are up to date)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S, LANGS } from './strings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LOCALES = path.join(ROOT, 'src/_locales');

export function validate() {
  const errors = [];
  const tokens = (s) => [...s.matchAll(/\$\d/g)].map((m) => m[0]).sort().join(',');
  const markers = (s) => [...s.matchAll(/\{\/?(code|strong|em)\}/g)].map((m) => m[0]).join('');
  for (const [key, row] of Object.entries(S)) {
    if (!/^[A-Za-z0-9_]+$/.test(key)) errors.push(`${key}: invalid key name`);
    for (const lang of LANGS) {
      const v = row[lang];
      if (typeof v !== 'string' || !v.trim()) {
        errors.push(`${key}: missing ${lang}`);
        continue;
      }
      if (tokens(v) !== tokens(row.en)) errors.push(`${key}/${lang}: placeholders ${tokens(v)} ≠ en ${tokens(row.en)}`);
      if (markers(v) !== markers(row.en)) errors.push(`${key}/${lang}: rich markers differ from en`);
      if (/\$(?!\d)/.test(v)) errors.push(`${key}/${lang}: bare "$" (write $$ for a literal dollar)`);
    }
  }
  for (const lang of LANGS) {
    if (S.extName[lang].length > 75) errors.push(`extName/${lang} is ${S.extName[lang].length} chars (max 75)`);
    if (S.extDescription[lang].length > 132) errors.push(`extDescription/${lang} is ${S.extDescription[lang].length} chars (max 132)`);
    if (S.extShortName[lang].length > 12) errors.push(`extShortName/${lang} too long`);
  }
  return errors;
}

export function render(lang) {
  const out = {};
  for (const [key, row] of Object.entries(S)) out[key] = { message: row[lang] };
  return JSON.stringify(out, null, 2) + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = validate();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  const check = process.argv.includes('--check');
  for (const lang of LANGS) {
    const file = path.join(LOCALES, lang, 'messages.json');
    const want = render(lang);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== want) {
        console.error(`${path.relative(ROOT, file)} is out of date — run npm run i18n`);
        process.exit(1);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, want);
    }
  }
  console.log(`${check ? 'checked' : 'wrote'} ${LANGS.length} locales, ${Object.keys(S).length} messages each`);
}
