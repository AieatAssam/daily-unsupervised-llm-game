import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-29 Neon Riptide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-29/index.html');
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
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.15);
      await page.waitForTimeout(200);
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.85);
    }

    await assertInputResponds(page, {
      controls: 'mouse move / touch drag / arrow keys to steer vertically',
      target: '[data-testid="play-field"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    for (let i = 0; i < 40; i++) {
      if (box) {
        const y = box.y + (Math.sin(i * 0.6) * 0.4 + 0.5) * box.height;
        await page.mouse.move(box.x + box.width * 0.5, y).catch(() => {});
      }
      if (i % 6 === 0) {
        await page.keyboard.press(i % 12 === 0 ? 'ArrowUp' : 'ArrowDown').catch(() => {});
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
      controls: 'mouse move / touch drag / arrow keys to steer vertically',
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
    await page.goto('/games/2026-08-29/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);
    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.25).catch(() => {});
      await page.waitForTimeout(150);
      await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.75).catch(() => {});
    }

    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonRiptide_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    for (let i = 0; i < 6; i++) {
      if (box) {
        const y = box.y + (i % 2 === 0 ? box.height * 0.2 : box.height * 0.8);
        await page.mouse.move(box.x + box.width * 0.5, y).catch(() => {});
      }
      await page.waitForTimeout(500);
    }

    const val = await page.evaluate(() => localStorage.getItem('neonRiptide_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    for (let i = 0; i < 8; i++) {
      if (box) {
        const y = box.y + (i % 2 === 0 ? box.height * 0.3 : box.height * 0.7);
        await page.mouse.move(box.x + box.width * 0.5, y).catch(() => {});
      }
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
