import { defineGameSuite } from '../../scripts/game-suite.js';

// Look-ahead bot: simulate the ball forward under the same gravity, wall
// bounces and drifting ledges. The first ledge it would hit that is still a
// ghost gets tapped just before the ball arrives. Solid ledges are left alone.
const plan = st => {
  const { ball, phys, ledges } = st;
  const dt = 1 / 120, R = ball.r;
  let sign = ball.vx >= 0 ? 1 : -1;
  let x = ball.x, y = ball.y, vy = ball.vy, t = 0;
  while (t < 1.6) {
    t += dt;
    const prevB = y + R, prevScroll = phys.scroll * (t - dt);
    vy += phys.g * dt; y += vy * dt; x += sign * phys.speed * dt;
    if (x < R) { x = R; sign = 1; }
    else if (x > phys.width - R) { x = phys.width - R; sign = -1; }
    if (vy <= 0) continue;
    for (const L of ledges) {
      const top = L.y - phys.scroll * t;
      const prevTop = L.y - prevScroll;
      if (!(prevB <= prevTop && y + R >= top)) continue;
      if (Math.abs(x - L.x) > L.w / 2 + R * 0.5) continue;
      return L.solid ? null : { L, t };
    }
  }
  return null;
};

defineGameSuite({
  id: '2026-11-27',
  // Skilled play: keep the ball alive by lighting ledges just before it lands.
  play: async (page, { mobile }) => {
    const deadline = Date.now() + 14000;
    const recent = new Map();
    while (Date.now() < deadline) {
      const st = await page.evaluate(() => window.__game && {
        phase: window.__game.phase, ball: window.__game.ball,
        phys: window.__game.phys, ledges: window.__game.ledges,
      });
      if (!st || st.phase !== 'playing' || !st.ball) break;
      const hit = plan(st);
      if (hit && hit.t <= 1.1) {
        const key = `${hit.L.row}:${hit.L.lane}`;
        const last = recent.get(key) ?? 0;
        if (Date.now() - last > 400) {
          recent.set(key, Date.now());
          const target = page.locator(`[data-testid="ledge"][data-row="${hit.L.row}"][data-lane="${hit.L.lane}"]`);
          if (mobile) await target.tap({ force: true, timeout: 1000 }).catch(() => {});
          else await target.click({ force: true, timeout: 1000 }).catch(() => {});
        }
      }
      await page.waitForTimeout(30);
    }
  },
  // Losing needs no input: unlit ledges let the ball fall out three times.
});
