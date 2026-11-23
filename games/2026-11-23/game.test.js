import { defineGameSuite } from '../../scripts/game-suite.js';

const readState = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__game)));

async function drag(page, from, toX) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(toX, from.y, { steps: 6 });
  await page.mouse.up();
}

defineGameSuite({
  id: '2026-11-23',
  // Read the ghost bar's goal boundaries and drag the white handles onto them.
  // Each boundary moves toward its goal; the one that must travel leftward
  // goes first so the segment minimum is never violated.
  play: async page => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const s = await readState(page);
      if (s.phase !== 'playing') break;
      const [h1, h2] = s.handles;
      const [g1, g2] = s.goals;
      const aligned = (h, g) => Math.abs(h.x - g.x) <= 1.5;
      const order = g1.x < h1.x ? [[h1, g1], [h2, g2]] : [[h2, g2], [h1, g1]];
      const next = order.find(([h, g]) => !aligned(h, g));
      if (next) {
        const [h, g] = next;
        await drag(page, h, g.x);
        await page.waitForTimeout(40);
      } else {
        // Both boundaries on the ghost: hold it until the match completes.
        await page.waitForTimeout(120);
      }
    }
  },
  // Losing needs no input: an idle bar misses each goal until three misses end the shift.
});
