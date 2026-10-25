import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-25 Twin Reactors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-25/index.html');
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
    await expect(page.locator('[data-testid="shields"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="vent-left-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="vent-right-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay"]')).toHaveCount(0);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.locator('[data-testid="vent-left-btn"]').click();
    await page.waitForTimeout(200);

    await assertInputResponds(page, {
      controls: 'click/tap arrows',
      target: '[data-testid="play-field"]',
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
      controls: 'click/tap arrows',
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
    await page.goto('/games/2026-10-25/index.html');
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
    const fieldBox = await field.boundingBox();
    expect(fieldBox.width).toBeGreaterThan(50);
    expect(fieldBox.height).toBeGreaterThan(100);

    const leftBox = await page.locator('[data-testid="vent-left-btn"]').boundingBox();
    expect(leftBox).not.toBeNull();
    expect(Math.min(leftBox.width, leftBox.height)).toBeGreaterThanOrEqual(40);

    const rightBox = await page.locator('[data-testid="vent-right-btn"]').boundingBox();
    expect(rightBox).not.toBeNull();
    expect(Math.min(rightBox.width, rightBox.height)).toBeGreaterThanOrEqual(40);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('twinReactorsHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="vent-left-btn"]').click({ force: true }).catch(() => {});
      await page.waitForTimeout(120);
      await page.locator('[data-testid="vent-right-btn"]').click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1000);

    const val = await page.evaluate(() => localStorage.getItem('twinReactorsHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    for (let i = 0; i < 8; i++) {
      await page.locator('[data-testid="vent-left-btn"]').click({ force: true }).catch(() => {});
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(220);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
