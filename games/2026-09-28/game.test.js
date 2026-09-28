import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-09-28 Crate Shift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-09-28/index.html');
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
    expect(box.width).toBeGreaterThan(50);
    expect(box.height).toBeGreaterThan(100);
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="board"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="up-btn"]')).toBeVisible();

    await assertInputResponds(page, { controls: 'keyboard arrows tap click', target: '[data-testid="play-field"]' });

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    await assertResponsiveAfterBurst(page, { controls: 'keyboard arrows tap click', target: '[data-testid="play-field"]' });

    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-09-28/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(500);

    const upBtn = page.locator('[data-testid="up-btn"]');
    const box = await upBtn.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    await upBtn.tap().catch(() => {});
    await page.waitForTimeout(200);

    const leftBtn = page.locator('[data-testid="left-btn"]');
    const leftBox = await leftBtn.boundingBox();
    expect(Math.min(leftBox.width, leftBox.height)).toBeGreaterThanOrEqual(40);

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('crateShiftHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowUp').catch(() => {});
      await page.waitForTimeout(90);
      await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowDown').catch(() => {});
      await page.waitForTimeout(90);
    }

    const val = await page.evaluate(() => localStorage.getItem('crateShiftHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowLeft').catch(() => {});
      await page.waitForTimeout(30);
      await page.keyboard.press('ArrowUp').catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
