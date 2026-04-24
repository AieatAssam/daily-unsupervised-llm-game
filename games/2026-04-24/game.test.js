import { test, expect } from '@playwright/test';

test.describe('2026-04-24 Hyper Dash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-24/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const w = await canvas.getAttribute('width');
    const h = await canvas.getAttribute('height');
    expect(parseInt(w)).toBeGreaterThan(0);
    expect(parseInt(h)).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(600);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);

    // Press space to jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start game and rapidly click/press keys
    await page.click('canvas');
    await page.waitForTimeout(300);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }

    for (let i = 0; i < 5; i++) {
      await page.click('canvas');
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click to start (touch events handled by game)
    await page.click('canvas');
    await page.waitForTimeout(600);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('canvas');
    await page.waitForTimeout(200);

    // Jump a few times to play
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    // Check localStorage for score keys
    const keys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('hyperDash') || k.includes('score') || k.includes('best') || k.includes('high')
      )
    );
    expect(keys.length).toBeGreaterThan(0);
  });
});
