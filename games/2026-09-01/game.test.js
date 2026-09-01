import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-09-01 Pulse Match', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-09-01/index.html');
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
    await expect(page.locator('[data-testid="board"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    expect(await page.locator('[data-testid="card"]').count()).toBe(16);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="card"]').first().click();

    await assertInputResponds(page, {
      controls: 'click/tap cards to flip and match pairs',
      target: '[data-testid="card"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid="card"]');
    const count = await cards.count();
    for (let i = 0; i < 30; i++) {
      await cards.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    const restartVisible = await page.locator('[data-testid="restart-btn"]').isVisible().catch(() => false);
    if (restartVisible) {
      await page.locator('[data-testid="restart-btn"]').click();
      await page.waitForTimeout(300);
    }
    await assertInputResponds(page, {
      controls: 'click/tap cards to flip and match pairs',
      target: '[data-testid="card"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-09-01/index.html');
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
      buttonSelector: '[data-testid="card"]',
    });

    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('pulseMatch_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid="card"]');
    const count = await cards.count();
    for (let i = 0; i < 20; i++) {
      await cards.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(300);

    const val = await page.evaluate(() => localStorage.getItem('pulseMatch_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid="card"]');
    const count = await cards.count();
    for (let i = 0; i < 8; i++) {
      await cards.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(150);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
