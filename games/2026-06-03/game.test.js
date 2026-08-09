import { test, expect } from '@playwright/test';

test.describe('2026-06-03 Sling Smash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-03/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
    // Canvas should be present
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(500);
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id*="game"], #root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/games/2026-06-03/index.html');
    await page.waitForLoadState('networkidle');
    await page.tap('body');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
    await ctx.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('body');
    await page.waitForTimeout(1000);
    const keys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('Best')
      )
    );
    expect(keys.length).toBeGreaterThan(0);
  });

  test('a legal starter trajectory can reach the first block row', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Logical coordinates: pull down-left from the pivot. This is inside the
    // advertised drag zone and intersects the level-one block row.
    const point = (x, y) => ({
      x: box.x + (x / 800) * box.width,
      y: box.y + (y / 500) * box.height,
    });
    const pivot = point(118, 388);
    const releases = [[28, 388], [46, 411], [47, 414], [48, 418], [53, 428], [58, 433]];
    for (const [x, y] of releases) {
      await page.mouse.move(pivot.x, pivot.y);
      await page.mouse.down();
      const release = point(x, y);
      await page.mouse.move(release.x, release.y);
      await page.mouse.up();
      await page.waitForTimeout(1800);
      if (await page.getByTestId('game-status').textContent() === 'TARGET HIT') break;
    }

    await expect(page.getByTestId('game-status'), 'no legal starter pull reached a target').toHaveText('TARGET HIT');
  });
});
