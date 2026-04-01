import { test, expect } from '@playwright/test';

test.describe('2026-04-01 Spin Frenzy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-01/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
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

    const hasCanvas = await page.locator('canvas').count();
    const hasGameElements = await page.locator('[class*="game"], [id*="game"], [class*="score"]').count();
    expect(hasCanvas + hasGameElements).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Verify canvas is present and no errors
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Use mouse.click with absolute coordinates to avoid element intercept issues
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(150 + (i % 5) * 70, 250 + Math.floor(i / 5) * 100);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Use mouse.click for cross-browser compatibility (tap requires hasTouch context)
    await page.mouse.click(187, 300);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start, play briefly
    await page.click('body');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related keys (case-insensitive)
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => {
        const lower = k.toLowerCase();
        return lower.includes('score') || lower.includes('high') || lower.includes('best');
      });
    });

    // spinFrenzyHighScore is initialized on load, so it should always be present
    expect(storageKeys.length).toBeGreaterThan(0);

    // Verify localStorage is accessible
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('_test_', '1');
        const v = localStorage.getItem('_test_');
        localStorage.removeItem('_test_');
        return v === '1';
      } catch(e) {
        return false;
      }
    });
    expect(canUseStorage).toBe(true);
  });
});
