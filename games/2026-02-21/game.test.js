import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-02-21',
  // Connect the most urgent same-colour pair by dragging between the nodes.
  play: async (page) => {
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      const g = await page.evaluate(() => window.__game);
      if (g.phase !== 'playing') break;
      let best = null;
      const ns = g.nodes.filter(n => n.ready);
      for (const a of ns) for (const b of ns) {
        if (a.id < b.id && a.color === b.color) {
          const t = Math.min(a.timeLeft, b.timeLeft);
          if (!best || t < best.t) best = { a, b, t };
        }
      }
      if (!best) { await page.waitForTimeout(100); continue; }
      await page.mouse.move(best.a.x, best.a.y);
      await page.mouse.down();
      await page.mouse.move((best.a.x + best.b.x) / 2, (best.a.y + best.b.y) / 2, { steps: 3 });
      await page.mouse.move(best.b.x, best.b.y, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(250);
    }
  },
});
