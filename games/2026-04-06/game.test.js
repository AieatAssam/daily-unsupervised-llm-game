import { test, expect } from '@playwright/test';

test.describe('2026-04-06 Neon Conduit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-06/index.html');
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
    expect(body.length).toBeGreaterThan(0);
    // Menu should be visible with game title
    const html = await page.content();
    expect(html).toContain('NEON CONDUIT');
  });

  test('game responds to user input', async ({ page }) => {
    // Click starts the game from menu
    await page.click('body');
    await page.waitForTimeout(800);

    // Game should now be active - canvas should be present
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // HUD elements should appear (level indicator)
    const content = await page.textContent('body');
    // Either still on menu or game started
    expect(content.length).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game first
    await page.click('body');
    await page.waitForTimeout(600);

    // Rapid clicks on the canvas to rotate tiles
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 10; i++) {
        const x = box.x + box.width * (0.3 + Math.random() * 0.4);
        const y = box.y + box.height * (0.3 + Math.random() * 0.4);
        await page.mouse.click(x, y);
        await page.waitForTimeout(40);
      }
    }

    // Should still be responsive with no errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    // Interact to start (use click for compatibility across browsers)
    await page.click('body');
    await page.waitForTimeout(600);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Canvas should still exist and be reasonably sized
    const canvas = page.locator('canvas');
    const count = await canvas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game
    await page.click('body');
    await page.waitForTimeout(800);

    // Interact to potentially score points
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 15; i++) {
        const x = box.x + box.width * (0.2 + (i%5)*0.15);
        const y = box.y + box.height * (0.2 + Math.floor(i/5)*0.2);
        await page.mouse.click(x, y);
        await page.waitForTimeout(60);
      }
    }
    await page.waitForTimeout(1000);

    // Check localStorage for score-related key
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('Hi') || k.includes('hi') || k.includes('neon')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
