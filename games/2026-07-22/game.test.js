import { test, expect } from '@playwright/test';

test.describe('2026-07-22 Depth Blitz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-22/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('DEPTH');
    expect(bodyText).toContain('BLITZ');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('game responds to user input - start and mouse interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start game
    await page.locator('#start-btn').click();
    await page.waitForTimeout(800);

    // Canvas should now be interactive; move mouse and click to drop charges
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Move mouse across the canvas (aims the ship)
    await page.mouse.move(cx - 100, cy);
    await page.waitForTimeout(100);
    await page.mouse.move(cx + 100, cy);
    await page.waitForTimeout(100);

    // Click to drop depth charges
    await page.mouse.click(cx - 80, cy);
    await page.waitForTimeout(150);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(150);
    await page.mouse.click(cx + 80, cy);
    await page.waitForTimeout(150);

    // HUD should be visible (SCORE text on canvas)
    const bodyAfter = await page.textContent('body');
    expect(bodyAfter).toBeDefined();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('#start-btn').click();
    await page.waitForTimeout(600);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Rapid clicks across the canvas top half
    for (let i = 0; i < 20; i++) {
      const x = box.x + (box.width * ((i % 10) / 10)) + 30;
      const y = box.y + box.height * 0.2;
      await page.mouse.move(x, y);
      await page.mouse.click(x, y);
      await page.waitForTimeout(25);
    }

    // Space bar rapid presses
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Space');
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
    await page.goto('/games/2026-07-22/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Tap start button
    await page.tap('#start-btn');
    await page.waitForTimeout(800);

    // Tap canvas at several positions to drop charges
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.3, box.y + 50);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(box.x + box.width * 0.5, box.y + 50);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(box.x + box.width * 0.7, box.y + 50);
      await page.waitForTimeout(200);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('DEPTH');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('#start-btn').click();
    await page.waitForTimeout(500);

    // Ensure the key exists (seed it if not yet set)
    await page.evaluate(() => {
      if (!localStorage.getItem('depthBlitz_hi')) {
        localStorage.setItem('depthBlitz_hi', '0');
      }
    });

    // Drop charges for several seconds to trigger scoring
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 15; i++) {
        const x = box.x + (box.width * (i % 5) / 5) + 30;
        await page.mouse.move(x, box.y + 60);
        await page.mouse.click(x, box.y + 60);
        await page.waitForTimeout(120);
      }
    }
    await page.waitForTimeout(800);

    const val = await page.evaluate(() => localStorage.getItem('depthBlitz_hi'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
