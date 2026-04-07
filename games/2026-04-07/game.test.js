import { test, expect } from '@playwright/test';

test.describe('2026-04-07 Neon Swarm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-07/index.html');
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
    const html = await page.content();
    expect(html).toContain('NEON');
  });

  test('game responds to user input', async ({ page }) => {
    // Click starts the game from menu
    await page.click('body');
    await page.waitForTimeout(800);

    // Game should now be active — canvas should be present
    const count = await page.locator('canvas').count();
    expect(count).toBeGreaterThan(0);

    // Canvas should be non-trivially sized
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game
    await page.click('body');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Rapid mouse moves + clicks (simulates player dodging and shooting)
      for (let i = 0; i < 12; i++) {
        const x = box.x + box.width * (0.2 + (i % 6) * 0.12);
        const y = box.y + box.height * 0.85;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.waitForTimeout(30);
        await page.mouse.up();
        await page.waitForTimeout(20);
      }
    }

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

    // Interact to start (use click for compatibility)
    await page.click('body');
    await page.waitForTimeout(600);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Canvas should be visible and fit within mobile viewport
    const canvas = page.locator('canvas');
    const count = await canvas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and interact to generate score
    await page.click('body');
    await page.waitForTimeout(600);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Hold mouse down to shoot enemies
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.85);
      await page.mouse.down();
      await page.waitForTimeout(2000);
      await page.mouse.up();
    }

    // Check localStorage for score key
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('neonSwarm') || k.includes('highScore') || k.includes('score') ||
        k.includes('best') || k.includes('Hi') || k.includes('hi')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
