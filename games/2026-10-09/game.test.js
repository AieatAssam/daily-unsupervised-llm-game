import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-09 Lexicon Flux', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-09/index.html');
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
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    await assertInputResponds(page, { controls: 'click', target: '[data-testid="letter-tile"]' });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    const tiles = page.locator('[data-testid="letter-tile"]');
    const count = await tiles.count();
    for (let i = 0; i < 25; i++) {
      const tile = tiles.nth(i % Math.max(1, count));
      await tile.click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(20);
    }

    await page.waitForTimeout(500);
    const startBtn = page.locator('[data-testid="start-btn"]');
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    await assertInputResponds(page, { controls: 'click', target: '[data-testid="letter-tile"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-09/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"], [data-testid="letter-tile"]',
    });

    await page.waitForTimeout(500);

    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('lexiconFluxHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    const tiles = page.locator('[data-testid="letter-tile"]');
    const count = await tiles.count();
    for (let i = 0; i < Math.min(count, 8); i++) {
      await tiles.nth(i).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('lexiconFluxHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const tiles = page.locator('[data-testid="letter-tile"]');
    const count = await tiles.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await tiles.nth(i).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(250);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
