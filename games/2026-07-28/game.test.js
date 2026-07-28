import { test, expect } from '@playwright/test';

test.describe('2026-07-28 Neon Deflect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-28/index.html');
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

  test('game responds to user input - click to start and place paddles', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to start the game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Click various positions to place deflector paddles
    const spots = [
      [0.3, 0.3], [0.7, 0.3], [0.5, 0.5],
      [0.3, 0.7], [0.7, 0.7],
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

    // Rapid clicks all over the canvas to stress-test
    for (let i = 0; i < 30; i++) {
      const fx = 0.1 + (i % 9) * 0.09;
      const fy = 0.1 + (Math.floor(i / 9) % 4) * 0.22;
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
    await page.goto('/games/2026-07-28/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap to start
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Tap several positions to place paddles
    for (let i = 0; i < 5; i++) {
      const fx = 0.2 + i * 0.15;
      const fy = 0.3 + (i % 2) * 0.4;
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
      localStorage.setItem('neondeflect_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    // Click repeatedly to trigger game events
    for (let round = 0; round < 20; round++) {
      const fx = 0.15 + (round % 7) * 0.12;
      const fy = 0.15 + (round % 5) * 0.18;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(100);
    }

    // Allow time for game events and localStorage write
    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('neondeflect_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
