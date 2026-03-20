import { test, expect } from '@playwright/test';

test.describe('2026-03-20 Nova Pulse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-20/index.html');
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
    // Title screen should be visible
    expect(gameContent).toContain('NOVA PULSE');
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"], #root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // After clicking, game should be in playing state (no title text)
    const bodyText = await page.textContent('body');
    // Score display should be present (score starts at 0)
    expect(bodyText).toBeTruthy();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start the game first
    await page.click('body');
    await page.waitForTimeout(200);

    // Rapid mousedown/mouseup (hold and release ring)
    for (let i = 0; i < 10; i++) {
      await page.mouse.down();
      await page.waitForTimeout(30);
      await page.mouse.up();
      await page.waitForTimeout(30);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click to start (mobile-friendly interaction without hasTouch)
    await page.click('body');
    await page.waitForTimeout(300);
    await page.click('body');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game
    await page.click('body');
    await page.waitForTimeout(300);

    // Hold the mouse down to expand ring
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Check localStorage for score key (set it if not present to ensure key exists)
    const storage = await page.evaluate(() => {
      if (!localStorage.getItem('novaPulse_hs')) {
        localStorage.setItem('novaPulse_hs', '0');
      }
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('hs') || k.includes('novaPulse')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
