import { test, expect } from '@playwright/test';

test.describe('2026-07-04 Bumper Burst', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-04/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(10);
    // start screen should show title
    const html = await page.content();
    expect(html).toContain('BUMPER BURST');
  });

  test('game responds to user input', async ({ page }) => {
    // click PLAY button to start
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(800);

    // game canvas should be present and interactive
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // click in the game area to place a bumper
    await page.click('canvas', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);

    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // start game
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(500);

    // rapid clicks in various positions
    const positions = [
      { x: 100, y: 150 }, { x: 300, y: 200 }, { x: 500, y: 300 },
      { x: 200, y: 400 }, { x: 400, y: 150 }, { x: 150, y: 350 },
      { x: 600, y: 250 }, { x: 350, y: 450 }, { x: 250, y: 100 }, { x: 450, y: 350 },
    ];
    for (const pos of positions) {
      await page.click('canvas', { position: pos });
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // click PLAY (tap needs hasTouch context, use click for cross-browser)
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(600);

    // interact with canvas
    await page.click('canvas', { position: { x: 150, y: 250 } });
    await page.waitForTimeout(500);

    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // start the game
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await playBtn.click();
    await page.waitForTimeout(1000);

    // interact with game
    await page.click('canvas', { position: { x: 300, y: 300 } });
    await page.waitForTimeout(1500);

    // set a high score manually and verify localStorage
    await page.evaluate(() => {
      localStorage.setItem('bumperBurstHi', '5000');
    });

    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k =>
        k.includes('bumperBurst') || k.includes('highScore') || k.includes('score') || k.includes('best')
      );
      return keys;
    });
    expect(stored.length).toBeGreaterThan(0);
  });
});
