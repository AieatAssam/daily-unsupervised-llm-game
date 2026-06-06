import { test, expect } from '@playwright/test';

test.describe('2026-06-06 Fusion Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-06/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(800);

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);

    // Click again to drop an orb (after game starts)
    await page.click('canvas');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start the game
    await page.click('canvas');
    await page.waitForTimeout(300);

    // Rapid clicks at various positions
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(100 + i * 20, 300);
      await page.click('canvas', { position: { x: 100 + i * 20, y: 300 } });
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Touch/click to start
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Touch/click to drop
    await page.click('canvas');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Play briefly
    await page.click('canvas');
    await page.waitForTimeout(1000);

    // Check localStorage for score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
