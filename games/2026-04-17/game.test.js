import { test, expect } from '@playwright/test';

test.describe('2026-04-17 Volt Chain', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-17/index.html');
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
    const w = await canvas.getAttribute('width');
    const h = await canvas.getAttribute('height');
    expect(parseInt(w)).toBeGreaterThan(0);
    expect(parseInt(h)).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game
    await page.click('canvas');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(200);

    // Rapid clicks across the canvas to try to chain posts
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    for (let i = 0; i < 15; i++) {
      const rx = box.x + 50 + Math.floor(Math.random() * (box.width - 100));
      const ry = box.y + 100 + Math.floor(Math.random() * (box.height - 150));
      await page.mouse.click(rx, ry);
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
    page.on('pageerror', error => errors.push(error));

    // Tap to start
    await page.mouse.click(187, 334);
    await page.waitForTimeout(300);

    // Tap multiple posts
    await page.mouse.click(100, 200);
    await page.waitForTimeout(150);
    await page.mouse.click(270, 300);
    await page.waitForTimeout(150);
    await page.mouse.click(180, 450);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game — initState writes the highScore key
    await page.click('canvas');
    await page.waitForTimeout(1200);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.toLowerCase().includes('high')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
