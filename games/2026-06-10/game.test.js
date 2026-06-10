import { test, expect } from '@playwright/test';

test.describe('2026-06-10 Resonance Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-10/index.html');
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
    expect(gameContent).toContain('RESONANCE RUSH');

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

    await page.mouse.move(400, 100);
    await page.waitForTimeout(200);
    await page.mouse.move(400, 500);
    await page.waitForTimeout(500);

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
      await page.mouse.move(300 + i * 5, 100 + i * 40);
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
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

    await page.goto('/games/2026-06-10/index.html');
    await page.waitForLoadState('networkidle');

    await page.touchscreen.tap(187, 300);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
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
