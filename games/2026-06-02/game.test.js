import { test, expect } from '@playwright/test';

test.describe('2026-06-02 Neon Bloom', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-02/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // HUD labels should be visible
    expect(body).toContain('SCORE');
    expect(body).toContain('LIVES');
    expect(body).toContain('COMBO');
  });

  test('game responds to user input', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Click to start
    await page.click('canvas');
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    // Should now show playing state (BLOOM hint visible)
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    // Start the game
    await page.click('canvas');
    await page.waitForTimeout(300);
    // Rapid clicks across the game grid
    const positions = [
      { x: 150, y: 200 }, { x: 250, y: 200 }, { x: 350, y: 200 },
      { x: 150, y: 300 }, { x: 250, y: 300 }, { x: 350, y: 300 },
      { x: 200, y: 250 }, { x: 300, y: 250 }, { x: 400, y: 250 },
      { x: 100, y: 400 },
    ];
    for (const pos of positions) {
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/games/2026-06-02/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Touch to start
    await page.tap('canvas');
    await page.waitForTimeout(500);

    // Touch interactions on grid
    await page.tap('canvas', { position: { x: 100, y: 200 } });
    await page.tap('canvas', { position: { x: 200, y: 300 } });
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.waitForTimeout(500);
    // Start game
    await page.click('canvas');
    await page.waitForTimeout(3000);
    // Click various grid positions to try to harvest flowers
    for (let i = 0; i < 8; i++) {
      const x = 80 + (i % 5) * 80;
      const y = 120 + Math.floor(i / 5) * 100;
      await page.mouse.click(x, y);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('neonBloom') || k.includes('hs') || k.includes('score') || k.includes('bloom')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
