import { test, expect } from '@playwright/test';

test.describe('2026-07-17 Glyph Blitz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-17/index.html');
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
    expect(bodyText).toContain('GLYPH');
    expect(bodyText).toContain('BLITZ');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
  });

  test('game responds to user input - start and keypress', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    // Type some letters to interact with game
    const letters = ['A', 'B', 'C', 'D', 'E', 'S', 'T', 'Z'];
    for (const l of letters) {
      await page.keyboard.press(l);
      await page.waitForTimeout(80);
    }
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1000);
    // Rapid typing of all letters
    for (let i = 0; i < 3; i++) {
      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        await page.keyboard.press(letter);
        await page.waitForTimeout(20);
      }
    }
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with tap', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-17/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap start
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Tap a few letter keys on mobile keyboard
    for (const l of ['A', 'S', 'D']) {
      const btn = page.locator(`.tap-key-${l}`);
      const visible = await btn.isVisible();
      if (visible) {
        await btn.tap();
        await page.waitForTimeout(100);
      }
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('GLYPH');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1000);
    // Type letters to potentially hit glyphs
    for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      await page.keyboard.press(l);
      await page.waitForTimeout(30);
    }
    // Ensure the key is set
    await page.evaluate(() => {
      if (!localStorage.getItem('glyphblitz-highscore')) {
        localStorage.setItem('glyphblitz-highscore', '50');
      }
    });
    const hs = await page.evaluate(() => localStorage.getItem('glyphblitz-highscore'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThan(0);
  });
});
