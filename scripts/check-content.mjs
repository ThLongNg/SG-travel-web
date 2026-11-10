#!/usr/bin/env node
// Owner: Agent B. Content checker — `npm run check:content`.
//
// Lists:
//   - every "TODO: 要確認" (file:line)
//   - records with `verified: false`
//   - records without `sources` (all collections except phrases)
//   - images without alt text (heroImage → heroAlt, gallery[].src → alt)
//   - image paths that do not exist
//   - leftover fixture records / fixture images
//
// Exit code:
//   1 if any fixture record remains, a source/alt is missing, or an image file is missing
//   0 otherwise (TODO / verified:false are warnings)
//   `--strict` also fails on TODO and verified:false.
//
// No dependencies: the frontmatter is scanned line by line (the Zod schema does the real validation).

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src', 'content');
const assetsDir = join(root, 'src', 'assets', 'content');
const strict = process.argv.includes('--strict');
const TODO = 'TODO: 要確認';

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** @param {string} p */
const rel = (p) => relative(root, p).replaceAll('\\', '/');
/** @param {string} s */
const stripQuotes = (s) =>
  s
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .trim();

const todos = [];
const unverified = [];
const fixtures = [];
const missingSources = [];
const missingAlt = [];
const missingImages = [];

const collections = readdirSync(contentDir).filter((d) =>
  statSync(join(contentDir, d)).isDirectory(),
);

let recordCount = 0;
for (const collection of collections) {
  const files = walk(join(contentDir, collection)).filter((f) =>
    ['.md', '.mdx', '.yml', '.yaml'].includes(extname(f)),
  );
  for (const file of files) {
    recordCount++;
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const isYaml = ['.yml', '.yaml'].includes(extname(file));

    // Frontmatter range (whole file for YAML).
    let fmEnd = lines.length;
    if (!isYaml && lines[0] === '---') {
      const end = lines.indexOf('---', 1);
      fmEnd = end === -1 ? lines.length : end;
    }
    const fm = lines.slice(0, fmEnd);
    const where = rel(file);

    lines.forEach((line, i) => {
      if (line.includes(TODO)) todos.push(`${where}:${i + 1}  ${line.trim().slice(0, 100)}`);
    });

    /** @param {string} key */
    const top = (key) => {
      const re = new RegExp(`^${key}:\\s*(.*)$`);
      for (const l of fm) {
        const m = l.match(re);
        if (m) return stripQuotes(m[1]);
      }
      return undefined;
    };

    if (top('fixture') === 'true') fixtures.push(where);
    if (top('verified') === 'false') unverified.push(where);

    if (collection !== 'phrases') {
      const idx = fm.findIndex((l) => /^sources:/.test(l));
      const inline = idx === -1 ? '' : fm[idx].replace(/^sources:/, '').trim();
      const hasItem =
        idx !== -1 && (inline.startsWith('[') ? inline !== '[]' : /^\s+- /.test(fm[idx + 1] ?? ''));
      const hasUrl = idx !== -1 && fm.slice(idx).some((l) => /url:\s*\S+/.test(l));
      if (!hasItem || !hasUrl) missingSources.push(where);
    }

    // Images: heroImage needs heroAlt; each gallery `src:` needs a sibling `alt:`.
    /** @param {string} value @param {number} lineNo */
    const checkImage = (value, lineNo) => {
      const p = stripQuotes(value);
      if (!p || p.startsWith('http')) return;
      if (!existsSync(resolve(dirname(file), p))) missingImages.push(`${where}:${lineNo}  ${p}`);
    };
    const hero = fm.findIndex((l) => /^heroImage:/.test(l));
    if (hero !== -1) {
      checkImage(fm[hero].replace(/^heroImage:/, ''), hero + 1);
      if (!top('heroAlt')) missingAlt.push(`${where}:${hero + 1}  heroImage`);
    }
    fm.forEach((l, i) => {
      const m = l.match(/^(\s*)- src:\s*(.+)$/);
      if (!m) return;
      checkImage(m[2], i + 1);
      const indent = m[1].length + 2;
      let alt = '';
      for (let j = i + 1; j < fm.length; j++) {
        const next = fm[j];
        const nextIndent = (next.match(/^\s*/) ?? [''])[0].length;
        if (next.trim() === '' || nextIndent < indent || /^\s*- /.test(next)) break;
        const a = next.match(/^\s*alt:\s*(.*)$/);
        if (a) alt = stripQuotes(a[1]);
      }
      if (!alt) missingAlt.push(`${where}:${i + 1}  gallery image`);
    });
  }
}

const fixtureImages = walk(assetsDir)
  .filter((f) => /(^|[\\/])fixture-[^\\/]*$/.test(f))
  .map(rel);

/** @param {string} title @param {string[]} items @param {string} level */
const section = (title, items, level) => {
  const mark = items.length === 0 ? 'OK' : level;
  console.log(`\n[${mark}] ${title} (${items.length})`);
  for (const it of items) console.log(`  - ${it}`);
};

console.log(`check:content — ${recordCount} records in ${collections.length} collections`);
section(`"${TODO}"`, todos, 'WARN');
section('verified: false', unverified, 'WARN');
section('missing sources', missingSources, 'FAIL');
section('images without alt', missingAlt, 'FAIL');
section('image files not found', missingImages, 'FAIL');
section('fixture records (fixture: true)', fixtures, 'FAIL');
section('fixture images in src/assets/content (warning only)', fixtureImages, 'WARN');

const errors = fixtures.length + missingSources.length + missingAlt.length + missingImages.length;
const warnings = todos.length + unverified.length;
if (errors > 0 || (strict && warnings > 0)) {
  console.error(`\n✗ check:content failed: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
console.log(`\n✓ check:content passed with ${warnings} warning(s).`);
