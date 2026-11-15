import { defineGameSuite } from '../../scripts/game-suite.js';

// Forward-simulate the orb for both choices (keep / flip) and flip only when
// keeping course would hit a barrier but flipping would not.
const decide = () => {
  const g = window.__game;
  if (!g || g.phase !== 'playing' || !g.player) return false;
  const TAU = Math.PI * 2;
  const safe = (dir0) => {
    let { angle, radius } = g.player;
    let dir = dir0;
    for (let f = 1; f <= 70; f++) {
      angle += g.angSpd;
      radius += dir * g.spirSpd;
      if (radius >= g.maxR) { radius = g.maxR; dir = -1; }
      else if (radius <= g.minR) { radius = g.minR; dir = 1; }
      for (const b of g.barriers) {
        if (Math.abs(radius - b.radius) < 15) {
          const rel = (((angle - (b.gapAngle + b.rotSpd * f)) % TAU) + TAU) % TAU;
          if (rel >= b.gapSize - 0.15 || rel < 0.15) return false;
        }
      }
    }
    return true;
  };
  const d = g.player.direction;
  return !safe(d) && safe(-d);
};

defineGameSuite({
  id: '2026-02-19',
  play: async (page, { mobile }) => {
    const end = Date.now() + 10000;
    while (Date.now() < end) {
      if (await page.evaluate(decide)) {
        if (mobile) await page.locator('[data-testid="play-area"]').tap();
        else await page.keyboard.press('Space');
      }
      await page.waitForTimeout(16);
    }
  },
});
