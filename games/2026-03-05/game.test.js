import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-03-05',
  // Skilled play: tap each ball exactly while it is at its apex.
  play: async (page, { mobile }) => {
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      const b = await page.evaluate(() => (window.__game.balls || []).find(b => b.state === 'apex'));
      if (b) {
        if (mobile) await page.touchscreen.tap(b.x, b.y);
        else await page.mouse.click(b.x, b.y);
        await page.waitForTimeout(80);
      } else {
        await page.waitForTimeout(30);
      }
    }
  },
});
