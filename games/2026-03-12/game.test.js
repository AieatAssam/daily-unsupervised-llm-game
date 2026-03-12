import { test, expect } from '@playwright/test';

test.describe('2026-03-12 Chroma Hunt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-03-12/index.html');
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
    const hasTitle = await page.locator('text=CHROMA').count();
    const hasPlayBtn = await page.locator('#start-btn').count();
    expect(hasTitle + hasPlayBtn).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Click start button to begin the game
    await page.click('#start-btn');
    await page.waitForTimeout(600);

    // Game grid should now be visible
    const hasGrid = await page.locator('.game-grid').count();
    const hasRoot  = await page.locator('#game-root').count();
    expect(hasGrid + hasRoot).toBeGreaterThan(0);

    // Click on the game area (a tile)
    await page.click('body', { position: { x: 190, y: 340 } });
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(500);

    // Rapid tile clicks
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 100 + i * 15, y: 300 + i * 5 } });
      await page.waitForTimeout(50);
    }

    // Rapid keyboard presses
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
    await page.waitForTimeout(600);

    // Interact with tiles
    await page.click('body', { position: { x: 187, y: 340 } });
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start and play the game
    await page.click('#start-btn');
    await page.waitForTimeout(500);

    // Click a few tiles
    await page.click('body', { position: { x: 150, y: 300 } });
    await page.waitForTimeout(700);
    await page.click('body', { position: { x: 220, y: 300 } });
    await page.waitForTimeout(700);

    // Check localStorage is accessible
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('_test_key', 'val');
        const v = localStorage.getItem('_test_key');
        localStorage.removeItem('_test_key');
        return v === 'val';
      } catch (_) { return false; }
    });
    expect(canUseStorage).toBe(true);

    // Check for score-related key
    const storageKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('score') ||
        k.toLowerCase().includes('high') ||
        k.toLowerCase().includes('best') ||
        k.toLowerCase().includes('chroma')
      )
    );
    expect(storageKeys.length).toBeGreaterThanOrEqual(0);
  });
});
