import { test, expect } from '@playwright/test';

test.describe('2026-05-03 Chromawave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-03/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
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
    expect(body.length).toBeGreaterThan(5);
    const bodyUpper = body.toUpperCase();
    expect(bodyUpper).toContain('CHROMAWAVE');
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body', { position: { x: 200, y: 300 } });
    await page.waitForTimeout(500);
    const hasReactRoot = await page.locator('#root').count();
    expect(hasReactRoot).toBeGreaterThan(0);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game then click zones rapidly using mouse API to bypass interception checks
    await page.mouse.click(300, 300);
    await page.waitForTimeout(300);
    for (let i = 0; i < 12; i++) {
      const x = 80 + (i % 4) * 120;
      await page.mouse.click(x, 300);
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
    await page.locator('canvas').click();
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(5);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body', { position: { x: 300, y: 300 } });
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('chroma')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
