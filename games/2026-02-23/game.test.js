import { test, expect } from '@playwright/test';

test.describe('2026-02-23 Data Dash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-23/index.html');
    await page.waitForLoadState('networkidle');
    // Wait for React and Babel to initialize the game
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(1500);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Canvas should be present (game uses canvas for rendering)
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Game title should be visible in the DOM
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    // Verify the game root element exists
    const gameRoot = await page.locator('#game-root').count();
    expect(gameRoot).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click on game area to start
    await page.click('body');
    await page.waitForTimeout(500);

    // Verify canvas is present and game is active
    const hasCanvas = await page.locator('canvas').count();
    const hasGameRoot = await page.locator('#game-root').count();
    expect(hasCanvas + hasGameRoot).toBeGreaterThan(0);

    // Press arrow key to start / change direction
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // Game should still be running without errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start the game
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid key presses (direction changes)
    const directions = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(directions[i % directions.length]);
      await page.waitForTimeout(40);
    }

    // Rapid clicks
    for (let i = 0; i < 6; i++) {
      await page.click('canvas');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Use click (works cross-browser including mobile viewport)
    await page.click('body');
    await page.waitForTimeout(400);

    // Press arrow key to change direction
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Canvas should exist and game should be responsive
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Ensure localStorage key is initialized by the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Press arrow keys to actually start the game moving
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(600);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // dataDash_highScore key should be present (initialized on game start)
    expect(storage.length).toBeGreaterThan(0);
  });
});
