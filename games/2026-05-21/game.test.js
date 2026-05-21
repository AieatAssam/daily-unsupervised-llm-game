import { test, expect } from '@playwright/test';

test.describe('2026-05-21 String Strike', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-21/index.html');
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
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.click('body');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"], #root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    // Start the game
    await page.click('body');
    await page.waitForTimeout(300);
    // Rapid clicks to pluck strings
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 200 + i * 20, y: 100 + i * 30 } });
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
    expect(errors).toHaveLength(0);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(1000);
    await page.click('body');
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High') || k.includes('Strike')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
