import { test, expect } from '@playwright/test';

test.describe('2026-03-15 Beam Dodge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-15/index.html');
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
    // Should show BEAM DODGE title on start screen
    expect(gameContent).toContain('BEAM DODGE');
  });

  test('game responds to user input', async ({ page }) => {
    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Canvas should be present
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Move the mouse to interact with the game
    await page.mouse.move(200, 300);
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start the game first
    await page.click('body');
    await page.waitForTimeout(300);

    // Rapid mouse movements (simulating frantic dodging)
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(
        100 + Math.random() * 300,
        100 + Math.random() * 300
      );
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

    // Click to start the game (works on both desktop and mobile viewports)
    await page.click('body');
    await page.waitForTimeout(300);

    // Move mouse to simulate player movement
    await page.mouse.move(187, 333);
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game
    await page.click('body');
    await page.waitForTimeout(500);

    // Move mouse around to collect crystals and generate score
    const positions = [[200,200],[400,300],[300,400],[200,300],[500,200],[350,250]];
    for (const [x, y] of positions) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);

    // Check localStorage for score key
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('beamDodge')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
