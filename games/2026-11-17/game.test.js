import { defineGameSuite } from '../../scripts/game-suite.js';

defineGameSuite({
  id: '2026-11-17',
  // Skilled play: keep the pointer down in the lane of the car nearest the curb
  // that has no tall barrier yet; slide to the next lane when it is covered.
  // Release when nothing needs cover so concrete regenerates.
  play: async (page, { mobile }) => {
    const stage = page.locator('[data-testid="stage"]');
    const box = await stage.boundingBox();
    const toPage = (gx, gy) => ({ x: box.x + (gx / 360) * box.width, y: box.y + (gy / 600) * box.height });
    const end = Date.now() + 14000;
    let held = null;
    const press = async lane => {
      const p = toPage((lane + 0.5) * (360 / 4), 300);
      if (held === null) {
        await page.mouse.move(p.x, p.y);
        await page.mouse.down();
      } else if (held !== lane) {
        await page.mouse.move(p.x, p.y, { steps: 2 });
      }
      held = lane;
    };
    const release = async () => {
      if (held === null) return;
      await page.mouse.up();
      held = null;
    };
    while (Date.now() < end) {
      const g = await page.evaluate(() => window.__game);
      if (g.phase !== 'playing') break;
      // cars still above the curb, nearest the curb first; a lane is covered by a barrier at least 150px tall
      const cars = g.cars.slice().sort((a, b) => b.bottom - a.bottom);
      const need = cars.find(c => {
        const b = g.barriers.find(x => x.lane === c.lane);
        return !b || b.h < 150;
      });
      if (!need) {
        await release();
        await page.waitForTimeout(60);
        continue;
      }
      if (g.energy < 3 && held === null) {
        // no concrete: wait for regen
        await page.waitForTimeout(80);
        continue;
      }
      await press(need.lane);
      await page.waitForTimeout(mobile ? 40 : 30);
    }
    await release();
  },
  // Losing needs no input: cars that reach the curb uncovered cost lives; three end the run.
});
