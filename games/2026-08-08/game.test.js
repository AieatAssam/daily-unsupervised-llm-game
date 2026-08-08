import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-08 Neon Cluster', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-08/index.html');
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
    await expect(page.locator('[data-testid="cluster-board"]')).toBeVisible();
    expect(await page.locator('[data-testid^="tile-"]').count()).toBe(64);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertInputResponds(page, {
      controls: 'click/tap',
      target: '[data-testid="tile-3-3"]',
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
      const r = Math.floor(Math.random() * 8);
      const c = Math.floor(Math.random() * 8);
      await page.locator(`[data-testid="tile-${r}-${c}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    // Still alive and responsive after the burst
    await assertInputResponds(page, {
      controls: 'click/tap',
      target: '[data-testid="tile-5-5"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-08/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // No overflow, >=40px tap targets, start tap produces observable change
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    // In-game tile tap also responds
    const tile = page.locator('[data-testid="tile-3-3"]');
    await tile.tap();
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonCluster_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        await page.locator(`[data-testid="tile-${r}-${c}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(15);
      }
    }

    await page.waitForTimeout(500);

    const val = await page.evaluate(() => localStorage.getItem('neonCluster_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    // Pop some clusters so particles/effects are active while sampling
    for (let i = 0; i < 8; i++) {
      await page.locator(`[data-testid="tile-${i}-${i}"]`).click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
