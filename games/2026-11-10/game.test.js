import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-11-10',
  // Skilled play: alternate left/right pulls — repeating a side slips.
  play: async (page, { mobile }) => {
    for (let i = 0; i < 40; i++) {
      const side = i % 2 ? 'right' : 'left';
      if (mobile) await page.locator(`[data-testid="${side}-btn"]`).tap();
      else await page.keyboard.press(side === 'left' ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(120);
    }
  },
  // Losing needs no input: the rival out-pulls an idle player.
});
