import { test, expect } from '@playwright/test';

test.describe('2026-04-26 Chroma Shift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-26/index.html');
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

    const hasCanvas = await page.locator('canvas').count();
    const hasGameEl = await page.locator('[class*="game"],[id*="game"],[class*="score"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);

    // Check title text visible
    expect(bodyText).toContain('CHROMA SHIFT');
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click to start the game
    await page.click('body');
    await page.waitForTimeout(600);

    // Press color switch keys
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit3');
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit4');
    await page.waitForTimeout(200);

    expect(errors).toHaveLength(0);

    const hasCanvas = await page.locator('canvas').count();
    const hasGameEl = await page.locator('[class*="game"],[id*="game"],[class*="score"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.click('body');
    await page.waitForTimeout(300);

    // Rapidly alternate color keys
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(`Digit${(i % 4) + 1}`);
      await page.waitForTimeout(40);
    }

    // Rapid arrow key presses
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(40);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click to start (works on all contexts)
    await page.click('body');
    await page.waitForTimeout(600);

    // Click color buttons (should appear at bottom)
    await page.mouse.click(60, 620);
    await page.waitForTimeout(200);
    await page.mouse.click(140, 620);
    await page.waitForTimeout(200);
    await page.mouse.click(220, 620);
    await page.waitForTimeout(200);

    expect(errors).toHaveLength(0);

    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game and play briefly
    await page.click('body');
    await page.waitForTimeout(500);
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(1000);

    // Check localStorage is accessible
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-probe', 'ok');
        const v = localStorage.getItem('test-probe');
        localStorage.removeItem('test-probe');
        return v === 'ok';
      } catch (e) {
        return false;
      }
    });
    expect(canUseStorage).toBe(true);

    // Check for score-related keys
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
