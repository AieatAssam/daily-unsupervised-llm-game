import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-11-16',
  // Skilled play: for the lowest falling step, slide the cheapest way that
  // puts a step over the walker, then wait for it to land.
  play: async (page, { mobile }) => {
    const stage = page.locator('[data-testid="stage"]');
    const box = await stage.boundingBox();
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      const g = await page.evaluate(() => window.__game);
      if (g.phase !== 'playing') break;
      const front = g.rows.reduce((m, r) => (!m || r.y > m.y ? r : m), null);
      if (!front || front.y + g.rowH >= g.line || front.cells[g.walker] === 1) {
        await page.waitForTimeout(40);
        continue;
      }
      // a step in column j reaches the walker after s right-slides or 5-s left-slides
      let best = null;
      front.cells.forEach((v, j) => {
        if (!v) return;
        const s = (g.walker - j + 5) % 5;
        const cand = s <= 5 - s ? { dir: 1, n: s } : { dir: -1, n: 5 - s };
        if (!best || cand.n < best.n) best = cand;
      });
      if (!best) break;
      const pos = { x: box.width * (best.dir > 0 ? 0.75 : 0.25), y: box.height * 0.5 };
      if (mobile) await stage.tap({ position: pos });
      else await stage.click({ position: pos });
      await page.waitForTimeout(90);
    }
  },
  // Losing needs no input: unslid rows drop the walker, three misses end the run.
});
