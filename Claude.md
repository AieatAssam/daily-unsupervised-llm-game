# Daily Flashy Game Generator

## Mission
Generate ONE new addictive, flashy, beautiful web-based game every day. Each game must be complete, polished, and instantly playable.

## Game Requirements

### Visual & Aesthetic Standards
- **Neon aesthetic**: Vibrant gradient backgrounds that pulse and shift (purple → cyan → pink → orange → teal)
- **Particle effects**: Explosions, trails, glows on key interactions
- **Smooth animations**: 60fps using requestAnimationFrame, CSS transforms, canvas effects
- **Visual polish**: Box shadows, glow effects, chromatic color shifts, pulsing elements
- **Responsive design**: Works perfectly on desktop and mobile

### Gameplay Standards
- **Instantly addictive**: "Just one more try" loop built into escalating difficulty
- **Simple controls**: Click/tap or simple keyboard controls (arrow keys, spacebar)
- **Progressive difficulty**: Speed increases, patterns get complex, or new mechanics introduce over time
- **Score/combo systems**: Clear scoring with visual feedback, combos for consecutive successes
- **High score persistence**: localStorage to save best score across sessions

### Technical Standards
- **Single-file React JSX**: Complete game in one .jsx file, no external dependencies beyond React
- **Synthesizer sounds**: Web Audio API for bleeps, bloops, and satisfying audio feedback
- **Smooth performance**: Optimized rendering, efficient state management
- **Clean code**: Well-structured, commented where game logic is complex

### Game Inspiration Examples
Reference these styles (but create unique mechanics):

1. **Neon Stack** - Sliding blocks that stack, misaligned portions fall with particle explosions
2. **Chromatic Catch** - Falling colored orbs caught in color-matching basket
3. **Rhythm Runner** - Platform jumping synced to generated beat patterns
4. **Reflex Reactor** - Simon-says with escalating neon patterns and speed
5. **Gravity Well** - Navigate orb through gravitational fields with mouse/touch
6. **Pattern Blitz** - Match appearing patterns before timer expires
7. **Cascade Crash** - Physics-based ball drops with satisfying chain reactions
8. **Neon Dodge** - Bullet-hell lite with beautiful particle trails
9. **Spin Surge** - Rotating obstacles with precise timing challenges
10. **Color Shift** - Player changes color to match approaching obstacles

## Daily Generation Workflow

### 1. Duplicate Prevention & Concept Generation
**CRITICAL: Check existing games first!**
- Read `games-registry.json` to see all previously created games
- Review the last 7 games to understand recent patterns
- Identify mechanics, themes, and control schemes already used
- Generate a UNIQUE game concept that is:
  - Mechanically different from ALL existing games
  - Uses different input patterns (if last game was click-timing, try mouse-tracking or drag physics)
  - Explores different genres (if last 2 were action, try puzzle or rhythm)
  - Has a unique visual hook (if recent games used orbs, try blocks, waves, or geometric patterns)

**Duplication Check:** A game is considered a duplicate if it shares:
- Same core mechanic (e.g., two "stack falling blocks" games)
- Same input method AND similar gameplay (e.g., two "click to jump over obstacles" games)
- Same visual aesthetic without mechanical innovation (e.g., two neon ball-bouncing games)

**Acceptable Similarities:** Minor overlap is OK if the core experience is different:
- Example: "Catch falling items" + "Match colors" vs "Catch falling items" + "Drag to create combos" = Different enough
- Example: "Click timing" + "Stack blocks" vs "Click timing" + "Launch projectiles" = Different enough

### 2. Game Concept Documentation
After ensuring uniqueness:
- Pick a creative name (2-3 words, catchy, memorable)
- Define core mechanic in one sentence
- Identify what makes it addictive
- Note how it differs from recent games

### 2. Game Development
Create a complete React JSX file with:
- Game state management (useState, useEffect, useRef)
- Canvas or CSS-based rendering
- Input handling (mouse, touch, keyboard)
- Score tracking and display
- High score persistence
- Particle effects system
- Sound effects via Web Audio API
- Gradient animated backgrounds
- Proper mobile responsiveness

