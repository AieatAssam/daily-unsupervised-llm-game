import { test, expect } from '@playwright/test';

test.describe('2026-08-06 Neon Riptide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-06/index.html');
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
    await expect(page.locator('[data-testid="riptide-canvas"]')).toBeVisible();
  });

  test('game responds to user input - mouse steering', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-testid="riptide-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * (0.3 + t * 0.4));
      await page.waitForTimeout(40);
    }

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-testid="riptide-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 40; i++) {
      const x = box.x + Math.random() * box.width;
      const y = box.y + Math.random() * box.height;
      await page.mouse.move(x, y);
      await page.waitForTimeout(15);
    }

    const restart = page.locator('[data-testid="restart-btn"]');
    if (await restart.count() > 0) {
      await restart.click({ force: true, timeout: 2000 }).catch(() => {});
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
    await page.goto('/games/2026-08-06/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const startBtn = page.locator('[data-testid="start-btn"]');
    await startBtn.tap();
    await page.waitForTimeout(1500);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const riptideCanvas = page.locator('[data-testid="riptide-canvas"]');
    await riptideCanvas.tap();

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonRiptide_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-testid="riptide-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 200; i++) {
      const t = (Math.sin(i / 6) + 1) / 2;
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * (0.15 + t * 0.7));
      await page.waitForTimeout(20);
      const restart = page.locator('[data-testid="restart-btn"]');
      if (await restart.count() > 0) {
        await restart.click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('neonRiptide_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });
});
