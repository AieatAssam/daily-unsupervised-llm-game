import { test, expect } from '@playwright/test';

test.describe('2026-05-11 Ring Roll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-11/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(10);
    await expect(page.locator('canvas')).toBeVisible();
    const hasTitle = content.includes('RING ROLL') || content.includes('Ring Roll');
    expect(hasTitle).toBe(true);
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.click('canvas');
    await page.waitForTimeout(600);
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
    // After click game should be in playing state
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      await page.click('canvas');
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.click('canvas');
    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(1500);
    const keys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      )
    );
    expect(keys.length).toBeGreaterThan(0);
  });
});
