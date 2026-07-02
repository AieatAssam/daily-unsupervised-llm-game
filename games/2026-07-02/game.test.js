import { test, expect } from '@playwright/test';

test.describe('2026-07-02 Spin Spell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-02/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(10);
    // Should show SPIN SPELL title or game canvas
    const hasTitle = gameContent.includes('SPIN SPELL') || gameContent.includes('PLAY');
    expect(hasTitle).toBe(true);
  });

  test('game responds to user input', async ({ page }) => {
    // Click play button to start
    await page.click('body');
    await page.waitForTimeout(800);

    const hasCanvas = await page.locator('canvas').count();
    const hasButton = await page.locator('button').count();
    expect(hasCanvas + hasButton).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game by clicking play
    await page.click('body');
    await page.waitForTimeout(500);

    // Rapid clicks on game area
    for (let i = 0; i < 12; i++) {
      await page.click('body', { position: { x: 300, y: 300 } });
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.click('body');
    await page.waitForTimeout(600);

    const content = await page.textContent('body');
    expect(content.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start game
    await page.click('body');
    await page.waitForTimeout(500);

    // Interact with game
    for (let i = 0; i < 5; i++) {
      await page.click('body', { position: { x: 400, y: 300 } });
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(800);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('spinSpell')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
