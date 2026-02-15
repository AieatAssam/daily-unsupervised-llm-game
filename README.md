# 🎮 Daily Flashy Games

**A new addictive, beautiful web game generated automatically every single day by Claude Code!**

Each game features:
- ✨ Stunning neon aesthetics with particle effects
- 🎵 Synthesizer sound effects
- 📱 Mobile-responsive design
- 🏆 High score tracking
- 🎯 Instantly addictive gameplay

## 🚀 How It Works

1. **GitHub Actions** runs daily at 3 AM UTC
2. **Official Claude Code Action** (`anthropics/claude-code-action@v1`) executes
3. **Checks existing games** to avoid duplicates
4. Generates a completely unique game from scratch
5. **Creates automated tests** for the game
6. **Runs tests** to ensure quality
7. Creates preview image, updates registry
8. Commits everything automatically
9. **Deploys to GitHub Pages** only if all tests pass
10. **Your game collection grows every day!**

## 📁 Project Structure

```
daily-flashy-games/
├── .github/
│   └── workflows/
│       └── daily-game.yml          # GitHub Actions workflow (3 jobs)
├── games/                           # Generated game files
│   ├── 2026-02-15/
│   │   ├── game.jsx
│   │   ├── game.test.js
│   │   └── preview.png
│   ├── 2026-02-16/
│   │   ├── game.jsx
│   │   ├── game.test.js
│   │   └── preview.png
│   └── ...
├── Claude.md                        # Instructions for Claude Code
├── index.html                       # Main gallery UI
├── games-registry.json              # Game metadata
├── package.json                     # Test dependencies
├── playwright.config.js             # Test configuration
└── README.md                        # This file
```

## ⚙️ Setup Instructions

### 1. Create GitHub Repository

```bash
git init daily-flashy-games
cd daily-flashy-games
```

### 2. Add Files

Copy all files from this template:
- `Claude.md` (Claude Code instructions)
- `index.html` (Game gallery)
- `games-registry.json` (Initial registry)
- `.github/workflows/daily-game.yml` (Automation)

### 3. Create Necessary Folders

```bash
mkdir -p games previews .github/workflows
```

### 4. Configure GitHub Secrets

**Important:** See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed authentication instructions.

**Quick steps:**

Go to your repository Settings → Secrets and variables → Actions → New repository secret:

**Secret Name:** `CLAUDE_CODE_OAUTH_TOKEN`  
**Secret Value:** Your Claude Code OAuth token

**To get your OAuth token:**

1. Install Claude Code CLI (if not already installed):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. Generate OAuth token (Pro and Max users only):
   ```bash
   claude setup-token
   ```
   This will output your OAuth token directly in the terminal.

3. Copy the token value (starts with `oauth_`)

4. Add it as the `CLAUDE_CODE_OAUTH_TOKEN` secret in GitHub

**Note:** This OAuth token uses your Claude Pro subscription directly - no separate API billing!

**Need help?** See [OAUTH_SETUP.md](OAUTH_SETUP.md) for troubleshooting and detailed guides.

### 5. Enable GitHub Actions

- Go to repository Settings → Actions → General
- Set "Workflow permissions" to "Read and write permissions"
- Save changes

### 6. Enable GitHub Pages

GitHub Pages deployment happens automatically after tests pass:
- Go to Settings → Pages
- Source: "GitHub Actions" (not "Deploy from branch")
- Save

Your gallery will be live at: `https://yourusername.github.io/daily-flashy-games`

### 7. Install Test Dependencies (Optional for Local Testing)

```bash
npm install
npx playwright install
```

To run tests locally:
```bash
npm test                 # Run all tests
npm run test:ui          # Run with UI mode
npm run test:report      # View HTML report
```

## 🎯 Manual Trigger

You can manually trigger game generation:

1. Go to "Actions" tab in your repo
2. Select "Daily Game Generator" workflow
3. Click "Run workflow"
4. Select branch (main)
5. Run workflow

## 🎨 Game Examples

The system generates diverse games like:

- **Neon Stack** - Sliding blocks with perfect timing
- **Chromatic Catch** - Color-matching falling orbs
- **Gravity Well** - Navigate through orbital physics
- **Rhythm Runner** - Platform jumping to the beat
- **Reflex Reactor** - Simon-says with escalating patterns
- **Pattern Blitz** - Fast pattern matching
- **Neon Dodge** - Bullet-hell lite with particles

Each game is unique, flashy, and addictive!

## 📊 Workflow Details

### Three-Stage Pipeline:

**Stage 1: Generate Game** 🎨
Uses the official `anthropics/claude-code-action@v1`:
1. Action reads `Claude.md` instructions via prompt parameter
2. Checks `games-registry.json` for existing games
3. Analyzes last 7 games to avoid duplicate mechanics
4. Generates unique game concept
5. Creates date folder: `games/YYYY-MM-DD/`
6. Writes complete React JSX game to `game.jsx` (~500-800 lines)
7. Creates automated test file `game.test.js` with 6 required tests:
   - Game loads without errors
   - Core elements render properly
   - Responds to user input
   - Handles rapid interactions
   - Works on mobile viewport (375px)
   - localStorage persists high scores
