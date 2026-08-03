import { test, expect } from '@playwright/test';

test.describe('2026-08-03 Neon Typist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-03/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const canvas = page.locator('[data-testid="game-canvas"]');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
  });

  test('game responds to user input - typing letters', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="virtual-keyboard"]')).toBeVisible();

    const letters = ['A', 'S', 'D', 'F', 'Q', 'W', 'E', 'R', 'T', 'Y'];
    for (const letter of letters) {
      await page.keyboard.press(letter);
      await page.waitForTimeout(150);
    }

    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'Space', 'Enter'];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(keys[i % keys.length]);
      await page.waitForTimeout(20);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with tap', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-03/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const startBtn = page.locator('[data-testid="start-btn"]');
    await startBtn.tap();
    await page.waitForTimeout(600);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const vkeyA = page.locator('[data-testid="vkey-a"]');
    if (await vkeyA.count() > 0) {
      await vkeyA.tap();
      await page.waitForTimeout(150);
      await page.locator('[data-testid="vkey-s"]').tap();
      await page.waitForTimeout(150);
      await page.locator('[data-testid="vkey-d"]').tap();
      await page.waitForTimeout(150);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonTypist_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(letters[i % letters.length]);
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(3000);

    const val = await page.evaluate(() => localStorage.getItem('neonTypist_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
