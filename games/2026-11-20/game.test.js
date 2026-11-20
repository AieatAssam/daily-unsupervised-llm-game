import { defineGameSuite } from '../../scripts/game-suite.js';

// Read-only view of the live board (logical coords; board.left/top/scale map to page px).
const read = page => page.evaluate(() => {
  const g = window.__game;
  if (!g || g.phase !== 'playing') return null;
  return { notes: g.notes, hand: g.hand, pot: g.pot, board: g.board, vault: g.vault, floor: g.floor };
});

const W = 360;
const HAND_R = 14;

const distToSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
};

// Bot: steer the hand onto the loud card closest to the floor, route around quiet
// cards, and bank the pot in the vault when it is worth holding no longer.
async function playBot(page, { mobile }, ms) {
  const t0 = Date.now();
  let lastBank = Date.now();
  const vaultPoint = g => ({ x: W / 2, y: g.vault.y + g.vault.h / 2 });
  const toPage = (b, p) => ({ x: b.left + p.x * b.scale, y: b.top + p.y * b.scale });

  while (Date.now() - t0 < ms) {
    const g = await read(page);
    if (!g) break;
    const { board: b, notes, hand, pot } = g;
    const quiet = notes.filter(n => !n.loud);
    const threats = notes.filter(n => n.loud).sort((p, q) => q.y - p.y);
    const now = Date.now();
    const from = hand || vaultPoint(g);

    const bankNow = pot >= 6 || (pot > 0 && now - lastBank > (threats.length ? 7000 : 3000));
    if (bankNow) {
      const v = vaultPoint(g);
      if (mobile) {
        await page.locator('[data-testid="board"]').tap({ position: { x: v.x * b.scale, y: v.y * b.scale } });
      } else {
        const pp = toPage(b, v);
        await page.mouse.click(pp.x, pp.y);
      }
      lastBank = Date.now();
      await page.waitForTimeout(80);
      continue;
    }

    // Retreat from any quiet card the hand is touching: a bust costs the pot.
    const tooClose = hand && quiet.some(q => distToSeg(q.x, q.y, hand.x, hand.y, hand.x, hand.y) < q.r + HAND_R + 3);
    if (tooClose) {
      const v = toPage(b, vaultPoint(g));
      await page.mouse.move(v.x, v.y, { steps: 2 });
      await page.waitForTimeout(40);
      continue;
    }

    const target = threats[0];
    if (target) {
      const clear = quiet.every(q => distToSeg(q.x, q.y, from.x, from.y, target.x, target.y) > q.r + HAND_R + 3);
      if (clear) {
        const p = toPage(b, target);
        await page.mouse.move(p.x, p.y, { steps: 3 });
      }
    }
    await page.waitForTimeout(40);
  }
}

defineGameSuite({
  id: '2026-11-20',
  // Catch the loud cards, route around quiet ones, bank the pot in the vault.
  play: async (page, { mobile }) => {
    await playBot(page, { mobile }, 12000);
  },
  // No lose(): an idle hand lets loud cards leak through the floor, which ends the run.
});
