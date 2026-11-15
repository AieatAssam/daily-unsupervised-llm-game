import { defineGameSuite } from '../../scripts/game-suite.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Reads only what a player can see: the nib, the parcel chip and the stop hit areas.
const readBoard = page => page.evaluate(() => {
  const centre = el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const parcel = document.querySelector('[data-testid="parcel"]');
  return {
    phase: window.__game.phase,
    score: window.__game.score,
    nib: centre(document.querySelector('[data-testid="nib"]')),
    parcel: parcel && parcel.dataset.color,
    stops: [...document.querySelectorAll('[data-testid="station"]')].map(el => ({ ...centre(el), color: el.dataset.color })),
  };
});

defineGameSuite({
  id: '2026-11-15',
  // Route the cart to the nearest stop of the parcel colour, one delivery at a time.
  // Desktop draws from the nib to the stop; mobile taps the stop directly.
  play: async (page, { mobile }) => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const b = await readBoard(page);
      if (b.phase !== 'playing' || b.score >= 40) break;
      const targets = b.stops
        .map((s, i) => ({ ...s, i }))
        .filter(s => s.color === b.parcel);
      if (!targets.length) break;
      const nearest = targets.reduce((a, c) => (dist(c, b.nib) < dist(a, b.nib) ? c : a));
      if (mobile) {
        await page.locator('[data-testid="station"]').nth(nearest.i).tap();
      } else {
        await page.mouse.move(b.nib.x, b.nib.y);
        await page.mouse.down();
        await page.mouse.move(nearest.x, nearest.y, { steps: 12 });
        await page.mouse.up();
      }
      await page.waitForFunction(
        s => window.__game.score !== s || window.__game.phase !== 'playing',
        b.score,
        { timeout: 6000 },
      ).catch(() => {});
    }
  },
  // No lose(): an unfed cart stalls at the rail end and derails within seconds.
});
