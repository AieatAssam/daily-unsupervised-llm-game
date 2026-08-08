/**
 * Playability harness — shared helpers for game tests.
 *
 * The old test standard only proved "clicking doesn't throw". A game could be
 * a dead painting and still pass. These helpers prove the game actually
 * RESPONDS to its controls, stays tuned (fps), and is playable on mobile.
 *
 * Usage in a game's game.test.js:
 *   import { assertInputResponds, assertMobilePlayable, assertPerformanceTuned }
 *     from '../../scripts/playability-harness.js';
 */

import { expect } from '@playwright/test';

/**
 * Install probes BEFORE interacting. Tracks DOM mutations, canvas pixel
 * changes, and rAF ticks so we can detect observable state change.
 */
export async function installProbe(page) {
  await page.evaluate(() => {
    const state = (window.__probe = {
      mutations: 0,
      rafTicks: 0,
      canvasHash: null,
      longTasks: 0,
    });

    const observer = new MutationObserver(muts => {
      state.mutations += muts.length;
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    const tick = () => {
      state.rafTicks++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    if (window.PerformanceObserver) {
      try {
        new PerformanceObserver(list => {
          state.longTasks += list.getEntries().filter(e => e.duration > 500).length;
        }).observe({ entryTypes: ['longtask'] });
      } catch {
        /* longtask unsupported — ignore */
      }
    }

    state.canvasHash = window.__hashCanvases = () => {
      const canvases = document.querySelectorAll('canvas');
      if (!canvases.length) return null;
      // Cheap sample hash: stride through each canvas's pixels.
      let h = 0;
      for (const c of canvases) {
        try {
          const ctx = c.getContext('2d');
          if (!ctx || !c.width || !c.height) continue;
          const w = Math.min(c.width, 64);
          const hgt = Math.min(c.height, 64);
          const data = ctx.getImageData(0, 0, w, hgt).data;
          for (let i = 0; i < data.length; i += 97) {
            h = (h * 31 + data[i]) >>> 0;
          }
        } catch {
          /* webgl / tainted canvas — skip */
        }
      }
      return h;
    };
  });
}

async function probeSnapshot(page) {
  return page.evaluate(() => ({
    mutations: window.__probe.mutations,
    rafTicks: window.__probe.rafTicks,
    canvasHash: window.__hashCanvases ? window.__hashCanvases() : null,
    bodyText: document.body.innerText.slice(0, 2000),
  }));
}

/**
 * Parse a controls hint (registry "controls" field or test-provided string)
 * into concrete Playwright actions.
 */
function controlsToActions(controls) {
  const c = (controls || 'click').toLowerCase();
  const actions = [];
  if (/click|tap|mouse|aim|drag/.test(c)) actions.push('click');
  if (/space/.test(c)) actions.push('Space');
  if (/arrow|wasd|move|steer|keyboard/.test(c)) {
    actions.push('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD');
  }
  if (/type|typing|word|letter/.test(c)) actions.push('type');
  if (/enter/.test(c)) actions.push('Enter');
  if (!actions.length) actions.push('click', 'Space');
  return [...new Set(actions)];
}

async function performActions(page, actions, target) {
  for (const action of actions) {
    if (action === 'click') {
      if (target) {
        await page.locator(target).first().click({ force: true, timeout: 2000 }).catch(() => {});
      } else {
        const box = await page.locator('canvas').first().boundingBox().catch(() => null);
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        } else {
          await page.mouse.click(200, 300);
        }
      }
    } else if (action === 'type') {
      await page.keyboard.type('test', { delay: 30 }).catch(() => {});
    } else {
      await page.keyboard.press(action).catch(() => {});
    }
    await page.waitForTimeout(150);
  }
}

/**
 * Assert the game produces an OBSERVABLE state change when its controls are
 * used. Call after the game has been started (start button clicked etc.).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ controls?: string, target?: string, timeoutMs?: number }} opts
 *   controls — hint string like "click/tap", "arrows + space", "typing".
 *   target   — optional selector to click instead of canvas/body center.
 */
export async function assertInputResponds(page, opts = {}) {
  const { controls = 'click', target = null, timeoutMs = 2500 } = opts;

  await installProbe(page);
  await page.waitForTimeout(300);
  const before = await probeSnapshot(page);

  const actions = controlsToActions(controls);
  await performActions(page, actions, target);
  await page.waitForTimeout(timeoutMs);

  const after = await probeSnapshot(page);

  const domChanged = after.mutations > before.mutations;
  const canvasChanged =
    before.canvasHash !== null && after.canvasHash !== null && after.canvasHash !== before.canvasHash;
  const textChanged = after.bodyText !== before.bodyText;
  const animated = after.rafTicks > before.rafTicks + 10; // rAF alive at minimum

  expect(
    domChanged || canvasChanged || textChanged,
    `Game ignored its controls (${controls}): no DOM mutation, canvas change, or text change observed after input`
  ).toBe(true);
  expect(animated, 'requestAnimationFrame loop appears stalled after input').toBe(true);
}

/**
 * Assert the game is still responsive AFTER a burst of rapid input.
 * Reuses the probe: burst first, then verify state still changes.
 */
export async function assertResponsiveAfterBurst(page, opts = {}) {
  const { controls = 'click', target = null } = opts;
  const actions = controlsToActions(controls);

  // Rapid burst
  for (let i = 0; i < 25; i++) {
    if (actions.includes('click')) {
      const x = 100 + (i * 37) % 250;
      const y = 150 + (i * 53) % 300;
      await page.mouse.click(x, y).catch(() => {});
    }
    for (const a of actions) {
      if (a !== 'click' && a !== 'type') await page.keyboard.press(a).catch(() => {});
    }
    await page.waitForTimeout(20);
  }

  // Must still respond
  await assertInputResponds(page, { controls, target });
}

/**
 * Assert mobile playability at 375x667:
 * - no horizontal overflow
 * - primary buttons are >= 40px tap targets within the viewport
 * - a real tap produces observable change
 *
 * Pass a page created in a touch-enabled context (hasTouch: true).
 */
export async function assertMobilePlayable(page, opts = {}) {
  const { controls = 'tap', buttonSelector = 'button, [data-testid$="-btn"], [role="button"]' } = opts;

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    layout.scrollWidth,
    `Horizontal overflow on mobile: scrollWidth ${layout.scrollWidth} > ${layout.innerWidth}`
  ).toBeLessThanOrEqual(layout.innerWidth + 1);

  const buttons = page.locator(buttonSelector);
  const count = await buttons.count();
  for (let i = 0; i < Math.min(count, 5); i++) {
    const btn = buttons.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    const box = await btn.boundingBox();
    if (!box) continue;
    expect(
      Math.min(box.width, box.height),
      `Tap target ${i} too small: ${box.width}x${box.height}px (min 40px)`
    ).toBeGreaterThanOrEqual(40);
    expect(box.x + box.width, `Tap target ${i} overflows right edge`).toBeLessThanOrEqual(376);
  }

  // Real tap must produce observable change
  await installProbe(page);
  await page.waitForTimeout(300);
  const before = await probeSnapshot(page);

  const tapTarget = (await buttons.count()) > 0 ? buttons.first() : page.locator('body');
  await tapTarget.tap({ timeout: 3000 }).catch(() => page.touchscreen.tap(187, 300));
  await page.waitForTimeout(2000);

  const after = await probeSnapshot(page);
  const changed =
    after.mutations > before.mutations ||
    (before.canvasHash !== null && after.canvasHash !== before.canvasHash) ||
    after.bodyText !== before.bodyText;
  expect(changed, 'Game did not respond to mobile tap').toBe(true);
}

/**
 * Assert performance tuning during active gameplay: average >= 30fps over a
 * 2s sample and no long tasks > 500ms (input-lag proxy).
 */
export async function assertPerformanceTuned(page, { minFps = 30, sampleMs = 2000 } = {}) {
  const stats = await page.evaluate(async sampleMs => {
    const start = performance.now();
    let frames = 0;
    await new Promise(resolve => {
      const tick = () => {
        frames++;
        if (performance.now() - start < sampleMs) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return {
      fps: (frames / (performance.now() - start)) * 1000,
      longTasks: window.__probe ? window.__probe.longTasks : 0,
    };
  }, sampleMs);

  expect(
    stats.fps,
    `Performance below playable threshold: ${stats.fps.toFixed(1)}fps < ${minFps}fps`
  ).toBeGreaterThanOrEqual(minFps);
  expect(stats.longTasks, `${stats.longTasks} long task(s) > 500ms during gameplay`).toBe(0);
}
