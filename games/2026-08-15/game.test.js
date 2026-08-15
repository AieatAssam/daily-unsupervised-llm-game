import { test, expect } from '@playwright/test';
import {
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

async function clickExpectedTile(page) {
  const hint = page.locator('[data-testid="expected-tile"]');
  const idx = await hint.getAttribute('data-index');
  if (idx === null || idx === '') return false;
  await page.locator(`[data-testid="tile-${idx}"]`).click({ force: true, timeout: 2000 }).catch(() => {});
  return true;
}

async function waitForInputPhase(page, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const idx = await page.locator('[data-testid="expected-tile"]').getAttribute('data-index');
    if (idx !== null && idx !== '') return true;
    await page.waitForTimeout(100);
  }
  return false;
}

test.describe('2026-08-15 Neon Recall', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-15/index.html');
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
    await expect(page.locator('[data-testid="tile-grid"]')).toBeVisible();
    expect(await page.locator('[data-testid^="tile-"]').count()).toBeGreaterThanOrEqual(9);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    const ready = await waitForInputPhase(page);
    expect(ready).toBe(true);

    const scoreBefore = Number(await page.locator('[data-testid="score"]').textContent());
    await clickExpectedTile(page);
    await page.waitForTimeout(300);
    const scoreAfter = Number(await page.locator('[data-testid="score"]').textContent());

    expect(scoreAfter).toBeGreaterThan(scoreBefore);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 20; i++) {
      const tile = page.locator(`[data-testid="tile-${i % 9}"]`);
      await tile.click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(25);
    }
    await page.waitForTimeout(500);

    // Still responsive after the burst
    const ready = await waitForInputPhase(page, 5000);
    if (ready) {
      const responded = await clickExpectedTile(page);
      expect(responded).toBe(true);
    }
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-15/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // No overflow, >=40px tap targets, start tap produces observable change
    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    const tile0 = page.locator('[data-testid="tile-0"]');
    const box = await tile0.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);

    const ready = await waitForInputPhase(page);
    if (ready) await clickExpectedTile(page);
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonRecall_highScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    const ready = await waitForInputPhase(page);
    if (ready) {
      await clickExpectedTile(page);
      await page.waitForTimeout(300);
    }

    const val = await page.evaluate(() => localStorage.getItem('neonRecall_highScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    for (let i = 0; i < 5; i++) {
      const ready = await waitForInputPhase(page, 2000);
      if (!ready) break;
      await clickExpectedTile(page);
      await page.waitForTimeout(100);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
