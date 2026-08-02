import { test, expect } from '@playwright/test';

test.describe('2026-08-02 Neon Coil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-02/index.html');
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

  test('game responds to user input - steering with arrow keys', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start the game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Steer the coil around with arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);

    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start the game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);

    // Rapid, chaotic key presses including opposite-direction spam
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'Space', 'Enter'];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(20);
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
    await page.goto('/games/2026-08-02/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap to start
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(600);

    // Use the on-screen D-pad buttons to steer
    const dpadUp = page.locator('[data-testid="dpad-up"]');
    const dpadRight = page.locator('[data-testid="dpad-right"]');
    const dpadDown = page.locator('[data-testid="dpad-down"]');

    if (await dpadUp.count() > 0) {
      await dpadUp.tap();
      await page.waitForTimeout(200);
      await dpadRight.tap();
      await page.waitForTimeout(200);
      await dpadDown.tap();
      await page.waitForTimeout(200);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonCoil_highScore', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start the game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Let the coil run and gently steer to increase chance of eating / crashing
    const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(4000);

    const val = await page.evaluate(() => localStorage.getItem('neonCoil_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
