# Neon Game Arcade — Daily Game Generator

Mission: generate ONE new addictive, flashy, beautiful web game per day. Complete, polished, instantly playable.

## Output style (CI runs)
Pipeline chat output is never read by humans. Respond ultra-terse (caveman ultra): fragments, no pleasantries, no narration, no summaries. Spend tokens on files and tool calls. Committed files and code stay normal quality.

## Game requirements

**Visual**: neon aesthetic, animated gradients, particle effects on key interactions, 60fps (requestAnimationFrame), glow/shadow polish, responsive desktop + mobile.

**Gameplay**: instantly addictive "one more try" loop, simple controls (click/tap/arrows/space), progressive difficulty, score + combo system with visual feedback, high score in localStorage.

**Technical**:
- Single file `games/YYYY-MM-DD/index.html`. No other game files except `game.test.js` and `preview.png`. Never `.jsx`.
- React 18 + ReactDOM + Babel standalone from unpkg.com CDN; game code in `<script type="text/babel">`.
- Web Audio API for sound (no audio files). All visuals generated in code (no external assets). Client-side only.
- Relative paths only. Never write to /tmp or absolute paths. Never commit runtime artifacts (playwright-report/, test-results/, logs, screenshots outside the game folder, .claude/skills/).

## Uniqueness (check FIRST)
Read `games-registry.json`. New game must differ from ALL existing games, especially the last 7:
- Duplicate = same core mechanic, or same input method + similar gameplay, or same visual hook without mechanical innovation.
- Vary genre (action/puzzle/reflex/rhythm/casual) and input style (click timing, mouse tracking, drag physics, typing, keyboard) vs recent games.

## Daily workflow (one shot, all steps)
1. Read `games-registry.json`; pick unique concept, catchy 2–3 word name.
2. Create `games/YYYY-MM-DD/index.html` (complete game).
3. Create `games/YYYY-MM-DD/game.test.js` — 6 required tests loading `/games/YYYY-MM-DD/index.html`:
   loads without pageerrors · renders core elements · responds to input · survives rapid input · works at 375px viewport with tap · writes a score/high-score key to localStorage.
   Copy the structure of any recent game's test file.
4. Run `npx playwright test games/YYYY-MM-DD/game.test.js`. Fix and re-run until 0 failures. Never skip; never assume.
5. Verify live with agent-browser (server runs at http://localhost:8080):
   `agent-browser open <url>` → `wait 3000` → `screenshot /tmp/check.png` (read it: must not be blank) → `snapshot` → interact → confirm response. Fix and re-verify if broken.
6. Screenshot mid-action gameplay (score + effects visible) to `games/YYYY-MM-DD/preview.png` (1200x630 target).
7. Append registry entry:
```json
{
  "id": "YYYY-MM-DD", "name": "Game Name", "date": "YYYY-MM-DD",
  "description": "1-3 vivid sentences on mechanic and hook",
  "tagline": "Catchy tagline", "tags": ["action", "reflex"],
  "difficulty": "easy|medium|hard", "avgPlayTime": "3 minutes",
  "controls": "How to play", "folder": "games/YYYY-MM-DD",
  "file": "games/YYYY-MM-DD/index.html", "preview": "games/YYYY-MM-DD/preview.png",
  "rating": 4.5
}
```
   `rating` = honest 3.5–5.0 self-assessment of polish and fun. Validate with `node scripts/validate-registry.mjs`.
8. Commit: `🎮 Daily Game: [Name] - [Date]`. Each commit must leave the repo deployable.

## Testing policy
- CI tests only games changed on the branch (full suite is slow and CDN-flaky). Your new game's tests are the gate — they must pass locally before commit.
- `scripts/validate-registry.mjs` gates registry schema + file existence.
- Write tests that are deterministic: prefer `domcontentloaded` + explicit waits over `networkidle`; don't assert on timing-sensitive scores.

## Gallery (`index.html`)
"Neon Game Arcade" — loads `games-registry.json`, featured latest game, searchable/filterable/sortable card grid with rating badges, fullscreen iframe launcher. Entries with `"broken": true` are hidden. When adding a game, no gallery change is needed — registry drives it.

## Quality bar before committing
- Unique mechanic vs registry · tests pass (exit 0) · agent-browser confirmed render + input response · particles + sound present · localStorage high score · mobile responsive · vibrant preview.png · registry valid JSON.

Success = "Whoa, this is beautiful! One more try..."
