import { test, expect } from '@playwright/test';

test.describe('2026-04-29 Neon Boomerang', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-29/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const w = await canvas.evaluate(el => el.width);
    const h = await canvas.evaluate(el => el.height);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    // Root div must exist
    await expect(page.locator('#root')).toBeAttached();
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // First click starts the game
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Second click throws a boomerang toward upper area
    await page.click('canvas', { position: { x: 300, y: 200 } });
    await page.waitForTimeout(700);

    expect(errors).toHaveLength(0);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(300);

    // Rapid throws (only one boomerang at a time — extras are ignored gracefully)
    // Keep positions well within mobile viewport (375px) to avoid out-of-bounds clicks
    const positions = [
      { x: 120, y: 160 }, { x: 200, y: 200 }, { x: 150, y: 140 },
      { x: 250, y: 180 }, { x: 100, y: 220 }, { x: 300, y: 160 },
      { x: 170, y: 130 }, { x: 230, y: 240 },
    ];
    for (const pos of positions) {
      await page.click('canvas', { position: pos });
      await page.waitForTimeout(80);
    }

    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Click/tap to start
    await page.click('canvas');
    await page.waitForTimeout(400);

    // Click/tap to throw
    await page.click('canvas', { position: { x: 180, y: 200 } });
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Starting the game writes localStorage immediately
    await page.click('canvas');
    await page.waitForTimeout(600);

    // Throw boomerang toward targets (upper area) to try to score
    await page.click('canvas', { position: { x: 300, y: 180 } });
    await page.waitForTimeout(400);
    await page.click('canvas', { position: { x: 200, y: 150 } });
    await page.waitForTimeout(400);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('Boomerang')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
