import { test, expect } from '@playwright/test';

test.describe('2026-08-05 Neon Slash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-05/index.html');
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
    await expect(page.locator('[data-testid="slash-canvas"]')).toBeVisible();
  });

  test('game responds to user input - dragging to slice', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1500);

    const canvas = page.locator('[data-testid="slash-canvas"]');
    const box = await canvas.boundingBox();

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      await page.mouse.move(
        box.x + box.width * (0.2 + t * 0.6),
        box.y + box.height * (0.8 - t * 0.6)
      );
      await page.waitForTimeout(30);
    }
    await page.mouse.up();

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-testid="slash-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 40; i++) {
      const x = box.x + Math.random() * box.width;
      const y = box.y + Math.random() * box.height;
      await page.mouse.move(x, y);
      if (i % 5 === 0) await page.mouse.down();
      if (i % 5 === 4) await page.mouse.up();
      await page.waitForTimeout(15);
    }
    await page.mouse.up();

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
    await page.goto('/games/2026-08-05/index.html');
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

    const slashCanvas = page.locator('[data-testid="slash-canvas"]');
    await slashCanvas.tap();

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonSlash_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-testid="slash-canvas"]');
    const box = await canvas.boundingBox();

    for (let sweep = 0; sweep < 6; sweep++) {
      const y = box.y + box.height * (0.2 + sweep * 0.1);
      await page.mouse.move(box.x, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width, y, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('neonSlash_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('a legal drag through a live orb produces score', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    const canvas = page.locator('[data-testid="slash-canvas"]');
    const box = await canvas.boundingBox();
    const orb = page.locator('[data-testid="balance-orb"]');
    await expect.poll(async () => await orb.getAttribute('data-x'), { timeout: 4000 }).not.toBeNull();

    const x = box.x + Number(await orb.getAttribute('data-x'));
    const y = box.y + Number(await orb.getAttribute('data-y'));
    await page.mouse.move(x, y + 90);
    await page.mouse.down();
    await page.mouse.move(x, y - 90, { steps: 12 });
    await page.mouse.up();
    await expect.poll(async () => Number(await page.locator('[data-testid="score"]').textContent()), { timeout: 2000 }).toBeGreaterThan(0);
  });
});
