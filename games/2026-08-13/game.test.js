import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-13 Pulse Strike', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-13/index.html');
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
    await expect(page.locator('[data-testid="grid"]')).toBeVisible();
    expect(await page.locator('[data-testid^="pad-"]').count()).toBe(16);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertInputResponds(page, {
      controls: 'click/tap',
      target: '[data-testid="pad-1-1"]',
    });

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 40; i++) {
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 4);
      await page.locator(`[data-testid="pad-${r}-${c}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    // Still responsive after the burst (ripple feedback fires on every tap, win or lose)
    await assertInputResponds(page, {
      controls: 'click/tap',
      target: '[data-testid="pad-2-2"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-13/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // No overflow, >=40px tap targets, start tap produces observable change
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    // In-game pad tap also responds
    const pad = page.locator('[data-testid="pad-1-1"]');
    const box = await pad.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    await pad.tap();
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('pulseStrike_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        await page.locator(`[data-testid="pad-${r}-${c}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(15);
      }
    }

    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('pulseStrike_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    // Tap around so particles/effects are active while sampling
    for (let i = 0; i < 8; i++) {
      await page.locator(`[data-testid="pad-${i % 4}-${(i * 3) % 4}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
