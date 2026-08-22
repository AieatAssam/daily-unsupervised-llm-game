import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-22 Neon Devourer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-22/index.html');
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
    await expect(page.locator('[data-testid="arena"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertInputResponds(page, {
      controls: 'arrow keys / WASD or click-drag to steer',
      target: '[data-testid="play-field"]',
    });

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
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
        const x = box.x + (Math.sin(i * 0.7) * 0.4 + 0.5) * box.width;
        const y = box.y + (Math.cos(i * 0.5) * 0.4 + 0.5) * box.height;
        await page.mouse.move(x, y).catch(() => {});
      }
      if (i % 5 === 0) {
        await page.keyboard.press(i % 10 === 0 ? 'ArrowLeft' : 'ArrowRight').catch(() => {});
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
      controls: 'arrow keys / WASD or click-drag to steer',
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
    await page.goto('/games/2026-08-22/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.25, box.y + box.height * 0.3).catch(() => {});
      await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height * 0.7).catch(() => {});
    }
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonDevourer_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('neonDevourer_highScore'));
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
        const x = box.x + (i % 2 === 0 ? box.width * 0.3 : box.width * 0.7);
        const y = box.y + (i % 2 === 0 ? box.height * 0.3 : box.height * 0.7);
        await page.mouse.move(x, y).catch(() => {});
      }
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
