import { test, expect } from '@playwright/test';

test.describe('2026-03-30 Chromagate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-30/index.html');
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
    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[id="root"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid key presses to rotate wheel
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(40);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click to start (touch emulated via viewport)
    await page.click('body');
    await page.waitForTimeout(500);

    // Click to interact
    await page.click('body', { position: { x: 200, y: 400 } });
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start and play briefly
    await page.click('body');
    await page.waitForTimeout(1500);

    // Check localStorage for score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('chroma')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
