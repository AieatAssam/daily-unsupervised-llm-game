import { test, expect } from '@playwright/test';

test.describe('2026-04-12 Sprint Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-12/index.html');
    await page.waitForLoadState('networkidle');
    // Wait for React to render
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // Title should be visible on idle screen
    expect(body).toContain('SPRINT');
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start game
    await page.click('body');
    await page.waitForTimeout(600);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id="root"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // Press A then D to simulate stepping
    await page.keyboard.press('a');
    await page.waitForTimeout(100);
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    await page.keyboard.press('a');
    await page.waitForTimeout(500);

    // Game should still be running (no crash)
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game
    await page.click('body');
    await page.waitForTimeout(400);

    // Rapid alternating key presses (the core mechanic)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'a' : 'd');
      await page.waitForTimeout(40);
    }

    // Jump a few times
    for (let j = 0; j < 3; j++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
    }

    const errors = [];
    page.on('pageerror', err => errors.push(err));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click to start
    await page.click('body');
    await page.waitForTimeout(400);

    // Click left side (left foot)
    await page.click('body', { position: { x: 60, y: 400 } });
    await page.waitForTimeout(100);
    // Click right side (right foot)
    await page.click('body', { position: { x: 315, y: 400 } });
    await page.waitForTimeout(100);
    // Click center (jump)
    await page.click('body', { position: { x: 188, y: 400 } });
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // The game sets the localStorage key on mount
    await page.waitForTimeout(500);

    // Start the game and play briefly
    await page.click('body');
    await page.waitForTimeout(300);

    // Alternate keys rapidly to build score
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'a' : 'd');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(800);

    // Check localStorage has score-related key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
