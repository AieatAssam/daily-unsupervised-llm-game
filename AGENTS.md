# Neon Game Arcade — agent guide

One new, original, instantly playable browser game per day, built and shipped by an unattended agent. A visitor should be able to open any game cold, understand it within five seconds, and want one more try. A game that merely passes tests but is confusing, unfair, or a re-skin of an existing game is a failure.

Pipeline chat output is never read by humans: keep replies to terse fragments and spend effort on files and tool calls. Committed code stays normal quality.

## Repo map

| Path | What it is |
|---|---|
| `games/YYYY-MM-DD/` | One game: `index.html`, `game.test.js`, `preview.png`. Nothing else. |
| `games-registry.json` | Flat JSON array, oldest first. Drives the gallery (`index.html`), ideation and validation. |
| `scripts/idea-brief.mjs` | What already exists + random seeds for today's concept. |
| `scripts/game-suite.js` | The standard play-test suite every new game uses. |
| `scripts/validate-registry.mjs` | Registry/disk consistency gate. |
| `scripts/taxonomy.mjs` | Allowed `genre` and `input` values. |
| `scripts/playability-harness.js`, `games/all-games-playability.test.js` | Legacy per-game helpers and the whole-arcade health sweep. Don't use the harness for new games. |

A static server is at `http://localhost:8080` in CI (`npm run serve` locally).

## Building the daily game

The workflow gives you the date. Do the steps in order.

### 1. Choose a concept (do this properly — it decides everything)

```bash
node scripts/idea-brief.mjs --date YYYY-MM-DD
```

It prints genre saturation, the last 10 games, every existing mechanic, and three random seeds (genre × input × twist × theme). Then:

1. Write three one-line concepts, one per seed. Describe the **core loop** — what the player does every second and how they fail — not the theme.
2. Check each: `node scripts/idea-brief.mjs --similar "<core loop in ≤12 words>"`. Read the top hits.
3. Keep the concept furthest from everything that exists. If all three are close to existing games, change the loop itself and check again.

A new theme, new colours or an extra power-up on an existing loop is a duplicate. The test: could a player of the existing game play yours without learning anything new? Then it is a duplicate. Today's game must also differ in **both genre and input** from each of the last 10 games.

Before writing code, be able to answer: What is the one interesting decision the player makes repeatedly? What makes minute two harder than minute one? What makes a skilled player score higher than a button-masher?

### 2. Write `games/YYYY-MM-DD/index.html`

Hard constraints:

- One self-contained file. React 18 + ReactDOM + Babel standalone from `unpkg.com`, game code in `<script type="text/babel">`. No other network requests, no external assets — all visuals drawn in code, sound via the Web Audio API (create the `AudioContext` on first user input).
- Relative paths only. Client-side only.
- Runs the simulation in `requestAnimationFrame` with delta time; keep per-frame state in refs, not React state, so the loop does not re-render 60×/s.
- Works with mouse, touch and (where it makes sense) keyboard. Every action must be possible by touch on a 375×667 screen: no horizontal overflow, tap targets ≥ 44px, `touch-action: none` on the play area.

**Test contract** — the play-test suite depends on exactly this:

```js
// kept live at all times (assign on every phase/score change)
window.__game = { phase: 'menu' | 'playing' | 'over', score: 0 };
```

- `<button data-testid="start-btn">` is visible in `menu` and `over`, and starts/restarts the game. Restart resets the score to 0.
- At game over, the best score is saved to `localStorage['arcade.YYYY-MM-DD.best']`.
- The game must end: a player who stops playing reaches `over` (lives, timer, or collapse). An idle player must survive at least the first 3 seconds.

Design bar:

- **Clear in five seconds.** One line of instruction on the menu; the first interaction teaches the rest. The first point should come within ~10 seconds of sensible play.
- **Fair.** Every loss is the player's fault and visibly telegraphed. No instant deaths at start, no unavoidable hits.
- **Escalates.** Difficulty ramps continuously (speed, density, new element) — a run is typically 1–3 minutes.
- **Skill pays.** Combos, risk/reward or precision bonuses so good play clearly outscores mashing.
- **Juice.** Every hit, miss and combo gets feedback: particles, screen shake, flashes, score pops, sound. Neon look: dark background, glowing saturated colours, animated gradients. Keep it cheap — avoid large `shadowBlur` on many objects per frame; pre-render glows or use additive blending.
- Show score, best score and combo/lives during play; show final score, best and a restart button at game over.

### 3. Write `games/YYYY-MM-DD/game.test.js`

Only this — the suite supplies the tests:

```js
import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: 'YYYY-MM-DD',
  // Play WELL for roughly 8–15 seconds. Must earn points.
  // With { mobile: true } use touch (locator.tap / page.touchscreen), never the keyboard.
  play: async (page, { mobile }) => { /* ... */ },
  // Optional: how to lose on purpose. Omit if doing nothing loses within 90s.
  lose: async (page) => { /* ... */ },
});
```

