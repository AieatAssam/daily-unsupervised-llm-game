// Ideation aid for the daily game. LLMs asked to "be original" regress to the
// same dozen arcade ideas, so this script supplies what they lack: a compact
// view of what already exists, and real randomness.
//
//   node scripts/idea-brief.mjs                 brief for today (seeded by date)
//   node scripts/idea-brief.mjs --date 2026-11-16
//   node scripts/idea-brief.mjs --similar "tap to flip gravity through gaps"
//   node scripts/idea-brief.mjs --dupes         likely duplicate pairs in the registry
import { readFileSync } from 'node:fs';

import { GENRES, INPUTS } from './taxonomy.mjs';

// Design twists: each one changes how a base mechanic plays, not how it looks.
const TWISTS = [
  'the player\'s past actions come back as obstacles',
  'two things are controlled at once with one input',
  'the safe move and the high-scoring move are always opposites',
  'a resource that both powers you and endangers you',
  'the playfield itself shrinks, rotates or rewires as you score',
  'you set things up, then watch them resolve (plan → execute)',
  'risk is opt-in: bank now or push your luck for a multiplier',
  'the enemy mirrors or learns your habits',
  'information is hidden and revealed in pulses',
  'everything moves only when you move',
  'you can only act on the beat',
  'momentum carries over — stopping is the hard part',
  'chain reactions: one good action triggers the next',
  'trade-off between two meters that cannot both be full',
  'the goal changes every few seconds',
  'you draw or place the level while something traverses it',
  'you play both sides alternately',
  'negative space: score by what you leave untouched',
  'time is the currency you spend and earn',
  'size/weight grows with success and makes you harder to control',
  'an asymmetric co-op with an AI partner you must not hit',
  'deduction: each action reveals a clue about a hidden rule',
  'gravity, polarity or direction is a toggle, not a constant',
  'combos require variety — repeating an action breaks the chain',
];
const THEMES = ['deep-sea', 'circuit board', 'night city traffic', 'laboratory', 'space salvage', 'kitchen rush', 'weather', 'garden / growth', 'music studio', 'postal sorting', 'heist', 'railway', 'arcade cabinet repair', 'lighthouse', 'bees / swarm', 'chemistry', 'clockwork', 'library', 'volcano', 'sports'];

const games = JSON.parse(readFileSync(new URL('../games-registry.json', import.meta.url), 'utf8'));

const STOP = new Set('a an the to of and or in on at by for with from into its it is are as that this then than before after while when each all any one two three until over under up down out off not no player game run life lives costs cost ends end loses lose fail fails score'.split(' '));
const words = s => new Set((s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).map(w => w.replace(/(ing|es|s|ed)$/, '')).filter(w => w.length > 2 && !STOP.has(w)));
// ponytail: Jaccard on stemmed words. Good enough to surface candidates for a
// model/human to judge; swap for embeddings if the registry outgrows it.
const similarity = (a, b) => {
  const A = words(a), B = words(b);
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / (A.size + B.size - hit || 1);
};
const line = g => `${g.id}  ${g.name.padEnd(18)} [${g.genre} / ${g.input}] ${g.mechanic}`;

function similar(text, n = 8) {
  return games.map(g => ({ g, s: similarity(text, `${g.mechanic} ${g.genre}`) }))
    .sort((a, b) => b.s - a.s).slice(0, n);
}

function dupes(threshold = 0.3) {
  const pairs = [];
  for (let i = 0; i < games.length; i++) {
    for (let j = i + 1; j < games.length; j++) {
      const a = games[i], b = games[j];
      if (a.broken || b.broken) continue;
      let s = similarity(a.mechanic, b.mechanic);
      if (a.genre === b.genre) s += 0.1;
      if (a.input === b.input) s += 0.05;
      if (s >= threshold) pairs.push({ a, b, s });
    }
  }
  return pairs.sort((x, y) => y.s - x.s);
}

// Deterministic per-date RNG (mulberry32) so a re-run gets the same brief.
function rng(seedStr) {
  let h = 1779033703;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function brief(date) {
  const rand = rng(date);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const count = key => games.reduce((m, g) => (m[g[key]] = (m[g[key]] || 0) + 1, m), {});
  const genreCount = count('genre');
  const recent = games.slice(-10);
  const recentGenres = new Set(recent.map(g => g.genre));
  const recentInputs = new Set(recent.slice(-5).map(g => g.input));

  const ranked = GENRES.filter(g => g !== 'other').sort((a, b) => (genreCount[a] || 0) - (genreCount[b] || 0));
  const underused = ranked.slice(0, 12).filter(g => !recentGenres.has(g));
  const freshInputs = INPUTS.filter(i => !recentInputs.has(i));

  console.log(`# Idea brief for ${date} — ${games.length} games exist\n`);
  console.log('## Genre saturation (games per genre; avoid the top, mine the bottom)');
  console.log(GENRES.map(g => `${g}:${genreCount[g] || 0}`).sort((a, b) => b.split(':')[1] - a.split(':')[1]).join('  '));
  console.log('\n## Last 10 games — today must differ from ALL of these in genre AND input');
  recent.forEach(g => console.log(line(g)));
  console.log('\n## Today\'s seeds — build from ONE of these (genre × input × twist × theme)');
  for (let i = 0; i < 3; i++) {
    console.log(`${i + 1}. genre: ${pick(underused)} | input: ${pick(freshInputs)} | twist: ${pick(TWISTS)} | theme: ${pick(THEMES)}`);
  }
  console.log('\n## Every existing mechanic (do not rebuild any of these)');
  for (const genre of GENRES) {
    const list = games.filter(g => g.genre === genre);
    if (list.length) console.log(`${genre}: ${list.map(g => g.mechanic).join(' | ')}`);
  }
  console.log('\nNext: write 3 one-line concepts (one per seed), run');
  console.log('  node scripts/idea-brief.mjs --similar "<your mechanic in ≤12 words>"');
  console.log('for each, and keep the concept whose closest match is the LEAST similar.');
}

const args = process.argv.slice(2);
const arg = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
if (args.includes('--similar')) {
  const hits = similar(arg('--similar'));
  hits.forEach(({ g, s }) => console.log(`${s.toFixed(2)}  ${line(g)}`));
  console.log(hits[0].s >= 0.4 ? '\nVERDICT: too close to an existing game — change the core loop, not the theme.' : '\nVERDICT: no near match. Still read the top hits and confirm the loop differs.');
} else if (args.includes('--dupes')) {
  const pairs = dupes();
  pairs.forEach(({ a, b, s }) => console.log(`${s.toFixed(2)}\n  ${line(a)}  (rating ${a.rating})\n  ${line(b)}  (rating ${b.rating})`));
  console.log(`${pairs.length} candidate pair(s). Candidates only — judge each before acting.`);
} else {
  brief(arg('--date') || new Date().toISOString().slice(0, 10));
}