8. Implements particle effects, sounds, neon aesthetics
9. Generates 1200x630px preview image to `preview.png`
10. Updates games-registry.json with folder paths
11. Commits to main branch automatically

**Stage 2: Test Game** ✅
1. Checks out latest code with new game
2. Installs Playwright test framework
3. Spins up local web server
4. Runs all 6 automated tests
5. Takes screenshots on failures
6. Generates HTML test report
7. **Pipeline stops here if any test fails**

**Stage 3: Deploy** 🚀
1. Only runs if all tests pass
2. Uploads site to GitHub Pages
3. Deploys new version with today's game
4. Gallery updates automatically
5. Creates deployment summary

### What Claude Code Does Each Day:

**Duplicate Prevention:**
- Reads and analyzes existing games
- Checks mechanics, input methods, aesthetics
- Ensures new game is unique enough
- Considers last 7 games to avoid repetition

**Game Implementation:**
- 60fps smooth animations
- Particle effects system
- Web Audio API sounds
- Score tracking + localStorage
- Mobile responsive controls
- Progressive difficulty

**Automated Testing:**
- Creates comprehensive test suite
- Validates game functionality
- Ensures mobile compatibility
- Checks error-free execution
- Verifies storage persistence

**Quality Assurance:**
- All 6 tests must pass
- No console errors allowed
- Mobile viewport tested (375px)
- Touch and mouse input verified
- Performance validated

### Quality Standards:

Every game must have:
- ✅ Unique mechanics (checked against registry)
- ✅ Different from last 7 games
- ✅ **All 6 automated tests passing**
- ✅ No console errors
- ✅ 60fps smooth animations
- ✅ Particle effects
- ✅ Sound effects
- ✅ High score persistence
- ✅ Beautiful neon aesthetic
- ✅ Mobile responsive (375px tested)
- ✅ Touch and mouse input supported

**Deployment Gate:** GitHub Pages only updates if ALL tests pass. This ensures every published game works flawlessly!

## 🛠️ Troubleshooting

### Games Not Generating?

1. Check Actions tab for workflow errors
2. Verify `CLAUDE_CODE_OAUTH_TOKEN` secret is set correctly
3. Ensure workflow has write permissions
4. Check if the "generate-game" job completed
5. Look for Claude Code CLI installation errors
6. **OAuth token expired?** Re-run `claude setup-token` and update the secret

### Tests Failing?

1. Check the "test-game" job in Actions
2. Download test artifacts to see screenshots
3. View HTML test report in artifacts
4. Common issues:
   - Game not loading in time (increase timeouts)
   - Console errors (check game code)
   - localStorage not working (check game implementation)
   - Mobile viewport issues (check responsive CSS)

### Deployment Not Working?

1. Verify tests passed first (deployment only runs after tests)
2. Check Settings → Pages is set to "GitHub Actions"
3. Look for deployment job errors in Actions
4. Ensure Pages environment is enabled
5. Check if id-token permission is granted

### Gallery Not Loading?

1. Verify `games-registry.json` has valid JSON
2. Check browser console for errors
3. Ensure file paths are correct
4. Verify games folder exists
5. Check if GitHub Pages is deployed

### Duplicate Games Being Generated?

Claude Code should prevent this, but if it happens:
1. Check if `games-registry.json` is being read correctly
2. Verify the duplicate prevention logic in Claude.md
3. Manually remove duplicate from registry
4. Delete duplicate game files

### Test Locally Before Committing:

```bash
# Install dependencies
npm install

# Run specific game test
npx playwright test games/2026-02-15-game-name.test.js

# Run with UI (helpful for debugging)
npx playwright test --ui

# Generate and view report
npx playwright test
npx playwright show-report
```

### Want to Customize?

- **Game frequency**: Edit cron schedule in `.github/workflows/daily-game.yml`
- **Game style**: Modify requirements in `Claude.md`
- **Gallery UI**: Edit `index.html` styling/layout
- **Game tags**: Update filter options in both files

## 📝 License

This is your project! Games are generated fresh daily by Claude Code following your instructions.

## 🎪 Gallery Features

- 🔍 **Search** by name or description
- 🏷️ **Filter** by tags (action, puzzle, reflex, casual)
- 📊 **Filter** by difficulty (easy, medium, hard)
- ⭐ **Featured** section for newest game
- 📱 **Responsive** grid layout
- 🎮 **Fullscreen** game player
- ⌨️ **ESC** to close games

## 🚀 Future Ideas

- Add leaderboards with backend
- Social sharing of high scores
- Game ratings and favorites
- Weekly "Best of" compilations
- Tournament mode with brackets
- Multiplayer games
- Achievement system

---

**Start Date:** When you first run the workflow  
**New Game:** Every day at 3 AM UTC  
**Total Games:** Infinite! ♾️

Enjoy your ever-growing arcade! 🎮✨
