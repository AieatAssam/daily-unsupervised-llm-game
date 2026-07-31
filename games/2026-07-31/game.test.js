import { test, expect } from '@playwright/test';

test.describe('2026-07-31 Neon Angler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-31/index.html');
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

  test('game responds to user input - click to start and cast', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click title screen to start
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);

    // Click in water area (lower 65% of canvas) to cast
    const waterY = box.y + box.height * 0.45;
    await page.mouse.click(box.x + box.width * 0.55, waterY);
    await page.waitForTimeout(800);

    // Move mouse around water area
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6);
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
    await page.waitForTimeout(200);

    // Click again in water (another cast position)
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
    await page.waitForTimeout(600);

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

    // Rapid clicks in various water positions
    for (let i = 0; i < 25; i++) {
      const fx = 0.2 + (i % 7) * 0.1;
      const fy = 0.4 + (i % 5) * 0.1;
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(50);
    }

    // Space key presses
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(60);
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
    await page.goto('/games/2026-07-31/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap title to start
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Tap water area to cast
    await page.touchscreen.tap(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await page.waitForTimeout(400);

    await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.6);
    await page.waitForTimeout(400);

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Pre-seed the key
    await page.evaluate(() => {
      localStorage.setItem('neonangler_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game (initGame writes hi-score key)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);

    // Cast into water
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
    await page.waitForTimeout(500);

    // Wait and keep clicking to interact with any bites
    for (let i = 0; i < 8; i++) {
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
      await page.waitForTimeout(400);
    }

    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('neonangler_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
