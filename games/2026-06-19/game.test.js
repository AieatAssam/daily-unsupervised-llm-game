import { test, expect } from '@playwright/test';

test.describe('2026-06-19 Vial Sort', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-19/index.html');
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
    expect(gameContent).toContain('VIAL SORT');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(300);

    // Start screen should be gone once playing begins
    await expect(page.locator('.title')).toHaveCount(0);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Tap two different vial positions to select then pour
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.45);
    await page.waitForTimeout(150);
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.45);
    await page.waitForTimeout(300);

    const scoreText = await page.locator('.hud-value').first().textContent();
    expect(scoreText).toBeTruthy();

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(200);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 10; i++) {
      const fx = box.x + box.width * (0.15 + (i % 5) * 0.15);
      const fy = box.y + box.height * 0.45;
      await page.mouse.click(fx, fy);
      await page.waitForTimeout(50);
    }

    await page.keyboard.press('KeyU');
    await page.keyboard.press('KeyR');

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.goto('/games/2026-06-19/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('text=START');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.2, box.y + box.height * 0.45);
    await page.waitForTimeout(200);
    await page.touchscreen.tap(box.x + box.width * 0.4, box.y + box.height * 0.45);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(1000);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => {
        const lower = k.toLowerCase();
        return lower.includes('highscore') || lower.includes('score') || lower.includes('best');
      });
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
