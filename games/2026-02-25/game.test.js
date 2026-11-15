import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-02-25',
  // Steer the ball into the gap of the nearest barrier ahead (hold pointer at the gap).
  play: async (page, { mobile }) => {
    const end = Date.now() + 12000;
    let down = false;
    while (Date.now() < end) {
      const g = await page.evaluate(() => window.__game);
      if (g.phase !== 'playing') break;
      const ahead = g.barriers.filter(b => b.y > g.ball.y - 40).sort((a, b) => a.y - b.y)[0];
      let tx = (g.bounds.left + g.bounds.right) / 2;
      if (ahead) tx = (ahead.gapLeft + ahead.gapRight) / 2;
      const c = g.crystals.filter(c => c.y > g.ball.y).sort((a, b) => a.y - b.y)[0];
      if (c && ahead && c.x > ahead.gapLeft && c.x < ahead.gapRight && c.y < ahead.y + 60) tx = c.x;
      const dead = 10;
      if (Math.abs(tx - g.ball.x) < dead) {
        if (down) { await page.mouse.up(); down = false; }
      } else {
        if (!down) { await page.mouse.move(tx, 400); await page.mouse.down(); down = true; }
        else await page.mouse.move(tx, 400);
      }
      await page.waitForTimeout(16);
    }
    if (down) await page.mouse.up();
  },
});
