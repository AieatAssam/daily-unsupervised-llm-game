import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-02-17',
  // Type the lowest falling word, via keyboard or on-screen keys.
  play: async (page, { mobile }) => {
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      const g = await page.evaluate(() => window.__game);
      if (g.phase !== 'playing') break;
      const w = [...g.words].sort((a, b) => b.progress - a.progress)[0];
      if (!w) { await page.waitForTimeout(150); continue; }
      const rest = g.typed && w.text.startsWith(g.typed) ? w.text.slice(g.typed.length) : w.text;
      for (const ch of rest) {
        if (mobile) await page.locator(`[data-testid="key-${ch}"]`).tap();
        else await page.keyboard.press(ch);
        await page.waitForTimeout(40);
      }
    }
  },
});
