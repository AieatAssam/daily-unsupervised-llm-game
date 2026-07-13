import { test, expect } from '@playwright/test';

test.describe('2026-07-13 Depth Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-13/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Hold to start and dive
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    await page.waitForTimeout(500);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Start game
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.up();
    await page.waitForTimeout(200);
    // Rapid hold/release cycles
    for (let i = 0; i < 15; i++) {
      await page.mouse.down();
      await page.waitForTimeout(60);
      await page.mouse.up();
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport with tap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Use mouse events (works cross-platform in Playwright)
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(300);
    // Rapid hold/release
    for (let i = 0; i < 5; i++) {
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.up();
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(400);
    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and interact
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('score') || k.toLowerCase().includes('depth') || k.toLowerCase().includes('best')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
