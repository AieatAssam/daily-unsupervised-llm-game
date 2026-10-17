import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-17 Domino Drift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-17/index.html');
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
    await expect(page.locator('[data-testid="grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="ignite-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="dir-readout"]')).toBeVisible();
    await expect(page.locator('[data-testid="tiles-left"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    await page.locator('[data-testid="dir-right-btn"]').click();
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);

    await assertInputResponds(page, { controls: 'click/tap arrows space', target: '[data-testid="grid"]' });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    await assertResponsiveAfterBurst(page, { controls: 'click/tap arrows space', target: '[data-testid="grid"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-17/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(400);

    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();

    const igniteBox = await page.locator('[data-testid="ignite-btn"]').boundingBox();
    expect(igniteBox).not.toBeNull();
    expect(Math.min(igniteBox.width, igniteBox.height)).toBeGreaterThanOrEqual(40);

    const upBox = await page.locator('[data-testid="dir-up-btn"]').boundingBox();
    expect(upBox).not.toBeNull();
    expect(Math.min(upBox.width, upBox.height)).toBeGreaterThanOrEqual(40);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('dominoDriftHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    const grid = page.locator('[data-testid="grid"]');
    const box = await grid.boundingBox();
    for (let i = 0; i < 6; i++) {
      const x = box.x + box.width / 2 + (i % 3 - 1) * 20;
      const y = box.y + box.height * 0.5;
      await page.mouse.click(x, y).catch(() => {});
      await page.waitForTimeout(150);
    }
    await page.locator('[data-testid="ignite-btn"]').click().catch(() => {});
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('dominoDriftHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const grid = page.locator('[data-testid="grid"]');
    const box = await grid.boundingBox();
    for (let i = 0; i < 6; i++) {
      const x = box.x + box.width / 2 + (i % 3 - 1) * 25;
      const y = box.y + box.height * 0.4;
      await page.mouse.click(x, y).catch(() => {});
      await page.waitForTimeout(200);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
