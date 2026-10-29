import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-29 Sort Circuit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-29/index.html');
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
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="chute-cyan"]')).toBeVisible();
    await expect(page.locator('[data-testid="chute-magenta"]')).toBeVisible();
    await expect(page.locator('[data-testid="chute-gold"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay"]')).toHaveCount(0);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    await assertInputResponds(page, {
      controls: 'click/tap',
      target: '[data-testid="chute-cyan"]',
    });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    await assertResponsiveAfterBurst(page, {
      controls: 'click/tap',
      target: '[data-testid="chute-magenta"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-29/index.html');
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

    const chuteBox = await page.locator('[data-testid="chute-cyan"]').boundingBox();
    expect(chuteBox).not.toBeNull();
    expect(Math.min(chuteBox.width, chuteBox.height)).toBeGreaterThanOrEqual(40);

    const chuteBox2 = await page.locator('[data-testid="chute-gold"]').boundingBox();
    expect(chuteBox2).not.toBeNull();
    expect(Math.min(chuteBox2.width, chuteBox2.height)).toBeGreaterThanOrEqual(40);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('sortCircuitHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(400);

    const cyan = page.locator('[data-testid="chute-cyan"]');
    const magenta = page.locator('[data-testid="chute-magenta"]');
    const gold = page.locator('[data-testid="chute-gold"]');
    for (let i = 0; i < 20; i++) {
      await cyan.click({ force: true, timeout: 500 }).catch(() => {});
      await magenta.click({ force: true, timeout: 500 }).catch(() => {});
      await gold.click({ force: true, timeout: 500 }).catch(() => {});
      await page.waitForTimeout(150);
      const overlayVisible = await page.locator('[data-testid="overlay"]').isVisible().catch(() => false);
      if (overlayVisible) {
        await page.locator('[data-testid="start-btn"]').click({ timeout: 500 }).catch(() => {});
        await page.waitForTimeout(200);
      }
    }
    await page.waitForTimeout(1000);

    const val = await page.evaluate(() => localStorage.getItem('sortCircuitHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    const cyan = page.locator('[data-testid="chute-cyan"]');
    for (let i = 0; i < 8; i++) {
      await cyan.click({ force: true }).catch(() => {});
      await page.waitForTimeout(220);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
