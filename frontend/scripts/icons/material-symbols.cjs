#!/usr/bin/env node
/*
 * Material Symbols are rendered from ligatures ("calendar_month" -> icon), so the
 * served font only needs the ligatures the app can display. This script finds
 * every Material Symbols name that appears in `src` (literals, JSX text, data
 * tables such as `logo: 'school'`) and compares it with the subset list.
 *
 *   node scripts/icons/material-symbols.cjs          check (runs before `npm run build`)
 *   node scripts/icons/material-symbols.cjs --write  rewrite material-symbols-used.txt
 *
 * After adding an icon, regenerate the font with
 *   python3 scripts/icons/subset-material-symbols.py
 * (needs `pip install fonttools brotli`). The scan is deliberately broad: any
 * word in the source that is also an icon name is kept, which costs a few
 * unused glyphs but never drops an icon chosen through a variable.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const here = __dirname;
const allNames = new Set(fs.readFileSync(path.join(here, 'material-symbols-all.txt'), 'utf8').split('\n').filter(Boolean));
const usedFile = path.join(here, 'material-symbols-used.txt');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css']);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const required = new Set();
for (const file of walk(path.join(root, 'src'))) {
  for (const word of fs.readFileSync(file, 'utf8').match(/\b[a-z][a-z0-9_]*\b/g) ?? []) {
    if (allNames.has(word)) required.add(word);
  }
}
const sorted = [...required].sort();

if (process.argv.includes('--write')) {
  fs.writeFileSync(usedFile, `${sorted.join('\n')}\n`);
  console.log(`material-symbols: ${sorted.length} icon names written to ${path.relative(root, usedFile)}`);
  process.exit(0);
}

const subset = new Set(fs.existsSync(usedFile) ? fs.readFileSync(usedFile, 'utf8').split('\n').filter(Boolean) : []);
const missing = sorted.filter((name) => !subset.has(name));
if (missing.length) {
  console.error(`material-symbols: ${missing.length} icon(s) used in src are missing from the subset font: ${missing.join(', ')}`);
  console.error('Regenerate it with: python3 scripts/icons/subset-material-symbols.py (pip install fonttools brotli)');
  process.exit(1);
}
console.log(`material-symbols: subset covers all ${sorted.length} icon names used in src`);
