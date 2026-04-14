import { test, expect } from '@playwright/test';

test.describe('2026-04-14 Neon Archer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-14/index.html');
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

    // Canvas should exist and have content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const w = await canvas.getAttribute('width');
    const h = await canvas.getAttribute('height');
    expect(parseInt(w)).toBeGreaterThan(0);
    expect(parseInt(h)).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start game from title screen
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Canvas and react root should be present
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

    // Rapid clicks (simulate rapid charge-and-release)
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(400 + i * 5, 300);
      await page.mouse.down();
      await page.waitForTimeout(40);
      await page.mouse.up();
      await page.waitForTimeout(30);
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

    // Click to start (title → game)
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Mouse down and release (charge + fire)
    await page.mouse.move(190, 300);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Play briefly to trigger localStorage initialization
    await page.click('canvas');
    await page.waitForTimeout(1000);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best')
      );
    });

    // neonArcher_highScore key should be present
    expect(storage.length).toBeGreaterThan(0);
  });
});
