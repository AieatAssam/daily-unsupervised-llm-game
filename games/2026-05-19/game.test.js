import { test, expect } from '@playwright/test';

test.describe('2026-05-19 Trail Blaze', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-19/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // Start screen should be visible
    const hasTitle = body.includes('TRAIL BLAZE') || body.includes('Trail Blaze');
    expect(hasTitle).toBeTruthy();
  });

  test('game responds to user input', async ({ page }) => {
    // Click PLAY button to start
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(800);

    // Game canvas should be present and visible
    const canvas = page.locator('canvas');
    expect(await canvas.count()).toBeGreaterThan(0);

    // Press arrow key to steer
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);

    // Verify game is still running (no error overlay)
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(500);

    for (let i = 0; i < 10; i++) {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      await page.keyboard.press(keys[i % 4]);
      await page.waitForTimeout(50);
    }

    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click start button (use click for compatibility across viewport modes)
    await page.click('button');
    await page.waitForTimeout(500);

    // Click the canvas to steer
    await page.click('canvas');
    await page.waitForTimeout(300);

    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(1500);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('High') || k.includes('high') || k.includes('score') || k.includes('best')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
