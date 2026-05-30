import { test, expect } from '@playwright/test';

test.describe('2026-05-30 Neon Strike', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-30/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(1500);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const count = await canvas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    // Use canvas-relative coordinates to aim and bowl
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.88;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
    const count = await canvas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.88;

    for (let i = 0; i < 3; i++) {
      await page.mouse.move(cx + (i - 1) * 20, cy);
      await page.mouse.down();
      await page.waitForTimeout(400);
      await page.mouse.up();
      await page.waitForTimeout(300);
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
    page.on('pageerror', e => errors.push(e.message));

    // Use click instead of tap for cross-browser compatibility
    await page.click('canvas');
    await page.waitForTimeout(800);
    expect(errors).toHaveLength(0);

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Game initializes localStorage key on load
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.88;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(3000);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('neonStrike') || k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('hi')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
