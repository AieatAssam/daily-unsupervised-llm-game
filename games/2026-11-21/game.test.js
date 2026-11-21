import { defineGameSuite } from '../../scripts/game-suite.js';

// Read-only view of the live yard. A train's code is present only while its
// scanner flash is lit, exactly as a human player sees it.
const read = page => page.evaluate(() => {
  const g = window.__game;
  if (!g || g.phase !== 'playing') return null;
  return { buffer: g.buffer, trains: g.trains };
});

const key = (page, ch, mobile) => {
  const loc = page.locator(`[data-testid="key-${ch}"]`);
  return mobile ? loc.tap() : loc.click();
};

// Bot: remember each code the moment its train is lit, then type the code of
// the train closest to the exit gate (smallest right edge). Codes are never
// read while hidden, so it has to catch the flash like a player would.
async function playBot(page, { mobile }, ms) {
  const known = new Map(); // train id -> code, learned from lit flashes only
  const t0 = Date.now();

  while (Date.now() - t0 < ms) {
    const g = await read(page);
    if (!g) break;

    for (const tr of g.trains) if (tr.code) known.set(tr.id, tr.code);
    const live = new Set(g.trains.map(tr => tr.id));
    for (const id of [...known.keys()]) if (!live.has(id)) known.delete(id);

    const urgent = g.trains
      .filter(tr => known.has(tr.id) && known.get(tr.id).startsWith(g.buffer))
      .sort((a, b) => (a.x + a.len) - (b.x + b.len));
    const target = urgent[0];

    if (!target) {
      if (g.buffer) await key(page, 'del', mobile).catch(() => {});
      else await page.waitForTimeout(60);
      continue;
    }
    const next = known.get(target.id)[g.buffer.length];
    await key(page, next, mobile);
    await page.waitForTimeout(30);
  }
}

defineGameSuite({
  id: '2026-11-21',
  // Type the codes of trains as their flashes pass, nearest-to-exit first.
  play: async (page, { mobile }) => {
    await playBot(page, { mobile }, 14000);
  },
  // No lose(): trains that leave the yard unseen cost lives until the depot closes.
});
