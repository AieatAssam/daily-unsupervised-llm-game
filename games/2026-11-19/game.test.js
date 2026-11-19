import { defineGameSuite } from '../../scripts/game-suite.js';

const TOK_BTN = { U: 'tok-up', F: 'tok-flat', D: 'tok-down', W: 'tok-wait' };
const TOK_KEY = { U: 'ArrowUp', F: 'ArrowRight', D: 'ArrowDown', W: 'Space' };

// Best plan for the current route, read from the live state: dynamic programming over
// (column, row, tokens queued). Mirrors the game's rules: a hop needs a leaf at the target,
// and the bee is hit if a wasp occupies its landing cell on that beat (row = rows[(beat+phase)%2]).
function planBest(g) {
  const { cols, L } = g.route;
  const rowAt = (w, t) => w.rows[(t + w.phase) % 2];
  const leafAt = (c, r) => cols[c].leaves.find(l => l.row === r);
  const cell = (c, r) => c * 4 + r;
  let layer = new Map([[cell(g.bee.col, g.bee.row), { c: g.bee.col, r: g.bee.row, score: 0, path: [] }]]);
  let best = null;
  const consider = s => {
    if (!best || s.score > best.score || (s.score === best.score && s.path.length > best.path.length)) best = s;
  };
  for (let k = 0; k < g.maxPlan && layer.size; k++) {
    const next = new Map();
    const t = g.beat + k + 1;
    const put = (c, r, score, path) => {
      const key = cell(c, r), cur = next.get(key);
      if (!cur || score > cur.score) next.set(key, { c, r, score, path });
    };
    for (const s of layer.values()) {
      consider(s);
      // WAIT: hover for a beat in place
      if (!(cols[s.c].wasp && rowAt(cols[s.c].wasp, t) === s.r)) put(s.c, s.r, s.score, [...s.path, 'W']);
      // hops forward: up, flat, down
      for (const tok of ['U', 'F', 'D']) {
        const nc = s.c + 1, nr = s.r + (tok === 'U' ? 1 : tok === 'D' ? -1 : 0);
        if (nc > L || nr < 0 || nr > 3) continue;
        const leaf = leafAt(nc, nr);
        if (!leaf) continue;
        if (cols[nc].wasp && rowAt(cols[nc].wasp, t) === nr) continue;
        const gain = (leaf.flower ? 100 : 0) + (nc === L ? 1000 : 0);
        const ns = { c: nc, r: nr, score: s.score + gain, path: [...s.path, tok] };
        if (nc === L) consider(ns); else put(nc, nr, ns.score, ns.path);
      }
    }
    layer = next;
  }
  for (const s of layer.values()) consider(s);
  return best ? best.path : [];
}

defineGameSuite({
  id: '2026-11-19',
  // Plan the flight from the live route (what the bee can reach, when wasps are on each leaf),
  // queue it, press FLY, repeat. Lands on nectar and clears routes.
  play: async (page, { mobile }) => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const g = await page.evaluate(() => window.__game);
      if (!g || g.phase !== 'playing') break;
      if (g.stage !== 'plan') { await page.waitForTimeout(120); continue; }
      const plan = planBest(g);
      if (!plan.length) { await page.waitForTimeout(200); continue; }
      for (const tok of plan) {
        if (mobile) await page.locator(`[data-testid="${TOK_BTN[tok]}"]`).tap();
        else await page.keyboard.press(TOK_KEY[tok]);
        await page.waitForTimeout(90);
      }
      if (mobile) await page.locator('[data-testid="fly-btn"]').tap();
      else await page.keyboard.press('Enter');
      // let the bee fly the route before planning again
      await page.waitForFunction(() => window.__game?.stage !== 'fly' || window.__game?.phase !== 'playing', null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  },
  // Losing needs no input: an idle player's planning timer runs out three times.
});
