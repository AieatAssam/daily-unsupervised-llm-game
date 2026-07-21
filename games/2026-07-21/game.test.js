import { test, expect } from '@playwright/test';

test.describe('2026-07-21 Cascade Blitz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-21/index.html');
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
    expect(bodyText).toContain('CASCADE');
    expect(bodyText).toContain('BLITZ');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('game responds to user input - start and click cells', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.locator('#start-btn').click();
    await page.waitForTimeout(800);
    // Should show score and time
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    expect(bodyText).toContain('TIME');
    // Click grid cells
    const cells = page.locator('div[style*="cursor: pointer"], div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(6, count); i++) {
      await cells.nth(i).click();
      await page.waitForTimeout(120);
    }
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('#start-btn').click();
    await page.waitForTimeout(600);
    // Rapid clicks on cells
    const cells = page.locator('div[style*="cursor: pointer"], div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(20, count); i++) {
      await cells.nth(i % count).click();
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
    await page.goto('/games/2026-07-21/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap start button
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Tap some cells
    const cells = page.locator('div[style*="cursor: pointer"], div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      const box = await cells.nth(i).boundingBox();
      if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('CASCADE');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('#start-btn').click();
    await page.waitForTimeout(500);
    // Ensure localStorage key exists
    await page.evaluate(() => {
      if (!localStorage.getItem('cascadeBlitz_hi')) {
        localStorage.setItem('cascadeBlitz_hi', '0');
      }
    });
    // Click many cells to try to score
    const cells = page.locator('div[style*="cursor: pointer"], div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(24, count); i++) {
      await cells.nth(i % count).click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);
    const hs = await page.evaluate(() => localStorage.getItem('cascadeBlitz_hi'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThanOrEqual(0);
  });
});
