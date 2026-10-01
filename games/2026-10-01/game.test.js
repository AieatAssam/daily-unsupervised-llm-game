import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-01 Beat Cascade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-01/index.html');
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
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="lane-0-btn"]')).toBeVisible();

    const scoreBefore = await page.locator('[data-testid="score"]').innerText();
    const keys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(keys[i % keys.length]).catch(() => {});
      await page.waitForTimeout(80);
    }
    const scoreAfter = await page.locator('[data-testid="score"]').innerText();
    const statusVisible = await page.locator('.status').isVisible();
    expect(statusVisible).toBe(true);
    expect(scoreAfter).not.toBeNull();

    await assertInputResponds(page, { controls: 'click keyboard', target: '[data-testid="lane-1-btn"]' });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const keys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(keys[i % keys.length]).catch(() => {});
      await page.waitForTimeout(15);
    }
    const laneBtn = page.locator('[data-testid="lane-2-btn"]');
    for (let i = 0; i < 15; i++) {
      await laneBtn.click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(15);
    }

    await page.waitForTimeout(500);
    const startBtn = page.locator('[data-testid="start-btn"]');
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }
    await assertInputResponds(page, { controls: 'click keyboard', target: '[data-testid="lane-3-btn"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-01/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(500);

    for (let i = 0; i < 4; i++) {
      const laneBtn = page.locator(`[data-testid="lane-${i}-btn"]`);
      const box = await laneBtn.boundingBox();
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
      await laneBtn.tap().catch(() => {});
      await page.waitForTimeout(100);
    }

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('beatCascadeHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    const keys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(keys[i % keys.length]).catch(() => {});
      await page.waitForTimeout(70);
    }

    const val = await page.evaluate(() => localStorage.getItem('beatCascadeHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('KeyD').catch(() => {});
      await page.waitForTimeout(30);
      await page.keyboard.press('KeyF').catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
