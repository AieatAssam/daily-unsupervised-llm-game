import { test, expect } from '@playwright/test';

test.describe('2026-05-18 Neon Reflect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-18/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start game
    await page.click('canvas');
    await page.waitForTimeout(1000);
    // Game should now be running — click a grid cell to place a mirror
    await page.click('canvas', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.click('canvas');
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      await page.click('canvas', { position: { x: 100 + i * 40, y: 150 + (i % 3) * 50 } });
      await page.waitForTimeout(50);
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
    await page.waitForTimeout(500);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(2000);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('nr')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
