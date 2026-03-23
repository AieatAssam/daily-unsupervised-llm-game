import { test, expect } from '@playwright/test';

test.describe('2026-03-23 Sky Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-23/index.html');
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
    // Title should be visible
    await expect(page.locator('text=SKY SURGE')).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game by clicking overlay
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid clicks on the canvas area
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 50 + i * 20, y: 300 } });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Game canvas should be present at mobile size
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Interaction to start (click works on all browsers)
    await page.click('body');
    await page.waitForTimeout(500);

    // Page should still be responsive (not crashed)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game by clicking the overlay
    await page.click('body');
    await page.waitForTimeout(2000);

    // Check localStorage - key is set at game init
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('sky') || k.includes('Sky')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
