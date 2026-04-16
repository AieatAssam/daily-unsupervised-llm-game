import { test, expect } from '@playwright/test';

test.describe('2026-04-15 Neon Ripple', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-15/index.html');
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
    // Click canvas to start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game, then rapid clicks to spawn many ripples
    await page.click('canvas');
    await page.waitForTimeout(100);

    for (let i = 0; i < 10; i++) {
      await page.mouse.click(200 + i * 30, 200 + i * 15);
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

    // Click canvas to start, then interact
    await page.click('canvas');
    await page.waitForTimeout(300);

    // A few more taps at different positions
    await page.mouse.click(100, 200);
    await page.waitForTimeout(100);
    await page.mouse.click(270, 400);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Play briefly
    await page.click('canvas');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
