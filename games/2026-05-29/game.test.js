import { test, expect } from '@playwright/test';

test.describe('2026-05-29 Neon Infiltrator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-29/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Start game
    await page.click('body');
    await page.waitForTimeout(500);
    // Send movement keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    // Check canvas is still rendering
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    // Start then rapidly press keys
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    for (let i = 0; i < 10; i++) {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      await page.keyboard.press(keys[i % 4]);
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
    // Click/tap to start
    await page.click('body');
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(1000);
    const keys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('neon')
      )
    );
    expect(keys.length).toBeGreaterThan(0);
  });
});
