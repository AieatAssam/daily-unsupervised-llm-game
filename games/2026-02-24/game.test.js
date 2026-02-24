import { test, expect } from '@playwright/test';

test.describe('2026-02-24 Echo Pulse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-24/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Canvas should be present for game rendering
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Title should be visible in document
    const title = await page.title();
    expect(title).toContain('Echo Pulse');

    // Body content exists
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start game
    await page.click('body');
    await page.waitForTimeout(500);

    // Game should be running — canvas present and React root mounted
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);

    // No JS errors after starting
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start the game
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid clicks across the canvas
    for (let i = 0; i < 10; i++) {
      const x = 100 + (i % 5) * 80;
      const y = 150 + Math.floor(i / 5) * 100;
      await page.mouse.click(x, y);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Game canvas still visible
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Canvas renders at mobile size
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Interaction — start game (use click since touch context depends on browser config)
    await page.click('body');
    await page.waitForTimeout(500);

    // Additional interaction
    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Give the page time to initialize (localStorage key set on mount)
    await page.waitForTimeout(500);

    // Click to start game
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // echoPulseHighScore key should exist (set on component mount)
    expect(storage.length).toBeGreaterThan(0);
  });
});
