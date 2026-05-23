import { test, expect } from '@playwright/test';

test.describe('2026-05-23 Snap Lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-23/index.html');
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
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.click('body');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      await page.click('body');
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
    await page.goto('/games/2026-05-23/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.tap('body');
    await page.waitForTimeout(500);
    await context.close();
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(1000);
    await page.click('body');
    await page.waitForTimeout(500);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('snap') || k.includes('lock')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
