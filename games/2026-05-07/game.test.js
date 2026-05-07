import { test, expect } from '@playwright/test';

test.describe('2026-05-07 Surge Line', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-07/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
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
    expect(content.length).toBeGreaterThan(0);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('canvas');
    await page.waitForTimeout(600);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start the game
    await page.click('canvas');
    await page.waitForTimeout(300);
    // Move mouse and click rapidly
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(240, 100 + i * 60);
      await page.click('canvas', { position: { x: 240, y: 100 + i * 60 } });
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.click('canvas');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game and interact
    await page.click('canvas');
    await page.waitForTimeout(800);
    // Fire the zap a few times
    for (let i = 0; i < 4; i++) {
      await page.mouse.move(240, 150 + i * 80);
      await page.click('canvas', { position: { x: 240, y: 150 + i * 80 } });
      await page.waitForTimeout(400);
    }
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('Score') || k.includes('score') || k.includes('best') || k.includes('surge')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
