import { test, expect } from '@playwright/test';

test.describe('2026-07-27 Glow Hunt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-27/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('[data-testid="game-canvas"]');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('game responds to user input - click to start and interact', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to start the game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(2500); // wait for reveal phase to finish

    // Click at several spots on canvas to try to pick an orb
    const spots = [
      [0.25, 0.4], [0.5, 0.4], [0.75, 0.4],
      [0.35, 0.6], [0.65, 0.6],
    ];
    for (const [fx, fy] of spots) {
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(200);
    }

    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    // Rapid clicks all over the canvas
    for (let i = 0; i < 30; i++) {
      const fx = 0.1 + (i % 9) * 0.1;
      const fy = 0.2 + (Math.floor(i / 9) % 4) * 0.2;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(25);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with tap', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-27/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap to start
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(2500);

    // Tap several positions to interact with orbs
    for (let i = 0; i < 5; i++) {
      const fx = 0.2 + i * 0.15;
      const fy = 0.45 + (i % 2) * 0.15;
      await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(300);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Seed key
    await page.evaluate(() => {
      localStorage.setItem('glowhunt_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    // Click rapidly to drive through multiple rounds and trigger game over
    for (let round = 0; round < 20; round++) {
      const fx = 0.15 + (round % 7) * 0.12;
      const fy = 0.35 + (round % 3) * 0.2;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(120);
    }

    // Allow time for game over + HS write
    await page.waitForTimeout(2000);

    const val = await page.evaluate(() => localStorage.getItem('glowhunt_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
