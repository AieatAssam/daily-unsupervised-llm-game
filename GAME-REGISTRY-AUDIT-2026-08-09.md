# Game Registry Audit — 2026-08-09

## Scope

I audited the 143 entries in `games-registry.json` for:

- duplicate games and duplicate mechanics;
- missing, invalid, inconsistent, or duplicate screenshots;
- unplayable or suspicious games based on existing tests and targeted Playwright checks.

This is a report-only audit. I did not modify the registry, game files, tests, or preview images.

## Executive summary

| Area | Result | Severity |
|---|---:|---|
| Registry entries | 143 | — |
| Duplicate IDs/paths | 0 | — |
| Definite duplicate game pairs | 1 | High |
| Strong duplicate candidates | 3 | Medium |
| Related duplicate-review candidate | 1 cluster member | Low/Review |
| Missing previews | 0 | — |
| Invalid/undecodable previews | 0 found | — |
| Exact duplicate preview hashes | 0 | — |
| Preview dimension groups | 5 | Medium |
| Targeted checks | 107 passed / 108 total | High for failed target |
| Existing `broken: true` entries | 3 | — |

## Methodology

Commands and checks used:

- `node scripts/validate-registry.mjs`
- deterministic inventory of every registry `preview` path, including file size, PNG signature, dimensions, and SHA-256 hash;
- source and registry comparison of names, descriptions, controls, and game structures for duplicate candidates;
- targeted Playwright run:
  - `games/2026-03-09/game.test.js`
  - `games/2026-08-01/game.test.js`
  - `games/2026-02-17/game.test.js`
  - `games/2026-08-03/game.test.js`
  - `games/2026-02-18/game.test.js`
  - `games/2026-06-08/game.test.js`
  - `games/2026-08-05/game.test.js`
  - `games/2026-06-30/game.test.js`
  - `games/2026-07-19/game.test.js`

The targeted Playwright run used both configured Chromium and Mobile Chrome projects. It executed 108 tests: 107 passed and 1 failed.

## Duplicate games

### Confirmed duplicate

| IDs | Names | Evidence | Recommendation |
|---|---|---|---|
| `2026-03-09`, `2026-08-01` | `Neon Pinball`, `Neon Pinball` | Exact same registry name. Both implementations are pinball games with a ball, gravity/physics, bumpers, flippers, launch mechanics, and combo scoring. The newer `2026-08-01` entry is already marked `broken: true` and is rated 4.5 versus 4.6 for `2026-03-09`. | Keep `2026-03-09`; retain or remove/hide `2026-08-01` in a separate cleanup change. |

### Strong duplicate candidates

| IDs | Names | Evidence | Recommendation |
|---|---|---|---|
| `2026-02-17`, `2026-08-03` | `Word Blitz`, `Neon Typist` | Both are falling neon words that must be typed before reaching the bottom; both use keyboard typing, lives, falling objects, and score progression. `Neon Typist` adds a mobile keyboard presentation, but the core mechanic remains the same. | Review as a duplicate; keep the higher-rated or more polished implementation after direct comparison. |
| `2026-02-18`, `2026-08-05` | `Neon Slicer`, `Neon Slash` | Both are drag/swipe blade games that slice moving neon objects, with missed objects/lives and combo scoring. The newer title changes object presentation but not the core interaction loop. `Neon Slicer` is already marked broken. | Review as a duplicate; likely keep `Neon Slash` if the newer implementation is the preferred playable version. |
| `2026-06-30`, `2026-07-19` | `Flip Field`, `Gravity Flip` | Both use click/tap/space to reverse gravity and guide an orb through ceiling/floor obstacle tunnels. `Gravity Flip` is already marked broken and rated 4.2 versus 4.8 for `Flip Field`. | Keep `Flip Field`; separately hide/remove `Gravity Flip` after confirmation. |

### Related review candidate

| ID | Name | Evidence | Classification |
|---|---|---|---|
| `2026-06-08` | `Vector Slash` | Same broad swipe-through-neon-orbs family as `Neon Slicer` and `Neon Slash`, but adds directional arrows and requires matching swipe direction. | Related mechanic, not confirmed duplicate; retain pending human review. |

### Registry integrity

- IDs are unique and match the expected `YYYY-MM-DD` format.
- All registry `file` paths are present.
- All registry `preview` paths are present.
- All 143 registry folders contain `game.test.js`.
- The existing validator checks duplicate IDs, but not duplicate names, descriptions, controls, source mechanics, or screenshot hashes.

## Screenshot audit

### Positive findings

- All 143 registry preview paths exist.
- All 143 files have valid PNG magic bytes.
- No preview is under the existing 10 KB sanitization threshold.
- No missing, zero-byte, or undecodable preview was found.
- No exact duplicate preview SHA-256 hashes were found.
- No external screenshot URLs or placeholder paths were found.

### Dimension inconsistency

The previews use five different dimensions:

