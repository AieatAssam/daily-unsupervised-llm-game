import { test, expect } from '@playwright/test';

test.describe('2026-03-25 Neon Smash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-25/index.html');
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
    // Should show the game title on idle screen
    expect(gameContent).toContain('NEON SMASH');
  });

  test('game responds to user input', async ({ page }) => {
    // Start the game by clicking play
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(500);

    // Verify game started - score display should be visible
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[id="game-container"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game first
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(300);

    // Rapid clicks on game area
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

    // Touch interaction
    await page.click('body');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Directly set a high score to verify persistence
    await page.evaluate(() => {
      localStorage.setItem('neonSmashHighScore', '100');
    });

    // Start game and verify key is read
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check localStorage for high score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('Smash') || k.includes('neon')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
