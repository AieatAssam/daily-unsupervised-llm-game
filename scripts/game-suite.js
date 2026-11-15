/**
 * Standard play-test suite for every new game.
 *
 * A game's game.test.js is just:
 *
 *   import { defineGameSuite } from '../../scripts/game-suite.js';
 *   defineGameSuite({
 *     id: '2026-11-16',
 *     play: async (page, { mobile }) => { ...play WELL for ~10s, must score... },
 *     lose: async (page) => { ...optional: how to lose on purpose... },
 *   });
 *
 * The suite does not trust the game: it plays it. It relies on the game
 * contract from AGENTS.md:
 *   window.__game = { phase: 'menu' | 'playing' | 'over', score: number }   (kept live)
 *   [data-testid="start-btn"]  visible in 'menu' and 'over', starts / restarts
 *   localStorage['arcade.<id>.best']  best score, written at game over
 *
 * Side effect: writes a filmstrip + metrics.json to playtest/<id>/ (gitignored)
 * so a reviewer can look at what the game was actually like to play.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// CI runners rasterise canvas glow in software on 2 cores; 30fps there is not
// achievable for games that run at 60 on any real device.
const MIN_FPS = process.env.CI ? 15 : 30;
const START = '[data-testid="start-btn"]';

const game = page => page.evaluate(() => ({ phase: window.__game?.phase, score: Number(window.__game?.score) }));
const waitPhase = (page, phase, timeout = 15000) =>
  page.waitForFunction(p => window.__game?.phase === p, phase, { timeout });

async function measureFps(page, ms = 2000) {
  return page.evaluate(ms => new Promise(resolve => {
    const t0 = performance.now();
    let frames = 0;
    const tick = () => {
      frames++;
      const dt = performance.now() - t0;
      dt < ms ? requestAnimationFrame(tick) : resolve((frames / dt) * 1000);
    };
    requestAnimationFrame(tick);
  }), ms);
}

async function overflowX(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

export function defineGameSuite({ id, play, lose }) {
  const url = `/games/${id}/index.html`;
  const bestKey = `arcade.${id}.best`;
  const outDir = `playtest/${id}`;

  test.describe(`${id} play-test`, () => {
    let errors;

    const open = async page => {
      errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => {
        if (m.type() === 'error' && !/favicon|Failed to load resource/i.test(m.text())) errors.push(m.text());
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitPhase(page, 'menu', 30000); // covers CDN + Babel compile
    };
    const start = async page => {
      await page.locator(START).click();
      await waitPhase(page, 'playing', 5000);
    };

    test.beforeEach(async ({ page }) => open(page));
    test.afterEach(() => expect(errors, 'JS errors during the test').toEqual([]));

    test('boots to a real menu', async ({ page }) => {
      await expect(page.locator(START)).toBeVisible();
      expect((await game(page)).score, 'score before starting').toBe(0);
      // ponytail: PNG size as a blank-screen detector; a flat frame compresses
      // to a few KB. Swap for pixel variance if a legit minimal menu trips it.
      const shot = await page.screenshot();
      expect(shot.length, 'menu screenshot looks blank').toBeGreaterThan(12000);
    });

    test('does not kill an idle player instantly', async ({ page }) => {
      await start(page);
      await page.waitForTimeout(3000);
      expect((await game(page)).phase, 'game ended within 3s with no input — unfair opening').toBe('playing');
    });

    test('skilled play scores, the game ends, best is saved, restart resets', async ({ page }) => {
      test.setTimeout(150000);
      fs.mkdirSync(outDir, { recursive: true });

      await start(page);
      const t0 = Date.now();
      let firstScoreMs = null;
      let peak = 0;
      let frame = 0;
      const sampler = setInterval(async () => {
        const g = await game(page).catch(() => null);
        if (!g) return;
        if (g.score > 0 && firstScoreMs === null) firstScoreMs = Date.now() - t0;
        peak = Math.max(peak, g.score || 0);
      }, 200);
      const camera = setInterval(() => {
        page.screenshot({ path: `${outDir}/play-${String(++frame).padStart(2, '0')}.png` }).catch(() => {});
      }, 1500);

      let fps;
      try {
        await play(page, { mobile: false });
        peak = Math.max(peak, (await game(page)).score || 0);
        expect(peak, 'play() never scored — controls dead, or the game is too hard to score in').toBeGreaterThan(0);
        expect(firstScoreMs ?? Date.now() - t0, 'first point took over 20s — too slow to hook a player').toBeLessThan(20000);

        if ((await game(page)).phase === 'playing') fps = await measureFps(page);

        if ((await game(page)).phase !== 'over') {
          if (lose) await lose(page);
          await waitPhase(page, 'over', 90000).catch(() => {
            throw new Error('game never reached phase "over" within 90s — provide lose(page) or fix the fail state');
          });
        }
      } finally {
        clearInterval(sampler);
        clearInterval(camera);
      }
      await page.screenshot({ path: `${outDir}/over.png` });
      const playMs = Date.now() - t0;

      const best = await page.evaluate(k => localStorage.getItem(k), bestKey);
      expect(Number(best), `localStorage["${bestKey}"] should hold the best score`).toBeGreaterThanOrEqual(1);

      await expect(page.locator(START), 'no restart button on game over').toBeVisible();
      await start(page);
      expect((await game(page)).score, 'score not reset on restart').toBe(0);

      if (fps === undefined) fps = await measureFps(page);
      fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify({ id, firstScoreMs, peakScore: peak, playMs, fps: Math.round(fps) }, null, 2));
      expect(fps, `only ${fps.toFixed(0)}fps during play`).toBeGreaterThanOrEqual(MIN_FPS);
    });

    test('survives input mashing', async ({ page }) => {
      await start(page);
      const { width, height } = page.viewportSize();
      const keys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'KeyA', 'KeyD'];
      for (let i = 0; i < 40; i++) {
        await page.mouse.click(20 + ((i * 97) % (width - 40)), 20 + ((i * 61) % (height - 40)));
        await page.keyboard.press(keys[i % keys.length]);
      }
      const fps = await measureFps(page, 1000);
      expect(fps, 'render loop stalled after input mashing').toBeGreaterThan(5);
      expect(['playing', 'over']).toContain((await game(page)).phase);
    });

    test('is playable on a phone', async ({ browser }) => {
      test.setTimeout(90000);
      const context = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      try {
        await open(page);
        expect(await overflowX(page), 'horizontal overflow on menu at 375px').toBeLessThanOrEqual(1);
        const box = await page.locator(START).boundingBox();
        expect(Math.min(box.width, box.height), 'start button under 44px').toBeGreaterThanOrEqual(44);
        expect(box.x >= 0 && box.x + box.width <= 375 && box.y >= 0 && box.y + box.height <= 667, 'start button off-screen').toBe(true);

        await page.locator(START).tap();
        await waitPhase(page, 'playing', 5000);
        await play(page, { mobile: true });
        await page.screenshot({ path: `${outDir}/mobile.png` }).catch(() => {});
        expect((await game(page)).score, 'play({mobile:true}) never scored — touch controls missing?').toBeGreaterThan(0);
        expect(await overflowX(page), 'horizontal overflow during play at 375px').toBeLessThanOrEqual(1);
      } finally {
        await context.close();
      }
    });
  });
}
