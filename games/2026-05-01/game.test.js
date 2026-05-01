import { test, expect } from '@playwright/test';

test.describe('2026-05-01 Neon Pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-01/index.html');
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
    expect(body.length).toBeGreaterThan(10);
    // Title visible
    const bodyText = body.toUpperCase();
    expect(bodyText).toContain('NEON PAIRS');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);
    const hasReactRoot = await page.locator('#root').count();
    expect(hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 150 + i * 25, y: 200 + (i % 3) * 20 } });
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.click('body');
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(10);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('Pairs')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
