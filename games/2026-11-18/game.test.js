import { defineGameSuite } from '../../scripts/game-suite.js';

// Bot: taps only molecules inside the sample window whose hue clashes with the
// reference swatch (angular gap > 90°). Positions and hues come from window.__game.
defineGameSuite({
  id: '2026-11-18',
  play: async (page, { mobile }) => {
    const field = page.locator('[data-testid="field"]');
    const box = mobile ? null : await field.boundingBox();
    const t0 = Date.now();
    while (Date.now() - t0 < 16000) {
      const target = await page.evaluate(() => {
        const g = window.__game;
        if (!g || g.phase !== 'playing') return null;
        const gap = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
        const hits = g.molecules
          .filter(m => Math.abs(m.y - g.sensorY) <= g.windowHalf && gap(m.hue, g.swatchHue) > 90)
          .sort((a, b) => Math.abs(a.y - g.sensorY) - Math.abs(b.y - g.sensorY));
        return hits[0] ? { x: hits[0].x, y: hits[0].y } : null;
      });
      if (target) {
        if (mobile) await field.tap({ position: target });
        else await page.mouse.click(box.x + target.x, box.y + target.y);
      }
      await page.waitForTimeout(15);
    }
  },
  // Losing needs no input: an idle player lets clashing molecules pass and loses lives.
});
