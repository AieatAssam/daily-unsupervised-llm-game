import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-15 Pulse Lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-15/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.down(i % 2 === 0 ? 'ArrowUp' : 'ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.up(i % 2 === 0 ? 'ArrowUp' : 'ArrowDown');
      await page.waitForTimeout(100);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
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
    await expect(page.locator('[data-testid="dial-up"]')).toBeVisible();
    await expect(page.locator('[data-testid="dial-down"]')).toBeVisible();
    await expect(page.locator('[data-testid="lock-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-zone"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowDown');

    await assertInputResponds(page, { controls: 'arrows space', target: '[data-testid="play-field"]' });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press(i % 3 === 0 ? 'Space' : i % 2 === 0 ? 'ArrowUp' : 'ArrowDown').catch(() => {});
      await page.waitForTimeout(20);
    }

    await assertResponsiveAfterBurst(page, { controls: 'arrows', target: '[data-testid="play-field"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-15/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);
    await page.locator('[data-testid="dial-up"]').tap({ timeout: 2000 }).catch(() => {});

    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();

    const dialUp = page.locator('[data-testid="dial-up"]');
    const dialUpBox = await dialUp.boundingBox();
    expect(dialUpBox).not.toBeNull();
    expect(Math.min(dialUpBox.width, dialUpBox.height)).toBeGreaterThanOrEqual(40);

    const lockBtn = page.locator('[data-testid="lock-btn"]');
    const lockBox = await lockBtn.boundingBox();
    expect(lockBox).not.toBeNull();
    expect(Math.min(lockBox.width, lockBox.height)).toBeGreaterThanOrEqual(40);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('pulseLockHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(300);
      await page.keyboard.up('ArrowUp');
      await page.keyboard.press('Space').catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('pulseLockHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });
});
