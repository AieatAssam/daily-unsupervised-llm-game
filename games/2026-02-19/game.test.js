import { test, expect } from '@playwright/test';

test.describe('2026-02-19 Vortex Shift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-19/index.html');
    await page.waitForLoadState('networkidle');
    // Wait for React + Babel to render
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Body should have content (menu text rendered via React)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    // Canvas must exist (game renders on canvas)
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Game title should be visible in the menu overlay
    const html = await page.content();
    expect(html).toContain('VORTEX SHIFT');
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click to start the game from the menu
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present and rendering
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Click again (flips spiral direction)
    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start the game
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid clicks (each flip direction)
    for (let i = 0; i < 15; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }

    // Rapid keyboard presses
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    // Switch to iPhone SE viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click to start (touch simulation via click — tap requires hasTouch context)
    await page.click('body');
    await page.waitForTimeout(400);

    // Canvas should be rendered
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Another click (flip direction)
    await page.click('body');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // The game initialises localStorage on mount so key is always present
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check for score-related localStorage keys
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('highscore') ||
        k.toLowerCase().includes('score') ||
        k.toLowerCase().includes('high') ||
        k.toLowerCase().includes('best')
      );
    });

    expect(storageKeys.length).toBeGreaterThan(0);

    // Verify localStorage is readable/writable
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('_vortex_test', '1');
        const v = localStorage.getItem('_vortex_test');
        localStorage.removeItem('_vortex_test');
        return v === '1';
      } catch (e) {
        return false;
      }
    });

    expect(canUseStorage).toBe(true);
  });
});
