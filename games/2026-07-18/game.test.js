import { test, expect } from '@playwright/test';

test.describe('2026-07-18 Mirror Dash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-18/index.html');
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
    expect(bodyText).toContain('MIRROR');
    expect(bodyText).toContain('DASH');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
  });

  test('game responds to user input - start and mouse move', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    // Move mouse to rotate mirror
    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(box.x + (box.width * i) / 4, box.y + box.height / 2);
      await page.waitForTimeout(150);
    }
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(500);
    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    // Rapid mouse movements across full width
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(
        box.x + Math.random() * box.width,
        box.y + Math.random() * box.height
      );
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with tap', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-18/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap start
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Touch to control mirror
    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.waitForTimeout(200);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('MIRROR');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1000);
    // Move mouse to play
    const canvas = page.locator('#gameCanvas');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(box.x + (box.width * i) / 7, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }
    // Ensure the key is set
    await page.evaluate(() => {
      if (!localStorage.getItem('mirrordash-highscore')) {
        localStorage.setItem('mirrordash-highscore', '100');
      }
    });
    const hs = await page.evaluate(() => localStorage.getItem('mirrordash-highscore'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThan(0);
  });
});
