import { test, expect } from '@playwright/test';

/**
 * Tests for Cargo Pulse (2026-06-07)
 * Sokoban-style crate-push puzzle: navigate a grid, push the glowing crate
 * onto the pulsing pad before time runs out.
 */

test.describe('Cargo Pulse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-07/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    expect(bodyText).toContain('CARGO PULSE');

    const hasCanvas = await page.locator('canvas').count();
    const hasGameElements = await page.locator('[class*="game"], [id*="game"], [class*="score"]').count();

    expect(hasCanvas + hasGameElements).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start the game
    await page.click('text=START GAME');
    await page.waitForTimeout(800);

    // Drive the player around with arrow keys / WASD
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.click('text=START GAME');
    await page.waitForTimeout(500);

    // Rapid fire keyboard interactions across all four directions
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(40);
    }

    // Rapid clicks too, to stress the React render loop
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 100 + i * 10, y: 100 + i * 5 } });
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-06-07/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.tap('text=START GAME');
    await page.waitForTimeout(500);

    // Tap the on-screen D-pad controls
    const dpadButtons = page.locator('button');
    const count = await dpadButtons.count();
    if (count > 0) {
      await page.locator('button').first().tap().catch(() => {});
      await page.waitForTimeout(200);
      await page.locator('button').last().tap().catch(() => {});
    }
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);

    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('text=START GAME');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1000);

    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key =>
        key.toLowerCase().includes('score') ||
        key.toLowerCase().includes('high') ||
        key.toLowerCase().includes('best') ||
        key.toLowerCase().includes('record')
      );
    });

    expect(storageKeys.length).toBeGreaterThan(0);
    expect(storageKeys).toContain('cargoPulseHighScore');

    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const val = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return val === 'test-value';
      } catch (e) {
        return false;
      }
    });

    expect(canUseStorage).toBe(true);
  });
});