**File organization**: All files for a single game go in a date-based folder:
- Create folder: `games/YYYY-MM-DD/`
- Game file: `games/YYYY-MM-DD/game.jsx`
- Test file: `games/YYYY-MM-DD/game.test.js`
- Preview image: `games/YYYY-MM-DD/preview.png`

Example for February 15, 2026:
```
games/2026-02-15/
  ├── game.jsx
  ├── game.test.js
  └── preview.png
```

### 3. Preview Image Generation
Create a 1200x630px PNG screenshot showing:
- Game in an exciting mid-action state
- Visible score and visual effects
- Vibrant colors and aesthetics clearly shown
- Save as: `games/YYYY-MM-DD/preview.png`

Example: `games/2026-02-15/preview.png`

### 4. Game Registry Update
Update `games-registry.json` with new entry:
```json
{
  "id": "YYYY-MM-DD",
  "name": "Game Name",
  "date": "YYYY-MM-DD",
  "description": "One sentence describing core mechanic",
  "tagline": "Catchy marketing tagline",
  "tags": ["action", "reflex", "puzzle", "casual"],
  "difficulty": "easy|medium|hard",
  "avgPlayTime": "30 seconds|2 minutes|5 minutes",
  "controls": "Click to jump, Arrow keys to move",
  "folder": "games/YYYY-MM-DD",
  "file": "games/YYYY-MM-DD/game.jsx",
  "preview": "games/YYYY-MM-DD/preview.png"
}
```

### 5. Automated Testing
**CRITICAL: Create test file for every game**

Create `games/YYYY-MM-DD/game.test.js` with automated tests:

```javascript
import { test, expect } from '@playwright/test';

test.describe('YYYY-MM-DD Game Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/YYYY-MM-DD/game.jsx');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    // Check no console errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Verify game title/score visible
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click on game area
    await page.click('body');
    await page.waitForTimeout(500);
    
    // Verify state changed (score increased, animation started, etc.)
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Rapid clicks/key presses
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }
    
    // Should still be responsive
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Touch interaction
    await page.tap('body');
    await page.waitForTimeout(500);
    
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Play briefly to generate score
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // Check localStorage
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => 
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });
    
    // Should have at least one score-related key
    expect(storage.length).toBeGreaterThan(0);
  });
});
```

**Test Requirements:**
- All 6 tests must pass
- No console errors during gameplay
- Game must respond to both mouse and touch input
- localStorage must work for high scores
- Must be responsive on mobile (375px width)

### 6. Gallery UI Update
The `index.html` serves as the main entry page. Ensure it:
- Reads `games-registry.json` and displays all games
- Shows preview images in a responsive grid
- Implements search/filter by tags, difficulty, name
- Has a "Featured Today" section highlighting the newest game
- Allows clicking game cards to launch the game in fullscreen
- Shows game stats (date, play time, difficulty)
- Has smooth hover effects and transitions

## File Structure
```
/
├── Claude.md                    # This file
├── index.html                   # Main gallery/launcher UI
├── games-registry.json          # Metadata for all games
├── games/
│   ├── 2026-02-15/
│   │   ├── game.jsx
│   │   ├── game.test.js
│   │   └── preview.png
│   ├── 2026-02-16/
│   │   ├── game.jsx
│   │   ├── game.test.js
│   │   └── preview.png
│   └── ...
└── playwright.config.js         # Test configuration
```

## One-Shot Execution Rules

### YOU MUST COMPLETE ALL OF THESE IN ONE RUN:
1. ✅ Read games-registry.json to check for duplicates
2. ✅ Brainstorm and select a unique game concept (verify uniqueness)
3. ✅ Create date folder: `games/YYYY-MM-DD/`
4. ✅ Write the complete game code to `games/YYYY-MM-DD/game.jsx` (500-800 lines typical)
5. ✅ Write automated test file `games/YYYY-MM-DD/game.test.js` with all 6 required tests
6. ✅ Test that the game runs properly
7. ✅ Generate preview image to `games/YYYY-MM-DD/preview.png` (screenshot mid-gameplay)
8. ✅ Update games-registry.json with new entry
9. ✅ Verify index.html correctly loads the new game
10. ✅ Commit all files with message: "🎮 Daily Game: [Game Name] - [Date]"

