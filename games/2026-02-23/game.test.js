import { defineGameSuite } from '../../scripts/game-suite.js';

const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

// Pick a safe direction that heads for the nearest node.
const decide = () => {
  const g = window.__game;
  if (!g || g.phase !== 'playing' || !g.head) return null;
  const occ = new Set(g.snake.slice(0, -1).map(s => s.x + ',' + s.y));
  const D = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  let best = null;
  for (const [k, [dx, dy]] of Object.entries(D)) {
    if (dx === -g.dir.x && dy === -g.dir.y && (dx || dy)) continue;
    const nx = g.head.x + dx, ny = g.head.y + dy;
    if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || occ.has(nx + ',' + ny)) continue;
    const dist = Math.min(...g.nodes.map(n => Math.abs(n.x - nx) + Math.abs(n.y - ny)));
    if (!best || dist < best.dist) best = { k, dist };
  }
  return best && best.k;
};

defineGameSuite({
  id: '2026-02-23',
  play: async (page, { mobile }) => {
    const end = Date.now() + 14000;
    let last = null;
    while (Date.now() < end) {
      const k = await page.evaluate(decide);
      if (k && k !== last) {
        if (mobile) {
          const [dx, dy] = DIRS[k];
          await page.mouse.move(180, 330);
          await page.mouse.down();
          await page.mouse.move(180 + dx * 40, 330 + dy * 40, { steps: 2 });
          await page.mouse.up();
        } else {
          await page.keyboard.press({ U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' }[k]);
        }
        last = k;
      }
      await page.waitForTimeout(40);
    }
  },
});
