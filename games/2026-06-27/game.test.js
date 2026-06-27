import { test, expect } from '@playwright/test';

test.describe('2026-06-27 Volt Serpent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-27/index.html');
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
    expect(gameContent).toContain('VOLT SERPENT');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"], [class*="app"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // After starting, the start overlay should be gone and HUD score visible
    const overlayCount = await page.locator('.overlay').count();
    expect(overlayCount).toBe(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.click('body');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][i % 4]);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.goto('/games/2026-06-27/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('body');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const canvasBox = await page.locator('canvas').boundingBox();
    expect(canvasBox).toBeTruthy();

    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
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
