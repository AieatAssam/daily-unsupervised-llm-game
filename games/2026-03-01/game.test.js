import { test, expect } from '@playwright/test';

test.describe('2026-03-01 Neon Flood', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-01/index.html');
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
    // Should show the game title and flood percentage
    expect(gameContent).toContain('NEON FLOOD');
    expect(gameContent).toContain('FLOODED');
  });

  test('game responds to user input', async ({ page }) => {
    // Click on game area
    await page.click('body');
    await page.waitForTimeout(500);

    // Verify React root rendered
    const hasCanvas    = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Rapid clicks on the body
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }

    // Should still be responsive
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Click interaction (works on both touch and non-touch contexts)
    await page.click('body');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Allow some time for the game to initialize
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // Should have at least one score-related key
    expect(storage.length).toBeGreaterThan(0);
  });
});
