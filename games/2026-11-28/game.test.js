import { defineGameSuite } from '../../scripts/game-suite.js';

// Bot: reads live item positions and draws short ink strokes through them.
// Debris close to the hull is covered first; otherwise the lowest gold is collected.
async function stroke(page, x, y, half = 30) {
  await page.mouse.move(x - half, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x - half + (i * half * 2) / 6, y);
  await page.mouse.up();
}

defineGameSuite({
  id: '2026-11-28',
  // Play WELL for ~13 seconds. Must earn points.
  play: async (page) => {
    const end = Date.now() + 13000;
    while (Date.now() < end) {
      const s = await page.evaluate(() => window.__game);
      if (!s || s.phase !== 'playing') break;
      const threat = s.debris
        .filter(d => d.y > s.hullY - 150 && d.y < s.hullY)
        .sort((a, b) => b.y - a.y)[0];
      const gold = s.gold
        .filter(g => g.y > 40 && g.y < s.hullY - 20)
        .sort((a, b) => b.y - a.y)[0];
      const target = threat || gold;
      if (target) {
        await stroke(page, target.x, target.y);
      } else {
        // nothing to catch yet: a short stroke near the top keeps the field moving
        await stroke(page, 120 + Math.random() * 120, 120, 20);
      }
      await page.waitForTimeout(40);
    }
  },
  // Idle play is the loss: the field drifts on and debris reaches the hull.
});
