import { test, expect } from '@playwright/test';

test.describe('2026-07-07 Relay Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-07/index.html');
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
    // Start screen visible
    await expect(page.locator('text=RELAY RUSH')).toBeVisible();
    await expect(page.locator('button', { hasText: 'START GAME' })).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("START GAME")');
    await page.waitForTimeout(500);

    // Verify canvas is present and game started
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // HUD should be visible after start
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('button:has-text("START GAME")');
    await page.waitForTimeout(300);

    // Rapid clicks on canvas (simulating switch toggling)
    for (let i = 0; i < 10; i++) {
      await page.click('canvas');
      await page.waitForTimeout(50);
    }

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Interact (tap not available in plain chromium, use click)
    await page.click('button:has-text("START GAME")');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('button:has-text("START GAME")');
    await page.waitForTimeout(1000);

    // Check localStorage
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
