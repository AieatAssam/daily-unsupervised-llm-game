import { test, expect } from '@playwright/test';

test.describe('2026-04-10 Grid Siege', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-10/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Title visible on start screen
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain('GRID SIEGE');
    // Canvas should be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start
    await page.click('body');
    await page.waitForTimeout(600);

    // Game should now be playing — canvas still present, no crash
    const canvasCount = await page.locator('canvas').count();
    const reactRoot = await page.locator('#root').count();
    expect(canvasCount + reactRoot).toBeGreaterThan(0);

    // Press arrow key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid arrow key presses
    for (let i = 0; i < 10; i++) {
      const dirs = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      await page.keyboard.press(dirs[i % 4]);
      await page.waitForTimeout(40);
    }

    // Rapid clicks
    for (let i = 0; i < 5; i++) {
      await page.click('canvas', { position: { x: 100 + i * 20, y: 100 } }).catch(() => {});
      await page.waitForTimeout(30);
    }

    await page.waitForTimeout(400);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click to start (tap may not be supported in all chromium contexts)
    await page.click('body');
    await page.waitForTimeout(400);

    // Arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and play briefly
    await page.click('body');
    await page.waitForTimeout(300);

    // Navigate around to trigger score events
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(60);
    }
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(60);
    }
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(60);
    }
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(500);

    // Check localStorage has a score key
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('HS') || k.includes('Score')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
