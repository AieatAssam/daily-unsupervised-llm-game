# 🚀 Quick Start Guide

Get your automated daily game generator running in 5 minutes!

## Prerequisites

- GitHub account
- Claude Pro account (or Anthropic API key)

## Step-by-Step Setup

### 1. Create GitHub Repository

```bash
# Create new repo on GitHub.com or via CLI
gh repo create daily-flashy-games --public --clone
cd daily-flashy-games
```

### 2. Add All Files

Copy these files from the template to your repository:

```
daily-flashy-games/
├── .github/workflows/daily-game.yml   ← Rename from .github-workflows-daily-game.yml
├── .gitignore
├── Claude.md
├── README.md
├── index.html
├── games-registry.json
├── package.json
├── playwright.config.js
└── example-game.test.js
```

**Important:** Move `.github-workflows-daily-game.yml` to `.github/workflows/daily-game.yml`

```bash
mkdir -p .github/workflows games
mv .github-workflows-daily-game.yml .github/workflows/daily-game.yml
```

### 3. Get Your Claude Code OAuth Token

> 📖 **Detailed Guide:** See [OAUTH_SETUP.md](OAUTH_SETUP.md) for complete instructions and troubleshooting

**Quick Steps:**

**Step 1: Install Claude Code**
```bash
npm install -g @anthropic-ai/claude-code
```

**Step 2: Generate OAuth Token**
```bash
claude setup-token
```

This command will output your OAuth token directly in the terminal.

**Step 3: Copy the Token**
Copy the entire token value displayed (starts with `oauth_`).

**Why OAuth?**
- Uses your Claude Pro subscription directly
- No separate API billing
- Full access to Claude Sonnet 4.5 via your Pro account
- Available for Pro and Max users only

**Need help?** Token expired? See [OAUTH_SETUP.md](OAUTH_SETUP.md) for renewal instructions.

### 4. Add GitHub Secret

1. Go to your repo on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CLAUDE_CODE_OAUTH_TOKEN`
5. Value: Paste your OAuth token
6. Click "Add secret"

### 5. Configure Permissions

**Actions Permissions:**
1. Settings → Actions → General
2. Workflow permissions → Select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Save

**Pages Setup:**
1. Settings → Pages
2. Source: "GitHub Actions" (NOT "Deploy from branch")
3. Save

### 6. Test Your Setup

**Option A: Manual Trigger (Recommended for first run)**
1. Go to Actions tab
2. Click "Daily Game Generator"
3. Click "Run workflow" dropdown
4. Select branch: `main`
5. Click "Run workflow"

**Option B: Wait for Scheduled Run**
- Automatic at 3:00 AM UTC daily

### 7. Monitor Progress

Watch the three jobs run:
1. ✅ **generate-game** - Creates the game (2-5 min)
2. ✅ **test-game** - Runs automated tests (1-2 min)
3. ✅ **deploy** - Publishes to GitHub Pages (1 min)

### 8. View Your Gallery

Once deployed:
- Visit: `https://YOUR-USERNAME.github.io/daily-flashy-games`
- Should see the example placeholder game
- Tomorrow: Your first AI-generated game appears!

## Verification Checklist

After first run, verify:

- [ ] Actions tab shows successful workflow run (all green)
- [ ] Repository has new folder: `games/YYYY-MM-DD/`
- [ ] Inside folder: `game.jsx`, `game.test.js`, `preview.png`
- [ ] `games-registry.json` has been updated
- [ ] GitHub Pages shows your gallery
- [ ] Gallery loads without errors
- [ ] You can click and "play" the example game

## Common Issues

### ❌ "generate-game" job fails

**Check:** OAuth token is correct
```
Settings → Secrets → CLAUDE_CODE_OAUTH_TOKEN
```

**Common issues:**
- Token expired: Re-run `claude setup-token` and update the secret
- Wrong token: Make sure you copied the complete token value
- Missing token: Verify the secret name is exactly `CLAUDE_CODE_OAUTH_TOKEN`

**To refresh your token:**
```bash
claude setup-token
```
Copy the new token and update the GitHub secret.

### ❌ "test-game" job fails

**Normal on first run!** The example game might not have tests.
Wait for first real game generation tomorrow.

### ❌ "deploy" job doesn't run

**Check:** Pages source is "GitHub Actions"
```
Settings → Pages → Source: GitHub Actions
```

### ❌ Gallery shows 404

**Wait:** Deployment can take 2-5 minutes after job completes.
**Check:** Pages is enabled and deployed successfully in Actions.

## Next Steps

### Local Development (Optional)

```bash
# Install dependencies
npm install

# Run test server locally
npm run serve
# Visit: http://localhost:8080

# Run tests locally
npm test

# Interactive test UI
npm run test:ui
```

### Customize

- **Game frequency:** Edit `.github/workflows/daily-game.yml` cron schedule
- **Game style:** Modify `Claude.md` requirements
- **Gallery theme:** Edit `index.html` colors/layout
- **Test strictness:** Adjust `playwright.config.js`

## Understanding the Magic ✨

Each day at 3 AM UTC:

1. GitHub Actions triggers the workflow
2. Official Claude Code Action (`anthropics/claude-code-action@v1`) starts
3. Reads `Claude.md` instructions via the prompt parameter
4. Checks existing games to avoid duplicates
5. Invents a completely unique game concept
6. Creates folder `games/YYYY-MM-DD/`
7. Writes 500-800 lines of polished React code to `game.jsx`
8. Creates 6 automated tests in `game.test.js`
9. Generates a beautiful preview image as `preview.png`
10. Updates the registry with folder paths
11. Commits everything automatically
12. Tests run automatically
13. If tests pass → Deploys to GitHub Pages
14. Your collection grows! 🎮

## Support

If stuck:
1. Check Actions tab for error messages
2. Review troubleshooting in README.md
3. Verify all steps above completed
4. Check GitHub Discussions (if enabled)

## Success! 🎉

When you see your first AI-generated game:
- Share it! 
- Star the repo ⭐
- Customize Claude.md for your style
- Enjoy a new game every day!

**Pro Tip:** Visit your gallery daily - each game is a surprise! 🎲
