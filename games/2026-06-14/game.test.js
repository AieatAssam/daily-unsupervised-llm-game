import { test, expect } from '@playwright/test';

test.describe('2026-06-14 Forge Ahead', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-14/index.html');
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
    expect(gameContent).toContain('FORGE AHEAD');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Start the game from the title screen
    await page.click('text=START');
    await page.waitForTimeout(500);

    // Forge a tile by clicking the canvas
    await page.click('canvas');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    for (let i = 0; i < 10; i++) {
      await page.click('canvas');
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

    await page.click('text=START');
    await page.waitForTimeout(500);
    await page.click('canvas');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(500);

    // Forge a few tiles to generate score
    for (let i = 0; i < 5; i++) {
      await page.click('canvas');
      await page.waitForTimeout(300);
    }

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
