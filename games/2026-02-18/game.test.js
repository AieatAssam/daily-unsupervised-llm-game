import { test, expect } from '@playwright/test';

test.describe('2026-02-18 Neon Slicer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-02-18/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Title and play button should be visible on menu
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
    // Check for the game title
    expect(gameContent).toContain('NEON SLICER');
    // Check for start button
    expect(gameContent).toContain('SLICE IT!');
  });

  test('game responds to user input', async ({ page }) => {
    // Click on game area to start via button
    await page.click('body');
    await page.waitForTimeout(500);

    // Verify game container or canvas is present
    const hasCanvas = await page.locator('canvas').count();
    const hasReactRoot = await page.locator('[id="game-container"], [id="root"]').count();
    expect(hasCanvas + hasReactRoot).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Click the start button to begin playing
    const startBtn = page.locator('button').filter({ hasText: 'SLICE IT!' });
    await startBtn.click();
    await page.waitForTimeout(500);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Perform rapid swipe gestures across the game
    const W = 800;
    const H = 600;
    for (let i = 0; i < 8; i++) {
      const y = H * 0.3 + (i % 3) * 80;
      await page.mouse.move(W * 0.1, y);
      await page.mouse.down();
      await page.mouse.move(W * 0.5, y + 30, { steps: 10 });
      await page.mouse.move(W * 0.9, y, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start the game via click (works for both desktop and mobile viewports)
    await page.click('button');
    await page.waitForTimeout(500);

    // Perform swipe gesture using mouse events
    await page.mouse.move(50, 300);
    await page.mouse.down();
    await page.mouse.move(320, 300, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start the game - this initializes the localStorage key
    const startBtn = page.locator('button').filter({ hasText: 'SLICE IT!' });
    await startBtn.click();
    await page.waitForTimeout(800);

    // Simulate slicing by dragging across the game area multiple times
    for (let i = 0; i < 5; i++) {
      const y = 200 + i * 60;
      await page.mouse.move(50, y);
      await page.mouse.down();
      await page.mouse.move(750, y, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(500);

    // Check localStorage for score-related keys
    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('neon')
      );
    });

    // Should have at least one score-related key
    expect(storage.length).toBeGreaterThan(0);
  });
});
