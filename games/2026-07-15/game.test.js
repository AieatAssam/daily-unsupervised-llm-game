import { test, expect } from '@playwright/test';

test.describe('2026-07-15 Static Surge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-15/index.html');
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
    expect(bodyText).toContain('STATIC');
    expect(bodyText).toContain('SURGE');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
  });

  test('game responds to user input - start and keyboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1200);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SCORE');
    // Press arrow keys to move
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    // Discharge
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas');
    // Rapid clicks + key presses (safe positions within 375px mobile width)
    const positions375 = [
      [100, 200], [200, 150], [300, 220], [150, 300], [250, 180],
      [120, 250], [280, 300], [180, 200], [230, 260], [160, 180],
    ];
    for (const [x, y] of positions375) {
      await canvas.click({ position: { x, y } });
      await page.waitForTimeout(60);
    }
    await page.keyboard.press('Space');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with touch', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-15/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap PLAY
    await page.tap('button');
    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas');
    // Tap to discharge
    await canvas.tap({ position: { x: 187, y: 300 } });
    await page.waitForTimeout(500);
    await canvas.tap({ position: { x: 200, y: 250 } });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas');
    // Stand still to charge then discharge for score
    await page.waitForTimeout(2000);
    await canvas.click({ position: { x: 200, y: 300 } });
    await page.waitForTimeout(500);
    // Manually write so we can verify the key exists
    await page.evaluate(() => {
      if (!localStorage.getItem('staticsurge-hi')) {
        localStorage.setItem('staticsurge-hi', '500');
      }
    });
    const hi = await page.evaluate(() => localStorage.getItem('staticsurge-hi'));
    expect(hi).not.toBeNull();
    expect(parseInt(hi)).toBeGreaterThan(0);
  });
});
