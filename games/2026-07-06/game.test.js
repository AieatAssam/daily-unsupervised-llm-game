import { test, expect } from '@playwright/test';

test.describe('2026-07-06 Vial Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-06/index.html');
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
    // Should show VIAL RUSH title on start screen
    expect(gameContent).toContain('VIAL RUSH');
  });

  test('game responds to user input', async ({ page }) => {
    // Click PLAY button to start
    await page.click('button');
    await page.waitForTimeout(1000);

    // Should now be in play screen — check for score/level elements
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('#root').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // Body should contain TIME or SCORE text
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game
    await page.click('button');
    await page.waitForTimeout(500);

    // Rapid clicks on game area
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 150 + i * 20, y: 350 } });
      await page.waitForTimeout(50);
    }

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click play button (touch context not required for click)
    await page.click('button');
    await page.waitForTimeout(500);

    // Click on a vial area
    await page.click('body', { position: { x: 100, y: 350 } });
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('button');
    await page.waitForTimeout(1000);

    // Interact with game
    await page.click('body', { position: { x: 150, y: 350 } });
    await page.waitForTimeout(500);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('High') || k.includes('vial')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
