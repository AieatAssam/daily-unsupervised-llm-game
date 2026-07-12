// Validates games-registry.json: schema, file existence, no duplicates.
// Exits non-zero on any problem — used as a fast CI gate.
import { readFileSync, existsSync } from 'fs';

const REQUIRED = ['id', 'name', 'date', 'description', 'tagline', 'tags', 'difficulty', 'avgPlayTime', 'controls', 'folder', 'file', 'preview'];
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
for (const g of games) {
  const tag = g.id || g.name || '(unknown)';
  for (const k of REQUIRED) if (g[k] === undefined) errors.push(`${tag}: missing "${k}"`);
  if (ids.has(g.id)) errors.push(`${tag}: duplicate id`);
  ids.add(g.id);
  if (g.id && !/^\d{4}-\d{2}-\d{2}$/.test(g.id)) errors.push(`${tag}: id not YYYY-MM-DD`);
  if (g.file && !existsSync(g.file)) errors.push(`${tag}: file missing on disk: ${g.file}`);
  if (g.preview && !existsSync(g.preview)) errors.push(`${tag}: preview missing on disk: ${g.preview}`);
  if (g.folder && !existsSync(`${g.folder}/game.test.js`)) errors.push(`${tag}: game.test.js missing in ${g.folder}`);
  if (g.difficulty && !['easy', 'medium', 'hard'].includes(g.difficulty)) errors.push(`${tag}: bad difficulty "${g.difficulty}"`);
  if (g.rating !== undefined && (typeof g.rating !== 'number' || g.rating < 0 || g.rating > 5)) errors.push(`${tag}: rating must be number 0-5`);
}

if (errors.length) {
  console.error(`Registry validation FAILED (${errors.length}):`);
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}
console.log(`Registry OK: ${games.length} games validated.`);
