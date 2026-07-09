import { test, expect } from '@playwright/test';

test.describe('2026-07-09 Chroma Bounce', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-09/index.html');
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
    expect(gameContent).toContain('CHROMA BOUNCE');
  });

  test('game responds to user input', async ({ page }) => {
    // Click start screen to begin game
    await page.click('body');
    await page.waitForTimeout(800);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game
    await page.click('body');
    await page.waitForTimeout(600);

    // Rapid clicks on body area (avoids canvas/button interception issues)
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 200 + i * 20, y: 150 } });
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click to start (no touch needed for this test)
    await page.click('body');
    await page.waitForTimeout(800);

    // Additional clicks to nudge ball
    await page.click('body', { position: { x: 180, y: 300 } });
    await page.waitForTimeout(400);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    expect(errors).toHaveLength(0);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('localStorage high score works', async ({ page }) => {
    // Play briefly
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
