# Neon Game Arcade

Generate ONE polished, instantly playable web game per day at `games/YYYY-MM-DD/index.html`.

## Pipeline output style

CI chat output is never read by humans. Respond ultra-terse: fragments, no narration, no summaries. Spend tokens on files and tool calls. Committed code stays normal quality.

## Hard rules

- Single file `games/YYYY-MM-DD/index.html`. Only other files allowed: `game.test.js`, `preview.png`.
- React 18 + ReactDOM + Babel standalone from unpkg.com CDN, game code in `<script type="text/babel">`.
- Web Audio API for sound. All visuals generated in code. No external assets. Client-side only.
- Relative paths only. Never commit runtime artifacts (playwright-report/, test-results/, logs, screenshots outside the game folder, .claude/skills/).

## Game bar

Neon aesthetic: animated gradients, particles on key interactions, glow polish, 60fps via requestAnimationFrame, responsive desktop + mobile. Simple controls (click/tap/arrows/space), progressive difficulty, score + combo feedback, high score in localStorage. Success = "one more try".

## Uniqueness (check FIRST)

Read `games-registry.json`. The new game must differ from all existing games, especially the last 7. Duplicate = same core mechanic, or same input method + similar gameplay. Vary genre and input style vs recent games.

## Daily workflow

1. Pick a unique concept and catchy 2–3 word name from the registry.
2. Write `games/YYYY-MM-DD/index.html` (complete game).
3. Write `games/YYYY-MM-DD/game.test.js` — 7 required tests: loads without pageerrors · renders core elements · controls produce observable state change · survives rapid input and stays responsive · mobile playable at 375px (no overflow, ≥40px tap targets, tap responds) · localStorage score key · ≥30fps during play. Use `scripts/playability-harness.js`; copy a recent game's test file as the structure.
4. Run `npx playwright test games/YYYY-MM-DD/game.test.js` until 0 failures. Never skip.
5. Verify live with agent-browser (server at http://localhost:8080): `open` → `wait 3000` → `screenshot` (must not be blank — read it) → `snapshot` → interact → confirm response. Fix and re-verify if broken.
6. Screenshot mid-action gameplay (score + effects visible) to `preview.png`, 1200x630.
7. Append the registry entry (all fields incl. honest `rating` 3.5–5.0; see existing entries for the schema). Validate: `node scripts/validate-registry.mjs`.
8. Commit `🎮 Daily Game: [Name] - [Date]`. Each commit must leave the repo deployable.

## Notes

- The gallery (`index.html`) is registry-driven; no gallery edits needed. Entries with `"broken": true` are hidden.
- CI tests only games changed on the branch; the new game's tests are the gate.
- Tests must be deterministic: `domcontentloaded` + explicit waits, never `networkidle`, no timing-sensitive score assertions.
- A game is broken if it fails to render, throws JS errors, ignores its controls (nothing observable changes on input), or is mobile-unplayable.
