import { test, expect } from '@playwright/test';

test.describe('2026-07-10 Cell Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-10/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // Title should be visible
    expect(body).toContain('CELL SURGE');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    // Click play button
    await page.click('body');
    await page.waitForTimeout(300);
    // Move mouse around rapidly
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(100 + i * 40, 150 + i * 30);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('body');
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
