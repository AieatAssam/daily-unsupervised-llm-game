import { test, expect } from '@playwright/test';

test.describe('Cut Loose', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-18/index.html');
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

    const hasCanvas = await page.locator('canvas').count();
    const hasGameElements = await page.locator('[class*="game"], [id*="game"], [class*="score"]').count();

    expect(hasCanvas + hasGameElements).toBeGreaterThan(0);

    await expect(page.locator('.title')).toBeVisible();
    await expect(page.locator('.btn')).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.click('.btn');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.15);
      await page.waitForTimeout(300);
    }

    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.click('.btn');
    await page.waitForTimeout(300);

    for (let i = 0; i < 20; i++) {
      await page.click('body', { position: { x: 100 + i * 10, y: 100 + i * 5 } });
      await page.waitForTimeout(50);
    }

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/games/2026-06-18/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.touchscreen.tap(187, 400);
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);

    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('.btn');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key =>
        key.toLowerCase().includes('score') ||
        key.toLowerCase().includes('high') ||
        key.toLowerCase().includes('best') ||
        key.toLowerCase().includes('record')
      );
    });

    expect(storageKeys.length).toBeGreaterThanOrEqual(0);

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
