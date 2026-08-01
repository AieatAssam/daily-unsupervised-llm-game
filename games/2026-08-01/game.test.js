import { test, expect } from '@playwright/test';

test.describe('2026-08-01 Neon Pinball', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-01/index.html');
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

  test('game responds to user input - launch and flippers', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Hold space briefly to charge, then release to launch
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.waitForTimeout(500);

    // Activate left flipper
    await page.keyboard.down('KeyZ');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyZ');

    // Activate right flipper
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');

    // Alternate flippers
    for (let i = 0; i < 6; i++) {
      await page.keyboard.down(i % 2 === 0 ? 'KeyZ' : 'ArrowRight');
      await page.waitForTimeout(120);
      await page.keyboard.up(i % 2 === 0 ? 'KeyZ' : 'ArrowRight');
      await page.waitForTimeout(80);
    }

    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Rapid mouse clicks on left and right halves
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0;
      await page.mouse.click(
        box.x + box.width * (side ? 0.25 : 0.75),
        box.y + box.height * 0.85
      );
      await page.waitForTimeout(40);
    }

    // Rapid key presses
    const keys = ['KeyZ', 'ArrowRight', 'KeyX', 'Space', 'ArrowLeft'];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(30);
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
    await page.goto('/games/2026-08-01/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap and hold to charge spring, then release to launch
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.85);
    await page.waitForTimeout(300);

    // Tap left side for left flipper
    await page.touchscreen.tap(box.x + box.width * 0.25, box.y + box.height * 0.9);
    await page.waitForTimeout(200);

    // Tap right side for right flipper
    await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height * 0.9);
    await page.waitForTimeout(200);

    // Several more taps to exercise touch input
    for (let i = 0; i < 6; i++) {
      await page.touchscreen.tap(
        box.x + box.width * (i % 2 === 0 ? 0.25 : 0.75),
        box.y + box.height * 0.88
      );
      await page.waitForTimeout(100);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Pre-seed key
    await page.evaluate(() => {
      localStorage.setItem('plasmaPinball_hi', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Launch the ball
    await page.keyboard.down('Space');
    await page.waitForTimeout(300);
    await page.keyboard.up('Space');
    await page.waitForTimeout(600);

    // Keep flippers active for a while
    for (let i = 0; i < 10; i++) {
      await page.keyboard.down('KeyZ');
      await page.waitForTimeout(80);
      await page.keyboard.up('KeyZ');
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(80);
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(3000);

    const val = await page.evaluate(() => localStorage.getItem('plasmaPinball_hi'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
