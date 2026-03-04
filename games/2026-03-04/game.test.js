import { test, expect } from '@playwright/test';

test.describe('2026-03-04 Phase Stack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-04/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Canvas should be present
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);

    // Game container should exist
    const container = await page.locator('#game-container').count();
    expect(container).toBeGreaterThan(0);

    // Body content should be rendered
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // First click starts the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should still be rendered and game active
    const hasCanvas = await page.locator('canvas').count();
    const hasGame = await page.locator('#game-canvas').count();
    expect(hasCanvas + hasGame).toBeGreaterThan(0);

    // Click again to drop first platform
    await page.click('body');
    await page.waitForTimeout(500);

    // No errors should occur
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Rapid clicks — start game then repeatedly drop
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }

    // Should still be responsive with no errors
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Canvas should still be present and scaled
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);

    // Click to interact (tap requires hasTouch context; click works on all browsers)
    await page.click('body');
    await page.waitForTimeout(500);

    // Click again to drop platform
    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start the game (this saves the HS key immediately)
    await page.click('body');
    await page.waitForTimeout(500);

    // Click a few more times to drop platforms and generate score
    await page.click('body');
    await page.waitForTimeout(200);
    await page.click('body');
    await page.waitForTimeout(200);

    // Check localStorage for high score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // Should have at least one score-related key
    expect(storage.length).toBeGreaterThan(0);
  });
});
