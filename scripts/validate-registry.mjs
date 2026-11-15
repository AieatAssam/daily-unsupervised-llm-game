// Validates games-registry.json against the repo: schema, taxonomy, files on
// disk, no orphans, no stray files. Exits non-zero on any problem — the fast
// CI gate that runs before any browser test.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { GENRES, INPUTS } from './taxonomy.mjs';

const REQUIRED = ['id', 'name', 'date', 'description', 'tagline', 'tags', 'difficulty', 'avgPlayTime', 'controls', 'folder', 'file', 'preview', 'rating', 'genre', 'input', 'mechanic'];
const ALLOWED_FILES = new Set(['index.html', 'game.test.js', 'preview.png']);
const errors = [];

let games;
try {
  games = JSON.parse(readFileSync('games-registry.json', 'utf8'));
} catch (e) {
  console.error('games-registry.json is not valid JSON:', e.message);
  process.exit(1);
}
if (!Array.isArray(games)) {
  console.error('games-registry.json must be a JSON array');
  process.exit(1);
}

const ids = new Set();
const names = new Set();
for (const g of games) {
  const tag = g.id || g.name || '(unknown)';
  const err = msg => errors.push(`${tag}: ${msg}`);
  for (const k of REQUIRED) if (g[k] === undefined || g[k] === '') err(`missing "${k}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(g.id || '')) err('id not YYYY-MM-DD');
  if (ids.has(g.id)) err('duplicate id');
  ids.add(g.id);
  const name = (g.name || '').toLowerCase();
  if (names.has(name)) err(`duplicate name "${g.name}"`);
  names.add(name);
  if (g.date !== g.id) err('date must equal id');
  if (g.folder !== `games/${g.id}`) err('folder must be games/<id>');
  if (g.file !== `games/${g.id}/index.html`) err('file must be games/<id>/index.html');
  if (g.preview !== `games/${g.id}/preview.png`) err('preview must be games/<id>/preview.png');
  for (const f of ALLOWED_FILES) if (!existsSync(`games/${g.id}/${f}`)) err(`${f} missing on disk`);
  if (!['easy', 'medium', 'hard'].includes(g.difficulty)) err(`bad difficulty "${g.difficulty}"`);
  if (typeof g.rating !== 'number' || g.rating < 3.5 || g.rating > 5) err('rating must be a number 3.5-5.0');
  if (!Array.isArray(g.tags) || !g.tags.length) err('tags must be a non-empty array');
  if (!GENRES.includes(g.genre)) err(`genre "${g.genre}" not in scripts/taxonomy.mjs`);
  if (!INPUTS.includes(g.input)) err(`input "${g.input}" not in scripts/taxonomy.mjs`);
  if (g.mechanic && g.mechanic.split(/\s+/).length > 20) err('mechanic must be a short signature (≤20 words)');
  if (g.broken !== undefined && g.broken !== true) err('"broken" must be true or absent');
  if (g.broken && !g.brokenReason) err('broken games need a "brokenReason" so the weekly run can repair them');
  if (!g.broken && g.brokenReason) err('"brokenReason" set on a game that is not broken');
}

for (const d of readdirSync('games', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  if (!ids.has(d.name)) errors.push(`games/${d.name}: folder has no registry entry`);
  for (const f of readdirSync(`games/${d.name}`)) {
    if (!ALLOWED_FILES.has(f)) errors.push(`games/${d.name}/${f}: stray file (only index.html, game.test.js, preview.png allowed)`);
  }
}

if (errors.length) {
  console.error(`Registry validation FAILED (${errors.length}):`);
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}
console.log(`Registry OK: ${games.length} games validated (${games.filter(g => g.broken).length} flagged broken).`);
