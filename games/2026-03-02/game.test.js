import { test, expect } from '@playwright/test';

test.describe('2026-03-02 Gravity Draw', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-02/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Canvas should be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);

    // Game title should be visible on start screen
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    expect(bodyText).toContain('GRAVITY DRAW');
  });

  test('game responds to user input', async ({ page }) => {
    // Click on game area (triggers start screen click → starts game)
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present (always rendered)
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start the game first
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid drag-draw interactions on canvas
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 10; i++) {
        const x1 = box.x + 80 + i * 20;
        const y1 = box.y + 200;
        const x2 = box.x + 200 + i * 10;
        const y2 = box.y + 250;
        await page.mouse.move(x1, y1);
        await page.mouse.down();
        await page.mouse.move(x2, y2);
        await page.mouse.up();
        await page.waitForTimeout(50);
      }
    }

    // Should still be responsive — no errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Click interaction (works on both touch and non-touch contexts)
    await page.click('body');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start game (also initialises localStorage key)
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // gravityDraw_highScore contains 'highScore'
    expect(storage.length).toBeGreaterThan(0);
  });
});
