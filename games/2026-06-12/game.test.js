import { test, expect } from '@playwright/test';

test.describe('2026-06-12 Neon Trace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-12/index.html');
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
    expect(gameContent).toContain('NEON TRACE');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const startButton = page.locator('.play-btn');
    await expect(startButton).toBeVisible();
    await startButton.click();
    await page.waitForTimeout(300);

    // Start screen should be gone once playing begins
    await expect(page.locator('.title')).toHaveCount(0);

    // Drag along the canvas to trace the shape
    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy - 100);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(cx + i * 5, cy - 100 + i * 5);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const startButton = page.locator('.play-btn');
    await startButton.click();
    await page.waitForTimeout(200);

    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 10; i++) {
      const x = box.x + Math.random() * box.width;
      const y = box.y + Math.random() * box.height;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 10, y + 10);
      await page.mouse.up();
      await page.waitForTimeout(30);
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
    page.on('pageerror', error => errors.push(error));

    await page.goto('/games/2026-06-12/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('.play-btn');
    await page.waitForTimeout(300);

    await page.touchscreen.tap(180, 250);
    await page.waitForTimeout(400);
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(400);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('.play-btn');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
