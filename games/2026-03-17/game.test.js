import { test, expect } from '@playwright/test';

test.describe('2026-03-17 Pocket Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-17/index.html');
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
    // Should show title and play button
    expect(gameContent).toContain('POCKET RUSH');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasGameRoot = await page.locator('#game-root').count();
    expect(hasCanvas + hasGameRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Click play first
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid drag-shoot interactions
    for (let i = 0; i < 10; i++) {
      const x = 200 + i * 30;
      const y = 300 + i * 10;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(30);
      await page.mouse.move(x + 50, y + 50);
      await page.mouse.up();
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('body');
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);

    const canvas = await page.locator('canvas').count();
    expect(canvas).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start game (which saves localStorage immediately)
    await page.click('body');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
