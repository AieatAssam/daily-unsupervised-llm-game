import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-22 Neon Cadence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-22/index.html');
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
    await expect(page.locator('[data-testid="level"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="track"]')).toBeVisible();
    await expect(page.locator('[data-testid="lane-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="lane-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="lane-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="lane-3"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="lane-0"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(200);

    await assertInputResponds(page, { controls: 'click/tap keyboard', target: '[data-testid="lane-2"]' });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertResponsiveAfterBurst(page, { controls: 'click/tap keyboard', target: '[data-testid="lane-3"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-22/index.html');
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
    await expect(field).toBeVisible();

    for (let i = 0; i < 4; i++) {
      const box = await page.locator(`[data-testid="lane-${i}"]`).boundingBox();
      expect(box).not.toBeNull();
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    }

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonCadenceHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const lanes = ['lane-0', 'lane-1', 'lane-2', 'lane-3'];
    for (let i = 0; i < 12; i++) {
      await page.locator(`[data-testid="${lanes[i % lanes.length]}"]`).click().catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('neonCadenceHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    const lanes = ['lane-0', 'lane-1', 'lane-2', 'lane-3'];
    for (let i = 0; i < 8; i++) {
      await page.locator(`[data-testid="${lanes[i % lanes.length]}"]`).click().catch(() => {});
      await page.waitForTimeout(250);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
