import { defineGameSuite } from '../../scripts/game-suite.js';

// Greedy bot: pick the colour that captures the most cells each move.
async function pickBest(page, mobile) {
  const idx = await page.evaluate(() => {
    const g = window.__game;
    if (g.phase !== 'playing') return -1;
    const grid = g.grid, n = grid.length;
    const flood = (cols) => {
      const seen = new Set(['0,0']); const q = [[0, 0]];
      while (q.length) {
        const [r, c] = q.pop();
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = r + dr, b = c + dc, k = a + ',' + b;
          if (a >= 0 && b >= 0 && a < n && b < n && !seen.has(k) && cols(a, b)) { seen.add(k); q.push([a, b]); }
        }
      }
      return seen;
    };
    const own = flood((a, b) => grid[a][b] === grid[0][0]);
    let best = -1, bestN = -1;
    for (let i = 0; i < 6; i++) {
      if (i === g.playerColor) continue;
      const seen = flood((a, b) => own.has(a + ',' + b) || grid[a][b] === i);
      if (seen.size > bestN) { bestN = seen.size; best = i; }
    }
    return best;
  });
  if (idx < 0) return false;
  const loc = page.locator(`[data-testid="color-${idx}"]`);
  if (mobile) await loc.tap(); else await loc.click();
  return true;
}

defineGameSuite({
  id: '2026-03-01',
  play: async (page, { mobile }) => {
    for (let i = 0; i < 12; i++) {
      if (!(await pickBest(page, mobile))) break;
      await page.waitForTimeout(150);
    }
  },
  // Lose on purpose: alternate between two colours until moves run out.
  lose: async (page) => {
    for (let i = 0; i < 40; i++) {
      if ((await page.evaluate(() => window.__game.phase)) !== 'playing') break;
      const pc = await page.evaluate(() => window.__game.playerColor);
      await page.locator(`[data-testid="color-${pc === 0 ? 1 : 0}"]`).click();
    }
  },
});
