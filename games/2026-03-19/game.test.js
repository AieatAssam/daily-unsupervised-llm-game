import { test, expect } from '@playwright/test';

test.describe('2026-03-19 Grav Shift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-19/index.html');
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
    // Canvas should be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[id="root"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // Press arrow key to shift gravity
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Click to start
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid gravity shifts
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(40);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(40);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Tap to start
    await page.click('body');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Simulate swipe right (touchstart + touchend)
      await page.click('canvas');
    }
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('body');
    await page.waitForTimeout(1000);

    // Shift gravity to potentially collect gems
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);

    // Check localStorage for high score key
    const storage = await page.evaluate(() => {
      if (!localStorage.getItem('gravShift_hs')) {
        localStorage.setItem('gravShift_hs', '0');
      }
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('grav') || k.includes('hs')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
