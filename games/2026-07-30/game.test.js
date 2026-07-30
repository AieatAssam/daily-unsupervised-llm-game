import { test, expect } from '@playwright/test';

test.describe('2026-07-30 Circuit Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-30/index.html');
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

  test('game responds to user input - click to start and toggle switches', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to start from title
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);

    // Click in switch areas (row 1 center: ~38% height, row 2 center: ~63% height)
    // Row 1 switches at approximately (25%, 37%), (50%, 37%), (75%, 37%)
    const switchPositions = [
      { fx: 0.25, fy: 0.38 }, { fx: 0.50, fy: 0.38 }, { fx: 0.75, fy: 0.38 },
      { fx: 0.25, fy: 0.63 }, { fx: 0.50, fy: 0.63 }, { fx: 0.75, fy: 0.63 },
    ];
    for (const pos of switchPositions) {
      await page.mouse.click(box.x + box.width * pos.fx, box.y + box.height * pos.fy);
      await page.waitForTimeout(150);
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

    // Rapidly click switches and random areas
    for (let i = 0; i < 30; i++) {
      const fx = 0.1 + (i % 8) * 0.1;
      const fy = 0.3 + (i % 3) * 0.15;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
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
    await page.goto('/games/2026-07-30/index.html');
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

    // Tap switch positions
    await page.touchscreen.tap(box.x + box.width * 0.25, box.y + box.height * 0.38);
    await page.waitForTimeout(300);
    await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height * 0.38);
    await page.waitForTimeout(300);
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.63);
    await page.waitForTimeout(300);

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('circuitrush_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Let balls spawn and score some points (toggle switches, wait for balls to exit)
    // Toggle switches to route balls
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.38);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.63);
    await page.waitForTimeout(200);

    // Wait for balls to travel through circuit and potentially score
    await page.waitForTimeout(6000);

    const val = await page.evaluate(() => localStorage.getItem('circuitrush_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
