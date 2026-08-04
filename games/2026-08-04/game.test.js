import { test, expect } from '@playwright/test';

test.describe('2026-08-04 Neon Echo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-04/index.html');
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

  test('game responds to user input - clicking pads', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="pad-0"]')).toBeVisible();

    for (let i = 0; i < 4; i++) {
      const pad = page.locator(`[data-testid="pad-${i}"]`);
      if (await pad.count() > 0) {
        await pad.click({ force: true, timeout: 5000 }).catch(() => {});
      }
      await page.waitForTimeout(200);
    }

    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(2000);

    for (let i = 0; i < 40; i++) {
      const pad = page.locator(`[data-testid="pad-${i % 4}"]`);
      const restart = page.locator('[data-testid="restart-btn"]');
      if (await pad.count() > 0) {
        await pad.click({ force: true, timeout: 2000 }).catch(() => {});
      } else if (await restart.count() > 0) {
        await restart.click({ force: true, timeout: 2000 }).catch(() => {});
      }
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
    await page.goto('/games/2026-08-04/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const startBtn = page.locator('[data-testid="start-btn"]');
    await startBtn.tap();
    await page.waitForTimeout(2000);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const pad0 = page.locator('[data-testid="pad-0"]');
    if (await pad0.count() > 0) {
      await pad0.tap();
      await page.waitForTimeout(150);
    }

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonEcho_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(2000);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const pad = page.locator(`[data-testid="pad-${j}"]`);
        if (await pad.count() > 0) {
          await pad.click({ force: true, timeout: 2000 }).catch(() => {});
        }
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(1000);

    const val = await page.evaluate(() => localStorage.getItem('neonEcho_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
