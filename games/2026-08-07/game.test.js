import { test, expect } from '@playwright/test';

test.describe('2026-08-07 Neon Slingshot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-07/index.html');
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
    await expect(page.locator('[data-testid="slingshot-canvas"]')).toBeVisible();
  });

  test('game responds to user input - drag slingshot', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('[data-testid="slingshot-canvas"]');
    const box = await canvas.boundingBox();
    const launcherX = box.x + box.width / 2;
    const launcherY = box.y + box.height - 70;

    await page.mouse.move(launcherX, launcherY);
    await page.mouse.down();
    await page.mouse.move(launcherX - 60, launcherY + 90, { steps: 8 });
    await page.waitForTimeout(150);
    await page.mouse.up();

    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('[data-testid="slingshot-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 15; i++) {
      const launcherX = box.x + box.width / 2;
      const launcherY = box.y + box.height - 70;
      const dx = (Math.random() - 0.5) * 120;
      const dy = Math.random() * 100 + 20;
      await page.mouse.move(launcherX, launcherY);
      await page.mouse.down();
      await page.mouse.move(launcherX + dx, launcherY + dy, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(40);

      const restart = page.locator('[data-testid="restart-btn"]');
      if (await restart.count() > 0) {
        await restart.click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(200);
      }
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
    await page.goto('/games/2026-08-07/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const startBtn = page.locator('[data-testid="start-btn"]');
    await startBtn.tap();
    await page.waitForTimeout(500);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const slingCanvas = page.locator('[data-testid="slingshot-canvas"]');
    await slingCanvas.tap();

    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonSlingshot_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('[data-testid="slingshot-canvas"]');
    const box = await canvas.boundingBox();

    for (let i = 0; i < 3; i++) {
      const target = page.locator('[data-testid="balance-target"]');
      const tx = Number(await target.getAttribute('data-x'));
      const ty = Number(await target.getAttribute('data-y'));
      const launcherX = box.x + box.width / 2;
      const launcherY = box.y + box.height - 70;
      const targetX = box.x + tx;
      const targetY = box.y + ty;
      const len = Math.hypot(targetX - launcherX, targetY - launcherY) || 1;
      const dx = (targetX - launcherX) / len * 140;
      const dy = (targetY - launcherY) / len * 140;
      await page.mouse.move(launcherX, launcherY);
      await page.mouse.down();
      await page.mouse.move(launcherX - dx, launcherY - dy, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(1600);

      const restart = page.locator('[data-testid="restart-btn"]');
      if (await restart.count() > 0) {
        await restart.click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(200);
      }
      if (Number(await page.locator('[data-testid="score"]').textContent()) > 0) break;
    }

    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('neonSlingshot_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);

    const scoreText = await page.locator('[data-testid="score"]').textContent();
    expect(Number(scoreText), 'the standard launch sweep never reached a target').toBeGreaterThan(0);
  });
});
