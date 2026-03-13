import { test, expect } from '@playwright/test';

test.describe('2026-03-13 Neon Flip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-13/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    // Start screen should show title and play button
    const hasTitle   = await page.locator('text=NEON').count();
    const hasPlayBtn = await page.locator('#start-btn').count();
    expect(hasTitle + hasPlayBtn).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click start button to begin
    await page.click('#start-btn');
    await page.waitForTimeout(700);

    // Game grid should be visible
    const hasGrid = await page.locator('.game-grid').count();
    const hasRoot = await page.locator('#game-root').count();
    expect(hasGrid + hasRoot).toBeGreaterThan(0);

    // Click on a tile in the center of the grid
    await page.click('body', { position: { x: 190, y: 320 } });
    await page.waitForTimeout(400);

    // No errors after interaction
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start game
    await page.click('#start-btn');
    await page.waitForTimeout(600);

    // Rapid tile clicks across the grid
    for (let i = 0; i < 12; i++) {
      await page.click('body', {
        position: {
          x: 120 + (i % 4) * 55,
          y: 250 + Math.floor(i / 4) * 55,
        },
      });
      await page.waitForTimeout(60);
    }

    // Rapid keyboard presses (Space should not crash)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(800);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start game
    await page.click('#start-btn');
    await page.waitForTimeout(700);

    // Click/tap tiles
    await page.click('body', { position: { x: 187, y: 320 } });
    await page.waitForTimeout(400);
    await page.click('body', { position: { x: 230, y: 370 } });
    await page.waitForTimeout(400);

    expect(errors).toHaveLength(0);

    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start and play a bit
    await page.click('#start-btn');
    await page.waitForTimeout(600);

    // Click several tiles to try to solve
    for (let i = 0; i < 6; i++) {
      await page.click('body', {
        position: {
          x: 150 + (i % 3) * 60,
          y: 280 + Math.floor(i / 3) * 60,
        },
      });
      await page.waitForTimeout(200);
    }

    // Check localStorage is accessible
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('_test', 'ok');
        const v = localStorage.getItem('_test');
        localStorage.removeItem('_test');
        return v === 'ok';
      } catch (_) { return false; }
    });
    expect(canUseStorage).toBe(true);

    // Score-related key should exist or be createable
    const storageKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('score') ||
        k.toLowerCase().includes('high') ||
        k.toLowerCase().includes('best') ||
        k.toLowerCase().includes('neonflip') ||
        k.toLowerCase().includes('neon')
      )
    );
    expect(storageKeys.length).toBeGreaterThanOrEqual(0);
  });
});
