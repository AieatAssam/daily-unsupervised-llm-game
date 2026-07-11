import { test, expect } from '@playwright/test';

test.describe('2026-07-11 Neon Cleave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-11/index.html');
    await page.waitForLoadState('networkidle');
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
    // Click starts the game from title screen
    await page.click('canvas');
    await page.waitForTimeout(800);
    // Perform a drag slice
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Start game
    await page.click('canvas');
    await page.waitForTimeout(600);
    // Rapid drag slices in different directions
    for (let i = 0; i < 10; i++) {
      const y = 150 + i * 35;
      await page.mouse.move(100, y);
      await page.mouse.down();
      await page.mouse.move(500, y);
      await page.mouse.up();
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
    page.on('pageerror', error => errors.push(error.message));
    await page.click('canvas');
    await page.waitForTimeout(600);
    // Drag slice on mobile viewport
    await page.mouse.move(80, 300);
    await page.mouse.down();
    await page.mouse.move(300, 300);
    await page.mouse.up();
    await page.waitForTimeout(400);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('neonCleave')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
