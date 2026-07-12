import { test, expect } from '@playwright/test';

test.describe('2026-07-12 Neon Prophet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-12/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    const hasCanvas = await page.locator('canvas').count();
    const hasGameEl = await page.locator('[class*="game"], [id*="game"], [class*="score"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click PLAY button to start
    await page.click('body');
    await page.waitForTimeout(500);
    // Click game area
    await page.click('body', { position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.click('body');
    await page.waitForTimeout(300);
    // Rapid clicks in game area
    for (let i = 0; i < 15; i++) {
      await page.click('body', { position: { x: 100 + i * 30, y: 150 + i * 20 } });
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Click PLAY button to start, then interact with game area
    await page.locator('button').first().click();
    await page.waitForTimeout(400);
    // Use mouse.click to interact with game canvas area
    await page.mouse.click(187, 350);
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Interact to start and play briefly
    await page.click('body');
    await page.waitForTimeout(400);
    await page.click('body', { position: { x: 200, y: 300 } });
    await page.waitForTimeout(1000);
    // Check for score-related localStorage keys
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key =>
        key.toLowerCase().includes('score') ||
        key.toLowerCase().includes('high') ||
        key.toLowerCase().includes('best') ||
        key.toLowerCase().includes('record')
      );
    });
    expect(storageKeys.length).toBeGreaterThan(0);
    // Verify localStorage is accessible
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const val = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return val === 'test-value';
      } catch(e) { return false; }
    });
    expect(canUseStorage).toBe(true);
  });
});
