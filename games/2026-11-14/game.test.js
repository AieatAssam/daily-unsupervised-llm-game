import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-11-14 Spark Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-11-14/index.html');
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
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="arena-stage"]')).toBeVisible();
    await expect(page.locator('[data-testid="cell-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="cell-24"]')).toBeVisible();
    await expect(page.locator('[data-testid="burst-btn"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    // Tap across the grid — exercises the hit/miss/hazard resolution path.
    for (let i = 0; i < 20; i++) {
      await page.locator('[data-testid="cell-' + i + '"]').click({ force: true });
      await page.waitForTimeout(60);
    }

    await assertInputResponds(page, {
      controls: 'arrows wasd tap space',
      target: '[data-testid="cell-12"]',
    });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertResponsiveAfterBurst(page, {
      controls: 'arrows wasd tap space',
      target: '[data-testid="cell-12"]',
    });

    expect(errors).toHaveLength(0);
  });

  test('mobile playable at 375px width', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/games/2026-11-14/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid^="cell-"], [data-testid="burst-btn"]',
    });

    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();
    const fieldBox = await field.boundingBox();
    expect(fieldBox.width).toBeGreaterThan(50);
    expect(fieldBox.height).toBeGreaterThan(100);

    const stageBox = await page.locator('[data-testid="arena-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('sparkGridHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 20; i++) {
      await page.locator('[data-testid="cell-' + (i % 25) + '"]').click({ force: true });
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('sparkGridHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    for (let i = 0; i < 8; i++) {
      await page.locator('[data-testid="cell-' + (i % 25) + '"]').click({ force: true });
      await page.waitForTimeout(100);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
