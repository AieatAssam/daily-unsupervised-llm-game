import { test, expect } from '@playwright/test';

test.describe('2026-06-04 Neon Putt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-04/index.html');
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
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const title = await page.title();
    expect(title).toContain('Neon Putt');
    const w = await canvas.evaluate(el => el.width);
    const h = await canvas.evaluate(el => el.height);
    expect(w).toBe(800);
    expect(h).toBe(560);
  });

  test('game responds to user input', async ({ page }) => {
    // Click play button
    await page.click('canvas', { position: { x: 400, y: 403 } });
    await page.waitForTimeout(800);

    // Verify game started - shoot ball from hole 1 starting position
    await page.mouse.move(112, 280);
    await page.mouse.down();
    await page.mouse.move(50, 280);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Canvas should still be visible and functional
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click play
    await page.click('canvas', { position: { x: 400, y: 403 } });
    await page.waitForTimeout(500);

    // Rapid clicks around the canvas
    for (let i = 0; i < 10; i++) {
      await page.click('canvas', { position: { x: 100 + i * 50, y: 280 } });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Canvas should be visible and scaled properly
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);

    // Click within the scaled canvas area (canvas height at 375px viewport ≈ 263px)
    await page.click('canvas', { position: { x: 187, y: 130 } });
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and shoot ball
    await page.click('canvas', { position: { x: 400, y: 403 } });
    await page.waitForTimeout(500);

    // Take a shot
    await page.mouse.move(112, 280);
    await page.mouse.down();
    await page.mouse.move(50, 280);
    await page.mouse.up();
    await page.waitForTimeout(3000);

    // localStorage key initialized on game load
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('neonPutt') || k.includes('score') || k.includes('best') || k.includes('high')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
    // Verify the stored value is a valid number
    const val = await page.evaluate(() => localStorage.getItem('neonPuttBest'));
    expect(parseInt(val)).toBeGreaterThan(0);
  });
});
