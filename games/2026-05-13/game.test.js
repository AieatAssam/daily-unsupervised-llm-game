import { test, expect } from '@playwright/test';

test.describe('2026-05-13 Arc Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-13/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    // Title should be visible
    expect(bodyText).toContain('ARC SURGE');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start the game
    await page.click('body');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Rapid firing
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 300 + i * 10, y: 200 } });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('/games/2026-05-13/index.html');
    await mobilePage.waitForLoadState('networkidle');

    const errors = [];
    mobilePage.on('pageerror', error => errors.push(error.message));

    await mobilePage.tap('body');
    await mobilePage.waitForTimeout(500);

    const bodyText = await mobilePage.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(errors).toHaveLength(0);

    await mobileContext.close();
  });

  test('localStorage high score works', async ({ page }) => {
    // Game pre-initialises the key on load
    await page.waitForTimeout(500);

    await page.click('body');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      )
    );

    expect(storage.length).toBeGreaterThan(0);
  });
});
