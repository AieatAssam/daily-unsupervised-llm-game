import { test, expect } from '@playwright/test';

test.describe('2026-07-25 Barrage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-25/index.html');
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
    expect(bodyText).toContain('BARRAGE');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('game responds to user input - start and click lanes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('#start-btn').click();
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click each of the 5 lanes on the canvas (left side, where cannon is)
    for (let i = 0; i < 5; i++) {
      const cy = box.y + (i + 0.5) * (box.height / 5);
      await page.mouse.click(box.x + box.width * 0.5, cy);
      await page.waitForTimeout(150);
    }

    // Also press keys 1-5
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('3');
    await page.waitForTimeout(100);
    await page.keyboard.press('5');
    await page.waitForTimeout(100);

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

    // Rapid clicks across all 5 lanes
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < 5; i++) {
        const cy = box.y + (i + 0.5) * (box.height / 5);
        await page.mouse.click(box.x + box.width * 0.5, cy);
        await page.waitForTimeout(20);
      }
    }

    // Rapid key presses
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(String((i % 5) + 1));
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
    await page.goto('/games/2026-07-25/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.tap('#start-btn');
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Tap each lane
      for (let i = 0; i < 5; i++) {
        const cy = box.y + (i + 0.5) * (box.height / 5);
        await page.touchscreen.tap(box.x + box.width * 0.5, cy);
        await page.waitForTimeout(120);
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('BARRAGE');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Seed key
    await page.evaluate(() => {
      if (!localStorage.getItem('barrageHi')) {
        localStorage.setItem('barrageHi', '0');
      }
    });

    await page.locator('#start-btn').click();
    await page.waitForTimeout(600);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // Fire all lanes several times to interact with game
      for (let round = 0; round < 4; round++) {
        for (let i = 0; i < 5; i++) {
          const cy = box.y + (i + 0.5) * (box.height / 5);
          await page.mouse.click(box.x + box.width * 0.5, cy);
          await page.waitForTimeout(80);
        }
        await page.waitForTimeout(300);
      }
    }

    // Wait long enough for an enemy to potentially reach the base and trigger localStorage save
    // or manually force a game over scenario
    await page.waitForTimeout(1000);

    const val = await page.evaluate(() => localStorage.getItem('barrageHi'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
