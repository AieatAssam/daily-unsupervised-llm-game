import { test, expect } from '@playwright/test';

test.describe('2026-04-25 Neon Puck', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-25/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);

    const hasCanvas = await page.locator('canvas').count();
    const hasGameEl = await page.locator('[class*="game"], [id*="game"], [id="root"]').count();
    expect(hasCanvas + hasGameEl).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click to start game from menu
    await page.click('body');
    await page.waitForTimeout(500);

    // Move mouse to control paddle
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.8);
      await page.waitForTimeout(200);
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.8);
      await page.waitForTimeout(200);
    }

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start game
    await page.click('body');
    await page.waitForTimeout(300);

    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();

    // Rapid mouse movements and clicks
    for (let i = 0; i < 15; i++) {
      const x = box ? box.x + (i % 5) * (box.width / 5) : 100 + i * 15;
      const y = box ? box.y + box.height * 0.8 : 400;
      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
    }

    for (let i = 0; i < 8; i++) {
      await page.click('body');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Tap to start (use click which works on all contexts)
    await page.click('body');
    await page.waitForTimeout(500);

    // Move across screen to control paddle
    await page.mouse.move(100, 580);
    await page.waitForTimeout(200);
    await page.mouse.move(275, 580);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Click to start
    await page.click('body');
    await page.waitForTimeout(1200);

    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key =>
        key.toLowerCase().includes('score') ||
        key.toLowerCase().includes('high') ||
        key.toLowerCase().includes('best') ||
        key.toLowerCase().includes('record')
      );
    });

    // neonPuckHighScore is initialized on mount
    expect(storageKeys.length).toBeGreaterThan(0);

    // Confirm localStorage is accessible and writable
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('_neon_puck_test', '42');
        const v = localStorage.getItem('_neon_puck_test');
        localStorage.removeItem('_neon_puck_test');
        return v === '42';
      } catch(e) { return false; }
    });
    expect(canUseStorage).toBe(true);
  });
});
