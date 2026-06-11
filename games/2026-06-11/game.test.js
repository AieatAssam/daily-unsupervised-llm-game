import { test, expect } from '@playwright/test';

test.describe('2026-06-11 Fulcrum Frenzy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-11/index.html');
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
    expect(gameContent).toContain('FULCRUM FRENZY');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const startButton = page.locator('.play-btn');
    await expect(startButton).toBeVisible();
    await startButton.click();
    await page.waitForTimeout(300);

    // Start screen should be gone once playing begins
    await expect(page.locator('.title')).toHaveCount(0);

    // Drop weights left and right via keyboard
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const startButton = page.locator('.play-btn');
    await startButton.click();
    await page.waitForTimeout(200);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
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

    await page.goto('/games/2026-06-11/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('.play-btn');
    await page.waitForTimeout(300);

    await page.touchscreen.tap(80, 500);
    await page.waitForTimeout(400);
    await page.touchscreen.tap(300, 500);
    await page.waitForTimeout(400);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('.play-btn');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
