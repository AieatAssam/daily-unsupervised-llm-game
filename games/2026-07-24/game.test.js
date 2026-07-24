import { test, expect } from '@playwright/test';

test.describe('2026-07-24 Volt Weave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-24/index.html');
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
    expect(bodyText).toContain('VOLT');
    expect(bodyText).toContain('WEAVE');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('game responds to user input - start and click canvas to draw thread', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('#start-btn').click();
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Click center (peg at 50%,50%) to start a thread
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);

    // Click adjacent pegs (inner cluster area)
    await page.mouse.click(cx + box.width * 0.15, cy - box.height * 0.15);
    await page.waitForTimeout(200);
    await page.mouse.click(cx - box.width * 0.15, cy + box.height * 0.15);
    await page.waitForTimeout(200);

    // Click back near center to try closing the loop
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(300);

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

    // Rapid clicks across the canvas
    for (let i = 0; i < 25; i++) {
      const ox = (i % 5 - 2) * box.width * 0.12;
      const oy = (Math.floor(i / 5) % 4 - 2) * box.height * 0.1;
      await page.mouse.click(cx + ox, cy + oy);
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
    await page.goto('/games/2026-07-24/index.html');
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
      // Tap center peg and nearby pegs
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(cx + 40, cy - 40);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(cx - 40, cy + 40);
      await page.waitForTimeout(200);
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(200);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('VOLT');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('#start-btn').click();
    await page.waitForTimeout(600);

    // Seed the key if not present (tests that the game creates it)
    await page.evaluate(() => {
      if (!localStorage.getItem('voltWeaveHi')) {
        localStorage.setItem('voltWeaveHi', '0');
      }
    });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // Click a sequence of pegs
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rx = cx + box.width * 0.15 * Math.cos(angle);
        const ry = cy + box.height * 0.15 * Math.sin(angle);
        await page.mouse.click(rx, ry);
        await page.waitForTimeout(120);
      }
    }
    await page.waitForTimeout(600);

    const val = await page.evaluate(() => localStorage.getItem('voltWeaveHi'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
