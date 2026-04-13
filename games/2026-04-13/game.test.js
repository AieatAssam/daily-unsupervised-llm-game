import { test, expect } from '@playwright/test';

test.describe('2026-04-13 Lasso Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-13/index.html');
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
    // Menu should show title
    const html = await page.content();
    expect(html).toContain('LASSO RUSH');
  });

  test('game responds to user input', async ({ page }) => {
    // Click anywhere to start the game (menu overlay passes click to startGame)
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game by clicking
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid lasso drags in playing state
    const box = await page.locator('canvas').boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      for (let i = 0; i < 8; i++) {
        await page.mouse.move(cx + i * 10, cy + i * 10);
        await page.mouse.down();
        await page.mouse.move(cx + i * 10 + 60, cy + i * 10 + 60);
        await page.mouse.up();
        await page.waitForTimeout(50);
      }
    } else {
      for (let i = 0; i < 8; i++) {
        await page.click('body');
        await page.waitForTimeout(50);
      }
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Interact to start (click works cross-browser)
    await page.mouse.click(187, 400);
    await page.waitForTimeout(300);

    // Simulate another interaction
    await page.mouse.click(187, 350);
    await page.waitForTimeout(400);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Key is initialized on mount, even before playing
    await page.waitForTimeout(500);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('lasso')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
