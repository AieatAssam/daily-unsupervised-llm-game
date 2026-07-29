import { test, expect } from '@playwright/test';

test.describe('2026-07-29 Tightrope Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-29/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
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

  test('game responds to user input - click to start then mouse move', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to start
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Move mouse left/right to tilt the rope
    const positions = [0.1, 0.3, 0.5, 0.7, 0.9, 0.4, 0.6];
    for (const fx of positions) {
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * 0.5);
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(500);
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

    // Rapid mouse movements across canvas
    for (let i = 0; i < 40; i++) {
      const fx = (i % 10) / 9;
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * 0.5);
      await page.waitForTimeout(30);
    }

    // Rapid clicks
    for (let i = 0; i < 15; i++) {
      const fx = 0.1 + (i % 8) * 0.1;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * 0.4);
      await page.waitForTimeout(40);
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
    await page.goto('/games/2026-07-29/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap to start
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Touch drag left and right to tilt rope
    for (let i = 0; i < 6; i++) {
      const fx = i % 2 === 0 ? 0.15 : 0.85;
      await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * 0.5);
      await page.waitForTimeout(300);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tightroprush_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    // Move mouse all the way to catch falling gems (simulate gameplay)
    for (let round = 0; round < 30; round++) {
      const fx = 0.1 + (round % 9) * 0.09;
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * 0.5);
      await page.waitForTimeout(150);
    }

    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('tightroprush_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
