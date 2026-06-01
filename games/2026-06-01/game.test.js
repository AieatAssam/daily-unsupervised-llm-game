import { test, expect } from '@playwright/test';

test.describe('2026-06-01 Skeet Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-01/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // Title visible on start screen
    await expect(page.locator('text=SKEET SURGE')).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Should have canvas element
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Game over screen or playing screen should show score
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game then rapid click to shoot
    await page.click('body');
    await page.waitForTimeout(300);

    for (let i = 0; i < 10; i++) {
      await page.mouse.click(200 + i * 40, 200 + (i % 3) * 60);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click to start (touch event handled by the game)
    await page.click('body');
    await page.waitForTimeout(800);

    expect(errors).toHaveLength(0);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and interact
    await page.click('body');
    await page.waitForTimeout(800);
    await page.mouse.click(300, 300);
    await page.waitForTimeout(500);

    // Check localStorage for score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('skeetSurge') || k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
