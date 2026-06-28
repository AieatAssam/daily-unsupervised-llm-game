import { test, expect } from '@playwright/test';

test.describe('2026-06-28 Drone Protocol', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-28/index.html');
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
    expect(gameContent).toContain('DRONE PROTOCOL');

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(300);

    // Start overlay should be gone once playing begins
    await expect(page.locator('.overlay')).toHaveCount(0);

    // Queue a couple of moves and run the program
    await page.click('.dpad-btn.right');
    await page.click('.dpad-btn.down');
    await page.waitForTimeout(100);

    const queuedChips = await page.locator('.chip').count();
    expect(queuedChips).toBeGreaterThan(0);

    await page.click('.dpad-btn.run');
    await page.waitForTimeout(800);

    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    await page.click('text=START');
    await page.waitForTimeout(200);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    const dirs = ['.dpad-btn.up', '.dpad-btn.right', '.dpad-btn.down', '.dpad-btn.left'];
    for (let i = 0; i < 10; i++) {
      await page.click(dirs[i % dirs.length]);
      await page.waitForTimeout(50);
    }

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

    await page.goto('/games/2026-06-28/index.html');
    await page.waitForLoadState('networkidle');

    await page.tap('text=START');
    await page.waitForTimeout(300);
    await page.tap('.dpad-btn.right');
    await page.waitForTimeout(200);
    await page.tap('.dpad-btn.run');
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
