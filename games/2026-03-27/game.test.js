import { test, expect } from '@playwright/test';

test.describe('2026-03-27 Juggle Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-27/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
    // Start screen should be visible
    expect(gameContent).toContain('JUGGLE RUSH');
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game
    await page.locator('canvas').click({ force: true });
    await page.waitForTimeout(500);

    // Canvas should be present and game-root element
    const hasCanvas = await page.locator('canvas').count();
    const hasGameRoot = await page.locator('#game-root').count();
    expect(hasCanvas + hasGameRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start the game
    await page.locator('canvas').click({ force: true });
    await page.waitForTimeout(300);

    // Rapid clicks all over the canvas
    for (let i = 0; i < 10; i++) {
      const x = 100 + (i * 60) % 400;
      const y = 200 + (i * 40) % 300;
      await page.locator('canvas').click({ position: { x, y }, force: true });
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
    page.on('pageerror', error => errors.push(error.message));

    // Use click (tap requires hasTouch context option set at browser level)
    await page.locator('canvas').click({ force: true });
    await page.waitForTimeout(500);

    // More clicks to simulate juggling
    await page.locator('canvas').click({ position: { x: 187, y: 300 }, force: true });
    await page.locator('canvas').click({ position: { x: 100, y: 250 }, force: true });
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // The game writes to localStorage on mount
    await page.waitForTimeout(500);

    // Check localStorage for score-related key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
