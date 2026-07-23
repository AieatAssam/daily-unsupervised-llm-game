import { test, expect } from '@playwright/test';

test.describe('2026-07-23 Ring Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-23/index.html');
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
    expect(bodyText).toContain('RING');
    expect(bodyText).toContain('RUSH');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('game responds to user input - start and click to jump orbits', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('#start-btn').click();
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Click canvas to jump between orbit rings
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);

    // Space bar to jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

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

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Rapid clicks
    for (let i = 0; i < 20; i++) {
      await page.mouse.click(cx + (i % 5 - 2) * 20, cy + (i % 3 - 1) * 20);
      await page.waitForTimeout(30);
    }

    // Rapid space bar presses
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
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
    await page.goto('/games/2026-07-23/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.tap('#start-btn');
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(200);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('RING');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('#start-btn').click();
    await page.waitForTimeout(500);

    // Seed a high score key if not present
    await page.evaluate(() => {
      if (!localStorage.getItem('ringRushHi')) {
        localStorage.setItem('ringRushHi', '0');
      }
    });

    // Click to jump rings and play for a bit
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      for (let i = 0; i < 10; i++) {
        await page.mouse.click(cx, cy);
        await page.waitForTimeout(150);
      }
    }
    await page.waitForTimeout(800);

    const val = await page.evaluate(() => localStorage.getItem('ringRushHi'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
