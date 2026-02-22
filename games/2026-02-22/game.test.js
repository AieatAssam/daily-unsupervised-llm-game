import { test, expect } from '@playwright/test';

test.describe('2026-02-22 Plasma Break', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-22/index.html');
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
    // Title should be visible in start overlay
    expect(gameContent).toContain('PLASMA BREAK');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    for (let i = 0; i < 10; i++) {
      await page.click('body');
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
    page.on('pageerror', error => errors.push(error));

    // Use click (works cross-browser including mobile viewport)
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present on mobile
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start game and wait for localStorage to be initialized
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
