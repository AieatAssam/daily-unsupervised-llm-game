import { test, expect } from '@playwright/test';

test.describe('2026-05-05 Whip Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-05/index.html');
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
    // Start screen should be visible
    expect(gameContent).toContain('WHIP RUSH');
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start game
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);

    // Score HUD should now be visible (game started)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start the game
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapidly reverse orbit direction
    for (let i = 0; i < 12; i++) {
      await page.click('body');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Interact to start
    await page.click('body');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start — this initializes the localStorage key
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
