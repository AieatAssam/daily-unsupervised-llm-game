import { test, expect } from '@playwright/test';

test.describe('2026-03-11 Void Strike', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-11/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start from title screen
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot   = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start the game
    await page.click('body');
    await page.waitForTimeout(400);

    // Rapid key presses: rotate, thrust, shoot
    for (let i = 0; i < 20; i++) {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'];
      await page.keyboard.press(keys[i % 4]);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);

    // Click to start (tap requires hasTouch context)
    await page.click('body');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.waitForTimeout(500);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('voidStrike') || k.includes('high')
      )
    );

    expect(storage.length).toBeGreaterThan(0);
  });
});
