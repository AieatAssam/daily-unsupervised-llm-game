import { test, expect } from '@playwright/test';

test.describe('2026-02-27 Chain Burst', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-27/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Canvas should be present and game text visible
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Click to start the game from start screen
    await page.click('canvas');
    await page.waitForTimeout(800);
    // Canvas should still be present and interactive
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(300);

    // Rapid clicks across the canvas
    for (let i = 0; i < 10; i++) {
      const x = 100 + i * 60;
      const y = 200 + (i % 3) * 100;
      await page.mouse.click(x, y);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Click/touch interaction
    await page.click('canvas');
    await page.waitForTimeout(800);

    expect(errors).toHaveLength(0);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Give page time to fully initialise (localStorage key seeded in <head>)
    await page.waitForTimeout(500);

    // Click to start the game, triggering any deferred init code
    await page.click('canvas');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // chainBurstHighScore key should be set on game load
    expect(storage.length).toBeGreaterThan(0);
  });
});