`play` is a small bot. Make it genuinely skilled: read the live state from the page (`page.evaluate`, DOM positions, `data-testid`s) and act on it, rather than tapping blindly. If you cannot write a bot that scores, a human cannot understand the game either — simplify the game. Never weaken the suite, expose cheat hooks, or fake `window.__game` to pass. `games/2026-11-10/` is a working reference.

### 4. Run the gate until green

```bash
npx playwright test games/YYYY-MM-DD
node scripts/validate-registry.mjs   # after step 6
```

The suite checks: clean boot with no JS errors, non-blank menu, no instant death, skilled play scores (first point < 20s), the game ends, best score saved, restart resets, input mashing does not stall it, playable by touch at 375px, acceptable frame rate. Fix the game, not the test.

### 5. Look at it

The suite writes `playtest/YYYY-MM-DD/` (gitignored): `play-NN.png` frames every 1.5s, `over.png`, `mobile.png`, `metrics.json`. Open the images. Check that the frames show a readable, attractive game where something is happening, that the HUD is legible, and that the mobile frame is not cramped or clipped. Fix what looks wrong and re-run.

Copy the most exciting mid-play frame (score and effects visible) to `games/YYYY-MM-DD/preview.png`.

### 6. Register it

Append to `games-registry.json` (copy the shape of the last entry):

`id`, `date` (both the date), `name` (2–3 catchy words, not used before), `tagline`, `description` (what you do, how you fail, what escalates), `tags`, `difficulty` (`easy|medium|hard`), `avgPlayTime`, `controls`, `folder`, `file`, `preview`, `rating`, `genre`, `input`, `mechanic`.

- `genre`, `input`: from `scripts/taxonomy.mjs`. Use `other` only if nothing fits.
- `mechanic`: the core loop in ≤12 words — action and fail condition, no theme words. Future ideation depends on this being accurate.
- `rating`: honest, 3.5–5.0. 4.0 = solid, 4.5 = you'd show it to a friend, 4.8+ = exceptional. Most games are 3.8–4.4.

Do not commit, push or switch branches — the workflow does that after its own gate passes. Never leave other files behind (`playwright-report/`, `test-results/`, screenshots, logs).

## Reviewing a game (critic pass)

You did not write this game; judge it as a first-time player. Run its tests, open `playtest/<id>/` frames and `metrics.json`, then actually play it with `agent-browser` (`open`, `snapshot`, `click`, `press`, `screenshot` — read the screenshots).

Score each 1–5:

1. **Clarity** — could a stranger start scoring within 10 seconds with only what is on screen?
2. **Responsiveness** — does every input produce immediate, visible feedback?
3. **Fairness** — are losses telegraphed and deserved? Any instant or unavoidable deaths?
4. **Depth** — is there a real decision or skill, and does difficulty escalate?
5. **Polish** — legible HUD, neon look, particles/sound on events, clean on mobile.
6. **Originality** — run `node scripts/idea-brief.mjs --similar "<its mechanic>"`; is the loop actually new?

Anything scoring ≤ 2 must be fixed in `index.html` (root cause, smallest change), then the gate re-run. Set the registry `rating` to what the rubric supports and correct `genre`/`input`/`mechanic` if they misdescribe the game. If Originality is ≤ 2 and cannot be fixed by changing the loop, delete the game folder and its registry entry — shipping nothing beats shipping a duplicate.

## Weekly maintenance

Goal: every listed game works, and the arcade has no duplicates. The workflow hands you `health-report.md` listing games that failed the health sweep.

- **Repair, don't hide.** For each failing game: reproduce (`npx playwright test games/<id>`), find the root cause in `index.html`, fix it minimally, re-run until its tests pass. If the game is fine and its *test* is wrong or flaky, fix the test — never by deleting assertions about real behaviour.
- Mark `"broken": true` with a `"brokenReason"` only when a repair genuinely fails; next week's run retries those first. Remove both fields when a broken game is repaired.
- **Duplicates:** `node scripts/idea-brief.mjs --dupes` lists candidate pairs. A true duplicate has the same core loop. Keep the better game (rating, then age) and delete the other's folder and registry entry. When unsure, keep both.
- Ratings change only with evidence from playing, never for taste.
- Finish with `node scripts/validate-registry.mjs` passing. Do not commit or push.

## Rules that always apply

- Tests are deterministic: explicit waits and state polling, never `networkidle`, no assertions on exact scores or timing.
- A game is broken if it fails to render, throws JS errors, ignores its controls, cannot be lost or restarted, or is unplayable by touch.
- Never commit runtime artifacts or files outside the layout in the repo map. Never edit `.github/` from a pipeline run.
