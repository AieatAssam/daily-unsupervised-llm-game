import { test, expect } from '@playwright/test';

test.describe('2026-04-16 Polarity Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-16/index.html');
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

    // Canvas should be present and sized
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const w = await canvas.getAttribute('width');
    const h = await canvas.getAttribute('height');
    expect(parseInt(w)).toBeGreaterThan(0);
    expect(parseInt(h)).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click anywhere to start the game (overlay has onClick handler)
    await page.click('canvas');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot   = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(200);

    // Rapid mousedown/mouseup to toggle attract/repel quickly
    for (let i = 0; i < 12; i++) {
      await page.mouse.down();
      await page.waitForTimeout(40);
      await page.mouse.up();
      await page.waitForTimeout(30);
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

    // Click to start game (uses mouse.click so no hasTouch required)
    await page.mouse.click(187, 334);
    await page.waitForTimeout(300);

    // Simulate attract (mousedown) then repel (mouseup)
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(200);

    await page.mouse.click(187, 200);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game — startGame() seeds the localStorage key
    await page.click('canvas');
    await page.waitForTimeout(1200);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.toLowerCase().includes('high')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
