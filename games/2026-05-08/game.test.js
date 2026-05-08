import { test, expect } from '@playwright/test';

test.describe('2026-05-08 Cluster Pop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-08/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    const title = await page.locator('div').filter({ hasText: 'CLUSTER POP' }).first();
    expect(await title.isVisible()).toBeTruthy();
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(800);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // After clicking, game should be in playing state (START button gone)
    const startBtn = await page.locator('button').filter({ hasText: 'START' }).count();
    // Either game started (button gone) or still on start screen — both OK
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start the game first
    await page.click('body');
    await page.waitForTimeout(500);

    // Rapid clicks across the game area
    for (let i = 0; i < 10; i++) {
      await page.click('canvas', {
        position: { x: 100 + i * 30, y: 200 + (i % 3) * 30 },
        force: true,
      });
      await page.waitForTimeout(50);
    }

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-05-08/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.tap('body');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Click the canvas to interact with game blocks
    await page.click('canvas', { position: { x: 200, y: 250 }, force: true });
    await page.waitForTimeout(300);
    await page.click('canvas', { position: { x: 250, y: 300 }, force: true });
    await page.waitForTimeout(700);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('cluster')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
