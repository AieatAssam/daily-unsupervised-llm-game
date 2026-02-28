import { test, expect } from '@playwright/test';

test.describe('2026-02-28 Beat Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-28/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Title should be visible on start screen
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    // Check for game title and play button
    expect(bodyText).toContain('BEAT DROP');
    expect(bodyText).toContain('PLAY');
  });

  test('game responds to user input', async ({ page }) => {
    // Click starts the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present
    const hasCanvas = await page.locator('canvas').count();
    // Game root div has id="game"
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // First click starts the game
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid clicks in different lane zones
    const viewport = page.viewportSize();
    const w = viewport.width;
    const h = viewport.height;

    for (let i = 0; i < 10; i++) {
      const x = (i % 3 + 0.5) * (w / 3);
      await page.mouse.click(x, h * 0.5);
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

    // Click to start (works on both touch and non-touch contexts)
    await page.click('body');
    await page.waitForTimeout(500);

    // Click different lane zones
    await page.mouse.click(60, 400);
    await page.waitForTimeout(200);
    await page.mouse.click(187, 400);
    await page.waitForTimeout(200);
    await page.mouse.click(310, 400);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Give page time to fully initialise (localStorage key seeded in <head>)
    await page.waitForTimeout(500);

    // Click to start the game, triggering any deferred init code
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related key (beatDropHighScore contains 'highScore')
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // beatDropHighScore key should be set on game load
    expect(storage.length).toBeGreaterThan(0);
  });
});
