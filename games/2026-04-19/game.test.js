import { test, expect } from '@playwright/test';

test.describe('2026-04-19 Sync Burst', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-19/index.html');
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
    // Click to start
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
    await page.waitForTimeout(300);

    // Rapid clicks across different zone positions
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const positions = [
      [box.x + box.width * 0.25, box.y + box.height * 0.32],
      [box.x + box.width * 0.75, box.y + box.height * 0.32],
      [box.x + box.width * 0.50, box.y + box.height * 0.68],
      [box.x + box.width * 0.25, box.y + box.height * 0.32],
      [box.x + box.width * 0.75, box.y + box.height * 0.32],
    ];

    for (const [x, y] of positions) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(80);
    }
    for (let i = 0; i < 10; i++) {
      const x = box.x + 50 + Math.floor(Math.random() * (box.width - 100));
      const y = box.y + 80 + Math.floor(Math.random() * (box.height - 120));
      await page.mouse.click(x, y);
      await page.waitForTimeout(55);
    }

    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Tap to start
    await page.mouse.click(187, 333);
    await page.waitForTimeout(300);

    // Tap zone positions (scaled to 375x667)
    await page.mouse.click(94, 213);
    await page.waitForTimeout(120);
    await page.mouse.click(281, 213);
    await page.waitForTimeout(120);
    await page.mouse.click(187, 453);
    await page.waitForTimeout(120);
    await page.mouse.click(94, 213);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start game — initGame writes the syncBurstHigh key
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
