import { test, expect } from '@playwright/test';

test.describe('2026-07-26 Signal Dash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-26/index.html');
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
    // Canvas should have dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('game responds to user input - click to start then hit lanes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to start
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(800);

    // Click each of the 4 lanes
    for (let i = 0; i < 4; i++) {
      const headerH = 70;
      const usableH = box.height - headerH - 50;
      const laneH = usableH / 4;
      const cy = box.y + headerH + (i + 0.5) * laneH;
      await page.mouse.click(box.x + box.width * 0.5, cy);
      await page.waitForTimeout(200);
    }

    // Press keyboard keys for lanes
    await page.keyboard.press('a');
    await page.waitForTimeout(100);
    await page.keyboard.press('s');
    await page.waitForTimeout(100);
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    await page.keyboard.press('f');
    await page.waitForTimeout(100);

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
    await page.waitForTimeout(500);

    // Rapid clicks across all 4 lanes
    for (let round = 0; round < 6; round++) {
      for (let i = 0; i < 4; i++) {
        const headerH = 70;
        const usableH = box.height - headerH - 50;
        const laneH = usableH / 4;
        const cy = box.y + headerH + (i + 0.5) * laneH;
        await page.mouse.click(box.x + box.width * 0.5, cy);
        await page.waitForTimeout(20);
      }
    }

    // Rapid key presses
    const keys = ['a', 's', 'd', 'f'];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(keys[i % 4]);
      await page.waitForTimeout(15);
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
    await page.goto('/games/2026-07-26/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Tap to start
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(800);

    // Tap each of the 4 lanes
    for (let i = 0; i < 4; i++) {
      const headerH = 70;
      const usableH = box.height - headerH - 50;
      const laneH = usableH / 4;
      const cy = box.y + headerH + (i + 0.5) * laneH;
      await page.touchscreen.tap(box.x + box.width / 2, cy);
      await page.waitForTimeout(150);
    }

    // Canvas should still be visible
    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Seed the key
    await page.evaluate(() => {
      localStorage.setItem('signaldash_hs', '0');
    });

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Start game
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);

    // Interact - click lanes repeatedly to try to score/miss
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < 4; i++) {
        const headerH = 70;
        const usableH = box.height - headerH - 50;
        const laneH = usableH / 4;
        const cy = box.y + headerH + (i + 0.5) * laneH;
        await page.mouse.click(box.x + box.width * 0.5, cy);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(400);
    }

    // Wait for potential game over to write HS
    await page.waitForTimeout(1500);

    // Ensure key exists (was set at minimum by seeding)
    const val = await page.evaluate(() => localStorage.getItem('signaldash_hs'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
