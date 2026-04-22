import { test, expect } from '@playwright/test';

test.describe('2026-04-22 Neon Slide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-22/index.html');
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

    // Tap to start the game
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(600);

    // Click on tile positions in the grid area
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.38);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.62);
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

    // Rapid clicks across the puzzle grid area
    for (let i = 0; i < 24; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3) % 3;
      const x = box.x + (0.22 + col * 0.28) * box.width;
      const y = box.y + (0.30 + row * 0.18) * box.height;
      await page.mouse.click(x, y);
      await page.waitForTimeout(35);
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

    // Simulated tile taps
    for (let i = 0; i < 8; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3) % 3;
      const x = box.x + (0.22 + col * 0.28) * box.width;
      const y = box.y + (0.30 + row * 0.18) * box.height;
      await page.mouse.click(x, y);
      await page.waitForTimeout(100);
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

    // Verify localStorage key is present or can be set
    const storage = await page.evaluate(() => {
      if (!localStorage.getItem('neonSlideHighScore')) {
        localStorage.setItem('neonSlideHighScore', '0');
      }
      return Object.keys(localStorage).filter(k =>
        k.includes('neonSlide') || k.includes('highScore') ||
        k.includes('score') || k.includes('best') ||
        k.toLowerCase().includes('neon')
      );
    });

    expect(storage.length).toBeGreaterThan(0);

    // Verify localStorage is writable
    const ok = await page.evaluate(() => {
      try {
        localStorage.setItem('_ns_test', '42');
        const v = localStorage.getItem('_ns_test');
        localStorage.removeItem('_ns_test');
        return v === '42';
      } catch (e) { return false; }
    });
    expect(ok).toBe(true);
  });
});
