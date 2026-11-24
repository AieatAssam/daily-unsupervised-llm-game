import { defineGameSuite } from '../../scripts/game-suite.js';

// Greedy lane picker: stay in the lane with the most upcoming pearl value,
// swap out of a lane when a rock is closing on it, and avoid the outer lane
// of a bend once grip is low.
const pickLane = g => {
  const score = lane => {
    let s = 0;
    for (const p of g.pearls) {
      if (p.lane !== lane) continue;
      const d = g.car.y - p.y;
      if (d > -30 && d < 170) s += (p.gold ? 3 : 1) * (1 - Math.max(0, d) / 260);
    }
    for (const r of g.rocks) {
      if (r.lane !== lane) continue;
      const d = g.car.y - r.y;
      if (d > -40 && d < 230) s -= 10 + (230 - d) / 10;
    }
    if (g.bend && g.outerLane === lane && g.grip < 0.5) s -= 3;
    return s;
  };
  const a = score(-1), b = score(1);
  if (a === b) return g.lane;
  return a > b ? -1 : 1;
};

defineGameSuite({
  id: '2026-11-24',
  // Reads pearls/rocks/grip from window.__game each tick and swaps lanes to
  // collect gold on bends while dodging rocks. Waits after each swap so the
  // game's swap cooldown is respected and the bot never double-toggles.
  play: async (page, { mobile }) => {
    const canvas = page.locator('canvas');
    const deadline = Date.now() + 14000;
    while (Date.now() < deadline) {
      const g = await page.evaluate(() => window.__game);
      if (!g || g.phase !== 'playing') break;
      if (pickLane(g) !== g.lane) {
        if (mobile) await canvas.tap();
        else await canvas.click();
        await page.waitForTimeout(150);
      } else {
        await page.waitForTimeout(40);
      }
    }
  },
  // No lose(): an idle player drifts on the outer lane of bends until grip
  // spins them out and rocks finish the hull.
});
