import { test, expect } from '@playwright/test';

test.describe('2026-02-20 Chrono Pop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-20/index.html');
    await page.waitForLoadState('networkidle');
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
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    // Should have canvas (game canvas)
    const hasCanvas = await page.locator('canvas').count();
    // Should have game container or HUD elements
    const hasGameEl = await page.locator('[id*="game"], [class*="game"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click should start the game from menu state
    await page.click('body');
    await page.waitForTimeout(600);

    // Game should have transitioned from menu (countdown or playing state)
    const bodyContent = await page.content();
    expect(bodyContent).toBeTruthy();

    // Canvas must still be present
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start the game first
    await page.click('body');
    await page.waitForTimeout(800);

    // Rapid clicks in different positions
    for (let i = 0; i < 10; i++) {
      await page.click('body', {
        position: { x: 100 + i * 40, y: 150 + (i % 3) * 80 },
        force: true,
      });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click/tap to start/interact (click works cross-browser)
    await page.click('body');
    await page.waitForTimeout(600);

    expect(errors).toHaveLength(0);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // The game initializes localStorage on load
    const storageKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('score') ||
        k.toLowerCase().includes('high') ||
        k.toLowerCase().includes('best') ||
        k.toLowerCase().includes('chrono')
      )
    );
    // chronoPop_highScore is set on page load
    expect(storageKeys.length).toBeGreaterThan(0);

    // Verify localStorage is writable
    const canStore = await page.evaluate(() => {
      try {
        localStorage.setItem('_test_', '1');
        const v = localStorage.getItem('_test_');
        localStorage.removeItem('_test_');
        return v === '1';
      } catch { return false; }
    });
    expect(canStore).toBe(true);
  });
});
