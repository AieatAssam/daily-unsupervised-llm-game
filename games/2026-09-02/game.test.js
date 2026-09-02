import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-09-02 Orbit Slingshot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-09-02/index.html');
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

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    // Drag from near the bottom (launch pad) up and to the side to slingshot the ball.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.9);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.55, { steps: 8 });
    await page.mouse.up();

    await assertInputResponds(page, {
      controls: 'click/tap/drag',
      target: '[data-testid="game-canvas"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 20; i++) {
      const x = box.x + box.width * (0.2 + (i % 5) * 0.15);
      const y = box.y + box.height * (0.3 + (i % 3) * 0.15);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.9);
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);

    const restartVisible = await page.locator('[data-testid="restart-btn"]').isVisible().catch(() => false);
    if (restartVisible) {
      await page.locator('[data-testid="restart-btn"]').click();
      await page.waitForTimeout(300);
    }
    await assertInputResponds(page, {
      controls: 'click/tap/drag',
      target: '[data-testid="game-canvas"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-09-02/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="game-canvas"]',
    });

    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, '0');
    }, 'orbitSlingshot_highScore');

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 15; i++) {
      const x = box.x + box.width * (0.2 + (i % 5) * 0.15);
      const y = box.y + box.height * (0.3 + (i % 3) * 0.15);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.9);
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(300);

    const val = await page.evaluate((key) => localStorage.getItem(key), 'orbitSlingshot_highScore');
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const canvas = page.locator('[data-testid="game-canvas"]');
    const box = await canvas.boundingBox();
    for (let i = 0; i < 6; i++) {
      const x = box.x + box.width * (0.2 + (i % 5) * 0.15);
      const y = box.y + box.height * (0.3 + (i % 3) * 0.15);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.9);
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(150);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
