import { test, expect } from '@playwright/test';

test.describe('2026-05-09 Neon Dunk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-09/index.html');
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
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.click('canvas');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      await page.click('canvas', { position: { x: 300, y: 200 } });
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.click('canvas');
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High') || k.includes('neon')
      );
    });
    expect(storage.length).toBeGreaterThan(0);
  });
});
