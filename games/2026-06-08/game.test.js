import { test, expect } from '@playwright/test';

test.describe('2026-06-08 Vector Slash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-08/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
    expect(gameContent).toContain('VECTOR SLASH');
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Start the game from the title screen
    await page.click('text=TAP TO START');
    await page.waitForTimeout(500);

    // Verify state changed - HUD with score should now be visible
    const gameContent = await page.textContent('body');
    expect(gameContent).toContain('SCORE');
    expect(gameContent).toContain('COMBO');

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // Perform a swipe gesture across the canvas
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('text=TAP TO START');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Rapid swipe gestures across the canvas
    for (let i = 0; i < 10; i++) {
      const sx = box.x + box.width * (0.2 + (i % 5) * 0.12);
      const sy = box.y + box.height * (0.3 + (i % 3) * 0.1);
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(sx + 60, sy + (i % 2 === 0 ? 60 : -60), { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(50);
    }

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-06-08/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('text=TAP TO START');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.4, box.y + box.height * 0.4);
    }

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('text=TAP TO START');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
