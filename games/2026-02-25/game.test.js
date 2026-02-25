import { test, expect } from '@playwright/test';

test.describe('2026-02-25 Void Descent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-25/index.html');
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
    page.on('pageerror', error => errors.push(error.message));

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
    page.on('pageerror', error => errors.push(error.message));

    // Use click instead of tap (tap requires hasTouch context option)
    await page.click('body');
    await page.waitForTimeout(500);

    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Give page time to initialise (localStorage key set at script level on load)
    await page.waitForTimeout(500);

    await page.click('body');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // voidDescent_highScore key should exist (contains 'highScore')
    expect(storage.length).toBeGreaterThan(0);
  });
});