### Quality Checklist (verify before committing):
- [ ] Game is unique - checked registry and confirmed no duplicates
- [ ] Core mechanic is different from last 7 games
- [ ] All 6 automated tests written and will pass
- [ ] Visual aesthetics match neon/flashy standard
- [ ] Particle effects present and visually satisfying
- [ ] Sound effects work (test Web Audio API)
- [ ] High score saves to localStorage
- [ ] Controls are responsive and feel good
- [ ] Difficulty progression works
- [ ] Mobile responsive (test viewport)
- [ ] Preview image is vibrant and representative
- [ ] Registry JSON is valid and complete
- [ ] Game name is catchy and memorable

## Gallery UI Requirements

The `index.html` must provide:

### Hero Section
- Large "Daily Flashy Games" title with neon text effect
- Today's featured game prominently displayed with preview
- Quick play button for newest game

### Game Grid
- Responsive card grid (3-4 columns desktop, 1-2 mobile)
- Each card shows:
  - Preview image
  - Game name
  - Date published
  - Quick stats (difficulty, avg play time)
  - Tags as pill badges
  - Hover effect with glow

### Search & Filter
- Live search by game name/description
- Filter by tags (checkboxes or dropdown)
- Filter by difficulty level
- Sort by: Newest, Oldest, Name A-Z

### Game Launcher
- Clicking card opens game in fullscreen overlay
- Close button to return to gallery
- Game iframe or direct JSX mounting
- Escape key to close

## Important Notes

### Testing is Mandatory
- **Every game MUST have passing tests**
- GitHub Pages deployment ONLY happens if tests pass
- Tests protect against broken games
- Use the example test file as a template
- All 6 tests are required, no exceptions

### Creativity Requirements
- Each game MUST be mechanically unique
- Don't repeat similar concepts (e.g., no two "catch falling things" games in a row)
- Explore different input methods (mouse tracking, rhythm timing, precise clicking, drag physics)
- Mix genres: action, puzzle, reflex, casual, rhythm
- Reference modern mobile game patterns (Flappy Bird, 2048, Crossy Road style mechanics)

### Technical Constraints
- Single JSX file per game (no multi-file games)
- No external asset dependencies (generate all visuals with code)
- Pure CSS + Canvas animations (no video files)
- Web Audio API only (no audio file dependencies)
- Must run entirely client-side in browser
- localStorage only (no backend required)

### Preview Image Guidelines
- Take screenshot when game is MID-ACTION showing effects
- Must clearly show the game's aesthetic
- Include visible score/UI elements
- Vibrant and eye-catching
- 1200x630px (optimized for social sharing)

## Example Commit Message
```
🎮 Daily Game: Gravity Well - 2026-02-15

A mesmerizing orbital physics game where you guide a glowing orb through 
gravitational fields using mouse/touch. Features beautiful particle trails, 
pulsing celestial bodies, and increasingly chaotic gravity wells.

Files:
- games/2026-02-15/game.jsx (new)
- games/2026-02-15/game.test.js (new)
- games/2026-02-15/preview.png (new)
- games-registry.json (updated)

- Unique physics-based mechanics
- Neon space aesthetic with nebula backgrounds
- Progressive difficulty with combo scoring
- Smooth 60fps particle effects
- All 6 tests passing
```

## Failure Cases to Avoid
- ❌ Game too similar to yesterday's game
- ❌ Missing particle effects or sound
- ❌ Poor mobile responsiveness
- ❌ Broken high score persistence
- ❌ Preview image is boring/static
- ❌ Registry JSON has syntax errors
- ❌ Incomplete one-shot (game works but preview missing)
- ❌ Low visual polish (looks bland or unfinished)

## Success Criteria
Each daily game should make someone say: "Whoa, this is beautiful! One more try..."

The gallery should feel like a treasure trove of polished mini-games, each one a complete experience worth 5-10 minutes of addictive play.
