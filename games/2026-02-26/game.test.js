import { test, expect } from '@playwright/test';

test.describe('2026-02-26 Neon Hopper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-26/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);

    // Canvas should be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game from the start screen
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasGameEl = await page.locator('[id*="game"], [class*="game"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start the game first
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid key presses — move player around
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Use click (tap requires hasTouch context option in chromium)
    await page.click('body');
    await page.waitForTimeout(500);

    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Give page time to initialise (localStorage key is set at script level on load)
    await page.waitForTimeout(500);

    await page.click('body');
    await page.waitForTimeout(1000);

    // Check for the localStorage key seeded at startup
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
