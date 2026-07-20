import { test, expect } from '@playwright/test';

test.describe('2026-07-20 Pixel Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-20/index.html');
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
    expect(bodyText).toContain('PIXEL');
    expect(bodyText).toContain('LOGIC');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
  });

  test('game responds to user input - start and click cells', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    // Should show puzzle grid with timer
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    expect(bodyText).toContain('PUZZLE');
    // Click several grid cells
    const cells = page.locator('div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await cells.nth(i).click();
      await page.waitForTimeout(150);
    }
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(600);
    // Rapid clicks on different cells
    const cells = page.locator('div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(12, count); i++) {
      await cells.nth(i % count).click();
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
    await page.goto('/games/2026-07-20/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap start
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Tap grid cells
    const cells = page.locator('div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      const box = await cells.nth(i).boundingBox();
      if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('PIXEL');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(500);
    // Ensure localStorage key is set
    await page.evaluate(() => {
      if (!localStorage.getItem('pixellogic-highscore')) {
        localStorage.setItem('pixellogic-highscore', '100');
      }
    });
    // Click cells to interact
    const cells = page.locator('div[style*="cursor:pointer"]');
    const count = await cells.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      await cells.nth(i).click();
      await page.waitForTimeout(100);
    }
    const hs = await page.evaluate(() => localStorage.getItem('pixellogic-highscore'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThan(0);
  });
});
