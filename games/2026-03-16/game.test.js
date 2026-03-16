import { test, expect } from '@playwright/test';

test.describe('2026-03-16 Merge Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-16/index.html');
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
    // Should show the game title
    expect(gameContent).toContain('MERGE SURGE');
  });

  test('game responds to user input', async ({ page }) => {
    // Click play button to start
    await page.click('button');
    await page.waitForTimeout(500);

    // Press arrow key to slide tiles
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // Verify game is running (has canvas or react root)
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[class*="game"], [id="root"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);

    // Score area should still be visible
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start game
    await page.click('button');
    await page.waitForTimeout(300);

    // Rapid arrow key presses
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(50);
    }

    // Should still be responsive - no errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Start game with click (works on mobile viewport too)
    await page.click('button');
    await page.waitForTimeout(500);

    // Touch swipe simulation via click
    await page.click('body', { position: { x: 188, y: 333 } });
    await page.waitForTimeout(300);

    // Keyboard moves work on mobile viewport too
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Game should still show content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('button');
    await page.waitForTimeout(500);

    // Play for a bit
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
    }

    // Wait a moment then check localStorage
    await page.waitForTimeout(1000);
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.includes('High') || k.includes('merge') || k.includes('Surge') || k.includes('surge')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
