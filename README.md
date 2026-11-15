# 🎮 Neon Game Arcade

A browser arcade that grows by one original game every day, designed, built, play-tested and shipped by Claude with no human in the loop. Each game is a single self-contained HTML file; the gallery is a static page on GitHub Pages.

## How it works

| Workflow | When | What it does |
|---|---|---|
| [`daily-game.yml`](.github/workflows/daily-game.yml) | 03:00 UTC daily | **Author** (Claude Haiku 5.5) picks a concept from the idea brief and builds the game → **gate** play-tests it → **critic** (fresh context) plays it, scores a rubric and fixes weaknesses → **gate** again → commit to `main` → deploy. |
| [`weekly-maintenance.yml`](.github/workflows/weekly-maintenance.yml) | Sundays 04:23 UTC, or manually with a `focus` note | Runs every game's tests, then Claude Sonnet 5.5 repairs the failures, upgrades ten older games to the real play-test suite (fixing what it exposes), removes duplicates, and ships the result. Also deletes leftover work branches. |
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | On push to `main` / called by the others | Publishes the repo to GitHub Pages. |

Nothing is pushed until the final gate passes, so a failed run leaves no branches or half-finished games behind — it just uploads its play-test evidence as a workflow artifact.

All agent instructions live in [`AGENTS.md`](AGENTS.md). Models are set in the `env:` block at the top of each workflow.

### Keeping games original

`games-registry.json` records a `genre`, `input` and one-line `mechanic` for every game. [`scripts/idea-brief.mjs`](scripts/idea-brief.mjs) turns that into a daily brief — which genres are saturated, what the last ten games were, every mechanic already used — plus three date-seeded random prompts (genre × input × twist × theme) so the author is not left to its own habits. `--similar "<mechanic>"` checks a concept against the arcade; `--dupes` lists likely duplicate pairs for the weekly run.

### Keeping games good

Every new game implements a tiny contract (`window.__game = { phase, score }`, a `start-btn`, a known `localStorage` key) and ships a small bot that plays it well. [`scripts/game-suite.js`](scripts/game-suite.js) uses those to actually play the game: it must boot cleanly, not kill an idle player, score under skilled play, end, save the best score, restart, survive input mashing, work by touch at 375px and hold a playable frame rate. The run leaves a filmstrip in `playtest/<id>/` that the critic reads before playing the game itself in a real browser.

[`scripts/gate.sh`](scripts/gate.sh) is the merge gate. It also rejects any run that touched files outside the game's own folder and its registry entry, so tests cannot be made to pass by editing the test machinery.

## Setup (once)

1. **Token:** run `claude setup-token` locally and save the result as the repository secret `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions). If the daily run starts failing within a minute or two with an authentication or usage-limit error, regenerate the token or check the plan's usage.
2. **Actions permissions:** Settings → Actions → General → Workflow permissions → *Read and write*.
3. **Pages:** Settings → Pages → Source → *GitHub Actions*.

## Local development

```bash
npm install && npx playwright install chromium
npm run serve                              # gallery at http://localhost:8080
npm run idea                               # today's idea brief
npx playwright test games/2026-11-10       # play-test one game
npm test                                   # every game (slow)
npm run validate                           # registry ↔ disk consistency
```

## Layout

```
games/YYYY-MM-DD/{index.html, game.test.js, preview.png}
games-registry.json        the gallery's data and the arcade's memory
index.html                 gallery
scripts/                   idea brief, play-test suite, validator, gate
AGENTS.md                  instructions for the agents
```

MIT licensed.
