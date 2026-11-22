import { defineGameSuite } from '../../scripts/game-suite.js';

// Pick clear cells whose downwind run (where a claim will spread) is longest.
function pickCells(st) {
  const { board, storms, seeds, wind, maxSeeds } = st;
  const storm = new Set(storms.map(s => `${s.c},${s.r}`));
  const seeded = new Set(seeds.map(s => `${s.c},${s.r}`));
  const cands = [];
  for (let c = 0; c < board.cols; c++) for (let r = 0; r < board.rows; r++) {
    if (storm.has(`${c},${r}`) || seeded.has(`${c},${r}`)) continue;
    let run = 0;
    for (let n = 1; n <= 3; n++) {
      const nc = c + wind * n;
      if (nc < 0 || nc >= board.cols || storm.has(`${nc},${r}`)) break;
      run++;
    }
    cands.push({ c, r, value: run * 5 + 10 - c * 0.01 });
  }
  cands.sort((a, b) => b.value - a.value);
  return cands.slice(0, Math.max(0, maxSeeds - seeds.length));
}

// Slingshot: pull so the seed lands on the target cell centre.
async function plantAt(page, st, { c, r }) {
  const { x0, y0, cell } = st.board;
  const T = { x: x0 + (c + 0.5) * cell, y: y0 + (r + 0.5) * cell };
  const d = { x: (st.launcher.x - T.x) / st.gain, y: (st.launcher.y - T.y) / st.gain };
  const P0 = { x: st.width / 2, y: 300 };
  await page.mouse.move(P0.x, P0.y);
  await page.mouse.down();
  await page.mouse.move(P0.x + d.x, P0.y + d.y, { steps: 6 });
  await page.mouse.up();
}

defineGameSuite({
  id: '2026-11-22',
  // Plant seeds on storm-free cells with long downwind runs each plan phase.
  // Around 15 seconds covers two rounds; the game then ends from empty plans.
  play: async (page) => {
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const st = await page.evaluate(() => window.__game);
      if (st.phase !== 'playing') break;
      if (st.mode !== 'plan') { await page.waitForTimeout(100); continue; }
      for (const cell of pickCells(st)) await plantAt(page, st, cell);
      await page.waitForTimeout(100);
    }
  },
  // Losing needs no input: a plan with no seeds is a drought and costs a life.
});
