import { test, expect } from '@playwright/test';

test.describe('2026-05-14 Surge Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-14/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    await page.waitForTimeout(2000);
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Click to start the game
    await page.click('canvas');
    await page.waitForTimeout(1000);
    // Click inside the grid area
    await page.click('canvas', { position: { x: 280, y: 280 } });
    await page.waitForTimeout(500);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(1000);
    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);
    // Rapid clicks across grid
    for (let i = 0; i < 10; i++) {
      const x = 80 + Math.floor(Math.random() * 7) * 68 + 34;
      const y = 98 + Math.floor(Math.random() * 7) * 68 + 34;
      await page.click('canvas', { position: { x: Math.min(x, 500), y: Math.min(y, 580) } });
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.click('canvas');
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    expect(errors).toHaveLength(0);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.click('canvas');
    await page.waitForTimeout(2000);
    await page.click('canvas', { position: { x: 200, y: 250 } });
    await page.waitForTimeout(500);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('Hi') || k.includes('surgeGrid')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
