import { test, expect } from '@playwright/test';

test.describe('2026-05-12 Neon Sweep', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-12/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(10);
    // Menu should be visible
    await expect(page.locator('text=NEON SWEEP')).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Click Play button to start
    await page.click('button');
    await page.waitForTimeout(800);
    // Board cells should appear
    const cells = page.locator('.cell-unrevealed');
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
    // Click a cell
    await cells.first().click();
    await page.waitForTimeout(400);
    // Some cells should be revealed now
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.click('button');
    await page.waitForTimeout(500);
    // Rapidly click cells
    const cells = page.locator('.cell-unrevealed');
    const count = await cells.count();
    for (let i = 0; i < Math.min(10, count); i++) {
      try {
        await cells.nth(i).click({ timeout: 200 });
        await page.waitForTimeout(40);
      } catch (e) { /* cell may have been revealed/removed */ }
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.click('button');
    await page.waitForTimeout(600);
    // Click a cell
    const cells = page.locator('.cell-unrevealed');
    const count = await cells.count();
    if (count > 0) await cells.first().click();
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start and click a few cells
    await page.click('button');
    await page.waitForTimeout(500);
    const cells = page.locator('.cell-unrevealed');
    const count = await cells.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      try {
        await cells.nth(i).click({ timeout: 200 });
        await page.waitForTimeout(60);
      } catch (e) {}
    }
    await page.waitForTimeout(600);
    // Check localStorage
    const keys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('score') || k.includes('Score') || k.includes('best') || k.includes('HS')
      )
    );
    expect(keys.length).toBeGreaterThan(0);
  });
});
