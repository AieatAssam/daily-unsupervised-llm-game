# 🔐 OAuth Authentication Guide

This guide explains how to authenticate Claude Code with your Claude Pro account using OAuth tokens for the GitHub Actions workflow.

## Why OAuth Instead of API Keys?

✅ **OAuth Authentication (Recommended):**
- Uses your Claude Pro subscription directly
- No separate API billing
- Seamless integration with claude.ai account
- Better security with token-based auth
- Available for Pro and Max users

❌ **API Key Authentication (Alternative):**
- Requires separate API billing setup
- May have different rate limits
- Less integrated with Pro subscription

## Step-by-Step Setup

### 1. Install Claude Code CLI

Open your terminal and install globally:

```bash
npm install -g @anthropic-ai/claude-code
```

Verify installation:
```bash
claude --version
```

### 2. Generate Your OAuth Token

Run the setup-token command:

```bash
claude setup-token
```

**What happens:**
1. The command connects to your Claude account
2. Generates an OAuth token for GitHub Actions usage
3. Displays the token in your terminal

**Example output:**
```
Your OAuth token (keep this secret!):
oauth_1234567890abcdefghijklmnopqrstuvwxyz

Add this to your GitHub repository secrets as CLAUDE_CODE_OAUTH_TOKEN
```

### 3. Copy the OAuth Token

Copy **the entire token value** displayed in your terminal.

**Important:** 
- ✅ Copy the complete token (starts with `oauth_`)
- ✅ Keep it secret - never share or commit to git
- ✅ Token is displayed only once - save it immediately

### 4. Add to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Enter secret details:
   - **Name:** `CLAUDE_CODE_OAUTH_TOKEN`
   - **Value:** Paste your token (starts with `oauth_`)
6. Click **Add secret**

### 5. Verify Setup

The secret should now appear in your list:
```
CLAUDE_CODE_OAUTH_TOKEN
Updated X minutes ago
```

## Token Expiration & Renewal

### How Long Do Tokens Last?

OAuth tokens typically last for **30-90 days**.

### Signs Your Token Expired

The workflow fails with errors like:
- "Authentication failed"
- "Invalid OAuth token"
- "Token expired"

### Renewing Your Token

**Step 1: Generate new token**
```bash
claude setup-token
```

**Step 2: Copy the new token** displayed in the terminal

**Step 3: Update GitHub secret**
1. Go to Settings → Secrets → Actions
2. Click on `CLAUDE_CODE_OAUTH_TOKEN`
3. Click **Update secret**
4. Paste new token value
5. Click **Update secret**

### Proactive Renewal

Set a calendar reminder for token renewal:
- Renew **every 60 days** to be safe
- Update GitHub secret immediately after renewal
- Test the workflow after updating

## Testing Authentication

### Test Locally

Before committing to GitHub, test authentication works:

```bash
# Simple test command
claude --message "Hello! Confirm authentication works."
```

If successful, you'll see Claude respond.

### Test in GitHub Actions

Trigger a manual workflow run:
1. Go to **Actions** tab
2. Select **Daily Game Generator**
3. Click **Run workflow**
4. Watch the "generate-game" job

**Success:** Job completes, game is generated  
**Failure:** Check job logs for authentication errors

## Security Best Practices

### ✅ Do:
- Keep your OAuth token secret
- Use GitHub secrets (encrypted storage)
- Rotate tokens periodically (every 60-90 days)
- Set reminders for token renewal
- Never commit tokens to repositories

### ❌ Don't:
- Share your token publicly
- Commit tokens to git
- Use tokens in client-side code
- Hardcode tokens in workflow files

## Troubleshooting

### "CLAUDE_CODE_OAUTH_TOKEN not set"

**Cause:** Secret not configured in GitHub  
**Fix:** Follow steps 4-5 above to add the secret

### "Authentication failed" 

**Cause 1:** Token expired  
**Fix:** Run `claude setup-token` again and update the secret

**Cause 2:** Wrong token copied  
**Fix:** Ensure you copied the complete token starting with `oauth_`

**Cause 3:** Secret name typo  
**Fix:** Verify secret is named exactly `CLAUDE_CODE_OAUTH_TOKEN` (case-sensitive)

### "Invalid oauth token format"

**Cause:** Token not copied correctly  
**Fix:** Re-run `claude setup-token` and copy the full output token

### "Command not found: claude"

**Cause:** Claude Code CLI not installed  
**Fix:** Run `npm install -g @anthropic-ai/claude-code`

### Token not displayed after running command

**Cause:** Not logged in or connection issue  
**Fix:** Ensure you have an active Claude Pro or Max subscription

## Requirements

**To use OAuth authentication you need:**
- ✅ Claude Pro or Claude Max subscription
- ✅ Node.js 18+ installed
- ✅ Claude Code CLI installed globally
- ✅ Active internet connection

**If you don't have Pro/Max:**
Use API key authentication instead:
1. Get API key from https://console.anthropic.com/settings/keys
2. Add as `ANTHROPIC_API_KEY` secret in GitHub
3. Update workflow to use `ANTHROPIC_API_KEY` environment variable

## FAQ

**Q: Do I need Claude Pro for this?**  
A: Yes, `claude setup-token` requires a Claude Pro or Max subscription.

**Q: How much does this cost?**  
A: Uses your existing Claude Pro subscription. No additional API costs.

**Q: Can I use the same token for multiple repos?**  
A: Yes, but for security it's better to generate separate tokens per project.

**Q: What happens if my token expires mid-month?**  
A: Workflow will fail until you generate a new token and update the secret.

**Q: Can I automate token renewal?**  
A: Not currently. You need to manually run `claude setup-token` periodically.

**Q: Is my token stored securely on GitHub?**  
A: Yes, GitHub Secrets are encrypted at rest and in transit.

**Q: Where is the token stored locally?**  
A: The token is not stored locally - it's generated on-demand and only displayed once.

## Support

If you're still having issues:

1. Verify you have an active Claude Pro/Max subscription
2. Check GitHub Actions logs for detailed error messages
3. Ensure `claude --version` shows the latest version
4. Try re-installing: `npm install -g @anthropic-ai/claude-code@latest`
5. Check Anthropic's documentation for Claude Code updates

---

**Ready?** Once your OAuth token is set up, your workflow will automatically generate new games daily using your Claude Pro account! 🎮
