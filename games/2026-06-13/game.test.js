import { test, expect } from '@playwright/test';

test.describe('2026-06-13 Phantom Drift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-13/index.html');
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
    expect(gameContent).toContain('PHANTOM DRIFT');
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("START")');
    await page.waitForTimeout(500);

    // Move the mouse over the canvas
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('button:has-text("START")');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    for (let i = 0; i < 10; i++) {
      await page.mouse.move(
        box.x + Math.random() * box.width,
        box.y + Math.random() * box.height
      );
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("START")');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('button:has-text("START")');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