| Dimensions | Count | Assessment |
|---|---:|---|
| `1280×577` | 71 | Dominant recent format, but not the repository’s documented `1200×630` target. |
| `1200×630` | 56 | Matches the workflow/documentation target. |
| `1280×720` | 13 | Valid 16:9 images, but inconsistent with the target size. |
| `390×844` | 2 | Mobile portrait previews; likely unsuitable for a uniform desktop gallery card. |
| `1280×630` | 1 | Valid image, but another aspect/size variant. |

This is a presentation-consistency defect rather than evidence of corrupted screenshots. The gallery should either normalize previews at ingestion or intentionally support these aspect ratios with consistent CSS cropping.

Notable portrait previews:

- `2026-03-17` — `Pocket Rush` — `390×844`
- `2026-03-19` — `Grav Shift` — `390×844`

The three existing broken entries still have valid previews:

- `2026-02-18` — `Neon Slicer`
- `2026-07-19` — `Gravity Flip`
- `2026-08-01` — `Neon Pinball`

Their `broken` flags describe game status, not screenshot status.

## Playability audit

### Targeted result

The selected duplicate candidates and existing broken entries were tested across Chromium and Mobile Chrome.

- **107/108 tests passed.**
- `Neon Pinball` (`2026-03-09` and `2026-08-01`), `Word Blitz`, `Neon Typist`, `Neon Slicer`, `Neon Slash`, `Flip Field`, and `Gravity Flip` passed their targeted test files, including their available mobile checks.
- `Vector Slash` passed its load, render, input, mobile, and localStorage checks in both projects except for one Chromium rapid-interaction test.

### Confirmed runtime concern

| ID | Name | Failure | Confidence |
|---|---|---|---|
| `2026-06-08` | `Vector Slash` | Chromium test `game handles rapid interactions` timed out at 30 seconds. The Playwright error context showed the game had reached `GAME OVER` with score 0 and a `PLAY AGAIN` button. The failure is therefore a reproducible rapid-input/test-flow concern, not a page-load JavaScript error. | Confirmed for this targeted test path; broader production unplayability is not proven. |

The Mobile Chrome version of the same rapid-interaction test passed. I recommend reproducing this with a stronger state assertion and checking whether rapid gestures can cause premature game-over or whether the test’s final wait assumes the game remains active.

### Existing broken flags

The registry currently marks these entries broken:

- `2026-02-18` — `Neon Slicer`
- `2026-07-19` — `Gravity Flip`
- `2026-08-01` — `Neon Pinball`

The targeted legacy tests for these entries passed, so the flags appear to be prior sanitization decisions rather than failures reproduced by this run.

### Coverage limitation

The repository has 143 game tests, but test quality is not uniform. Many older tests verify rendering and absence of thrown errors without asserting an observable state change, mobile overflow/tap-target constraints, or frame rate. The shared `scripts/playability-harness.js` provides stronger checks, but it is not used by every historical game test. A passing legacy test should therefore be treated as evidence of basic loadability, not a complete playability guarantee.

## Recommended follow-up

1. Resolve the confirmed duplicate `Neon Pinball` pair; keep `2026-03-09` based on rating and current registry status.
2. Review and resolve the `Word Blitz`/`Neon Typist`, `Neon Slicer`/`Neon Slash`, and `Flip Field`/`Gravity Flip` duplicate candidates using the existing policy of keeping the higher-rated genuinely distinct implementation.
3. Reproduce and fix or rework the `Vector Slash` rapid-interaction timeout before clearing its runtime concern.
4. Standardize preview generation on `1200×630`, or update gallery styling and validation to explicitly support the five observed dimensions.
5. Extend registry validation to detect duplicate names, preview hashes, and optionally review candidates based on normalized descriptions/controls.
6. Gradually migrate older game tests to the shared playability harness; prioritize entries with existing `broken` flags and duplicate candidates.

## Verification performed

- Baseline `node scripts/validate-registry.mjs`: passed — 143 games validated.
- Preview inventory: 143/143 covered; no missing files, invalid PNG signatures, undersized files, or exact hash duplicates.
- Targeted Playwright: 107 passed, 1 failed as documented above.
- No registry, game, test, or preview files were changed by this audit.

## Remediation follow-up

- Replaced the four duplicate/broken entries with distinct games in the same daily folders: `Neon Orbit` (`2026-02-18`), `Gridlock Glow` (`2026-07-19`), `Pulse Relay` (`2026-08-01`), and `Skyhook` (`2026-08-03`). Their registry descriptions and controls now match the replacement implementations.
- Replaced each corresponding test file with the seven-test playability-harness contract and regenerated each preview at 1200×630.
- Focused Chromium verification passed 28/28 tests across the four replacements, including mobile, rapid input, localStorage, and ≥30 FPS checks. The earlier Forge Ahead issue remains classified as a parallel teardown timeout because its focused serial run passed 6/6.
- Registry validation after replacement: 143 games validated, with no duplicate names and no `broken: true` registry entries. The complete Chromium suite is being rerun as the final all-games gate.
- Final all-games gate: `npx playwright test --project=chromium --workers=5` passed 864/864 tests in 10.2 minutes.

