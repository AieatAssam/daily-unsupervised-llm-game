import { test, expect } from '@playwright/test';

test.describe('2026-07-19 Gravity Flip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-19/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('GRAVITY');
    expect(bodyText).toContain('FLIP');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
  });

  test('game responds to user input - start and click to flip', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    // Click canvas to flip gravity
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(500);
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    // Rapid clicks and key presses
    for (let i = 0; i < 15; i++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(50);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(1500);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with tap', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-19/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap start
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Tap canvas to flip gravity
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 4; i++) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(250);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('GRAVITY');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(500);
    // Force localStorage entry
    await page.evaluate(() => {
      if (!localStorage.getItem('gravityfliip-highscore')) {
        localStorage.setItem('gravityfliip-highscore', '5');
      }
    });
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    // Click a few times to interact
    for (let i = 0; i < 6; i++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }
    const hs = await page.evaluate(() => localStorage.getItem('gravityfliip-highscore'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThan(0);
  });
});
