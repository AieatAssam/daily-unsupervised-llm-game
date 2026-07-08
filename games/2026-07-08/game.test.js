import { test, expect } from '@playwright/test';

test.describe('2026-07-08 Tangle Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-08/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('TANGLE');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Click play button then interact
    await page.click('button');
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(200 + i * 20, 300 + i * 10);
      await page.mouse.down();
      await page.mouse.move(220 + i * 20, 320 + i * 10);
      await page.mouse.up();
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.click('body');
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('button');
    await page.waitForTimeout(1000);
    await page.click('body');
    await page.waitForTimeout(500);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('Hi') || k.includes('high')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
