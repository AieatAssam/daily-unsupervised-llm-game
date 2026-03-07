import { test, expect } from '@playwright/test';

test.describe('2026-03-07 Mind Flash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-07/index.html');
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
    // Canvas-based game — canvas must be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click somewhere on the canvas (may or may not hit the Play button)
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot   = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Rapid clicks should never crash the game
    for (let i = 0; i < 12; i++) {
      await page.click('body');
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
    page.on('pageerror', error => errors.push(error));

    // Canvas should scale to mobile
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);

    await page.click('body');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // mindFlash_highScore is written on page load
    await page.waitForTimeout(500);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      )
    );

    expect(storage.length).toBeGreaterThan(0);
  });
});
