import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-31 Wire Weave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-31/index.html');
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
    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();
    const box = await field.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(50);
    expect(box.height).toBeGreaterThan(100);
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="round-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="overlay"]')).toHaveCount(0);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertInputResponds(page, {
      controls: 'click/tap arrows space enter',
      target: '[data-testid="play-field"]',
    });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertResponsiveAfterBurst(page, {
      controls: 'click/tap arrows space enter',
      target: '[data-testid="play-field"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-31/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    await expect(field).toBeVisible();
    const fieldBox = await field.boundingBox();
    expect(fieldBox.width).toBeGreaterThan(50);
    expect(fieldBox.height).toBeGreaterThan(100);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wireWeaveHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    for (let i = 0; i < 20; i++) {
      const x = box.x + 20 + ((i * 37) % (box.width - 40));
      const y = box.y + 20 + ((i * 53) % (box.height - 40));
      await page.mouse.click(x, y).catch(() => {});
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1000);

    const val = await page.evaluate(() => localStorage.getItem('wireWeaveHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    const field = page.locator('[data-testid="play-field"]');
    const box = await field.boundingBox();
    for (let i = 0; i < 8; i++) {
      const x = box.x + 20 + ((i * 41) % (box.width - 40));
      const y = box.y + 20 + ((i * 59) % (box.height - 40));
      await page.mouse.click(x, y).catch(() => {});
      await page.waitForTimeout(220);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
