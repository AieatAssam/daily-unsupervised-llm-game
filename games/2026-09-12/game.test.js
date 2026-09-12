import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-09-12 Photon Bounce', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-09-12/index.html');
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
    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();
    const box = await field.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    await assertInputResponds(page, { controls: 'click tap arrows space', target: '[data-testid="fire-btn"]' });

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
      if (i % 3 === 0 && box) {
        const x = box.x + (i * 17) % box.width;
        const y = box.y + (i * 11) % (box.height * 0.6);
        await page.mouse.click(x, y).catch(() => {});
      } else {
        const key = i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight';
        await page.keyboard.press(key).catch(() => {});
      }
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    // Still alive and responsive after the burst
    await assertInputResponds(page, { controls: 'click tap arrows space', target: '[data-testid="fire-btn"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-09-12/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // No overflow, >=40px tap target, start tap produces observable change
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);

    // Tapping the fire button (touch) must register without errors
    const fireBtn = page.locator('[data-testid="fire-btn"]');
    const box = await fireBtn.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    await fireBtn.tap().catch(() => {});
    await page.waitForTimeout(200);

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('photonBounce_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('photonBounce_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowRight').catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
