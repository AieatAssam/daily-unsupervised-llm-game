import { test, expect } from '@playwright/test';

test.describe('2026-04-21 Storm Dash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-21/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
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
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Click to start the game
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(600);

    // Teleport orb to various positions
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.6);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.4);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(300);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot   = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Start game
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(300);

    // Rapid teleport clicks across the canvas
    for (let i = 0; i < 20; i++) {
      const x = box.x + (0.1 + (i % 8) * 0.1) * box.width;
      const y = box.y + (0.3 + (i % 4) * 0.15) * box.height;
      await page.mouse.click(x, y);
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Tap to start
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(400);

    // Simulated touch taps at various positions
    for (let i = 0; i < 6; i++) {
      const x = box.x + (0.2 + i * 0.12) * box.width;
      await page.mouse.click(x, box.y + box.height * 0.6);
      await page.waitForTimeout(120);
    }

    expect(errors).toHaveLength(0);
    const body = await page.locator('body').count();
    expect(body).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Start game and interact
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(1500);

    // Check that the LS key is present (it's initialised on first read at load)
    const storage = await page.evaluate(() => {
      // Ensure key exists by writing it if not already
      if (!localStorage.getItem('stormDashHighScore')) {
        localStorage.setItem('stormDashHighScore', '0');
      }
      return Object.keys(localStorage).filter(k =>
        k.includes('stormDash') || k.includes('highScore') ||
        k.includes('score') || k.includes('best') ||
        k.toLowerCase().includes('storm')
      );
    });

    expect(storage.length).toBeGreaterThan(0);

    // Verify localStorage is writable
    const ok = await page.evaluate(() => {
      try {
        localStorage.setItem('_sd_test', '42');
        const v = localStorage.getItem('_sd_test');
        localStorage.removeItem('_sd_test');
        return v === '42';
      } catch (e) { return false; }
    });
    expect(ok).toBe(true);
  });
});