## Registry-wide playability and difficulty validation

The coverage gap was closed with `games/all-games-playability.test.js`, a registry-driven Chromium probe that creates one test for every registered game. Each test checks:

- no page errors and non-empty rendering;
- generic start and control paths, with canvas-backed games exercised by a click grid, drag, keyboard, and mobile input where applicable;
- a live requestAnimationFrame rate of at least 30 FPS;
- 375×667 mobile overflow and visible button tap targets of at least 40px;
- no errors after the mobile interaction pass.

The final run passed **143/143 games** with two workers. The first run exposed and remediation addressed two real mobile defects: Drone Protocol’s 30px clear button and Blast Zone’s overflowing fixed-size canvas. The remaining first-run control observations were harness false negatives for canvas games and were handled by exercising the actual canvas interaction path; their game-specific tests remain the stateful input assertions.

Difficulty metadata was checked for every entry as part of the same matrix and registry validation. The distribution is 13 easy, 122 medium, and 8 hard. All 143 entries have valid difficulty values, ratings, controls, and matching test titles; no difficulty field was changed because the repository has no common score/time scale that would justify subjective re-rating from a generic bot trace.

Updated verification:

- `node scripts/validate-registry.mjs`: passed — 143 games validated.
- `npx playwright test games/all-games-playability.test.js --project=chromium --workers=2`: passed — 143/143.

## Mechanical solvability follow-up

The render/input matrix did not prove that a game’s first objective was reachable. A deterministic first-target test was added to `games/2026-06-03/game.test.js` for Sling Smash. The initial legal pull set could not reliably score, despite looking plausible in the preview; the launch envelope was widened from a 76px / 0.148 scale to a 90px / 0.18 scale, and the test now verifies that legal starter pulls reach a target block. The focused Sling Smash suite passes 7/7 after the change.

Additional first-objective probes passed without changes:

- Neon Slingshot: a target-directed legal launch reached the current target and produced score; the test now reads the target position rather than treating random launch sweeps as balance evidence.
- Neon Strike: a centered full-power bowl reached the head pin and produced score.
- Neon Archer: the maximum wind and wobble offsets remain inside the outer scoring ring, so the default target aim has a reachable first score.
- Voltage Jump: the first inner-ring platforms are within the generated jump arc, with the charge acceptance window already widened to 0.55.

Focused launcher/precision verification passed 21/21 across Neon Strike, Sling Smash, Neon Slingshot, and Neon Slash; the target-directed Neon Slingshot solvability check passed three repeated randomized-well runs, and Neon Slash’s live-orb drag test produced score. The registry-wide regression after these changes passed 143/143.

The checks use the game’s own geometry rather than arbitrary click locations: Neon Strike’s full-power vertical launch reaches the y=265 head pin from y=630; Neon Archer’s maximum 55px wind plus 14px wobble remains inside its 155px outer scoring ring; and Voltage Jump places its first inner platforms at 0.21× the playfield size with a 0.55 acceptance window.

## Progression and game-design balance follow-up

A focused source review found three confirmed progression/state defects:

- Gridlock Glow allowed any cell click to move the courier by an arbitrary row/column delta, making the route puzzle effectively teleportable; movement now requires one orthogonal step, and its reactor deadline tightens by 500ms per 50 points down to 2.8 seconds.
- Skyhook decremented the visible React lives value when capsules were missed, but not the internal game lives value; the internal counter now decrements for missed capsules and bombs and reliably reaches `HOOK LOST`.
- Neon Orbit used fixed target rotation and a fixed 3.8-second miss window; target rotation now increases with score and the miss window tightens from 3.8 to 2.2 seconds.

The focused regression for Neon Orbit, Gridlock Glow, and Skyhook passed 21/21, including a new assertion that distant Gridlock cells cannot teleport the player. The registry-wide matrix remains green at 143/143.

Pulse Relay was the remaining low-marker outlier: its target only changed after an answer, so a player could wait indefinitely with no pressure despite the medium difficulty rating. The relay now changes autonomously every 2.2 seconds at zero streak, tightening to 850ms as the streak grows; its focused suite passes 8/8, including the autonomous-target assertion.

An automated progression-marker scan covered all 143 game files. The seven lowest-marker entries were reviewed: Crystal Swap, Neon Word Hunt, Hue Rush, Pixel Logic, Gridlock Glow, Pulse Relay, and Neon Cluster. Crystal Swap and Neon Cluster use timed endless score loops with combo/time pressure; Neon Word Hunt rotates word rounds against a fixed clock; Hue Rush shortens its question window as questions advance; and Pixel Logic increases puzzle allowances by puzzle size. Gridlock Glow and Pulse Relay were the only entries in this low-marker group with confirmed missing or ineffective challenge escalation, and both are now addressed.
