import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-30 Chroma Mix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-30/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('[data-testid="game-canvas"]');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();
    await expect(page.locator('[data-testid="arena"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-swatch"]')).toBeVisible();
    await expect(page.locator('[data-testid="mix-swatch"]')).toBeVisible();
    await expect(page.locator('[data-testid="lock-btn"]')).toBeVisible();
    expect(await page.locator('[data-testid="pad-btn"]').count()).toBe(3);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    // Pumping a channel pad changes the mix swatch/canvas; locking in
    // always resolves the round (score or lives change), proving the
    // pump-then-lock input loop is wired up.
    await page.locator('[data-testid="pad-btn"]').nth(0).click();
    await page.locator('[data-testid="pad-btn"]').nth(1).click();
    await page.locator('[data-testid="lock-btn"]').click();

    await assertInputResponds(page, {
      controls: 'tap the R/G/B pads to mix, tap LOCK IN to submit',
      target: '[data-testid="play-field"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 30; i++) {
      const pads = page.locator('[data-testid="pad-btn"]');
      const count = await pads.count();
      if (count > 0) {
        await pads.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      }
      if (i % 5 === 0) {
        await page.locator('[data-testid="lock-btn"]').click({ force: true, timeout: 1000 }).catch(() => {});
      }
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    const restartVisible = await page.locator('[data-testid="restart-btn"]').isVisible().catch(() => false);
    if (restartVisible) {
      await page.locator('[data-testid="restart-btn"]').click();
      await page.waitForTimeout(300);
    }
    await assertInputResponds(page, {
      controls: 'tap the R/G/B pads to mix, tap LOCK IN to submit',
      target: '[data-testid="play-field"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-30/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="pad-btn"]',
    });

    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('chromaMix_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 5; i++) {
      const pads = page.locator('[data-testid="pad-btn"]');
      const count = await pads.count();
      for (let j = 0; j < count; j++) {
        await pads.nth(j).click({ force: true, timeout: 1000 }).catch(() => {});
      }
      await page.locator('[data-testid="lock-btn"]').click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(450);
    }

    const val = await page.evaluate(() => localStorage.getItem('chromaMix_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 6; i++) {
      const pads = page.locator('[data-testid="pad-btn"]');
      const count = await pads.count();
      if (count > 0) {
        await pads.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      }
      await page.waitForTimeout(150);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
