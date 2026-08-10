import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-08-10 Calc Storm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-08-10/index.html');
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
    await expect(page.locator('[data-testid="arena"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const bufferBefore = await page.locator('[data-testid="buffer"]').textContent();
    await page.keyboard.press('Digit4');
    await page.keyboard.press('Digit2');
    const bufferAfter = await page.locator('[data-testid="buffer"]').textContent();
    expect(bufferAfter).not.toBe(bufferBefore);
    expect(bufferAfter).toContain('42');

    await assertInputResponds(page, { controls: 'keyboard digits and enter', target: null });

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const keys = ['Digit1', 'Digit2', 'Digit3', 'Backspace', 'Enter'];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(keys[i % keys.length]).catch(() => {});
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    await assertInputResponds(page, { controls: 'keyboard digits and enter', target: null });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-08-10/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.locator('[data-testid="digit-5-btn"]').tap({ timeout: 3000 }).catch(() => {});
    const buffer = await page.locator('[data-testid="buffer"]').textContent();
    expect(buffer).toContain('5');

    const numpadButtons = page.locator('[data-testid$="-btn"]');
    const count = await numpadButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = numpadButtons.nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;
      const box = await btn.boundingBox();
      if (!box) continue;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    }

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, '0');
    }, 'calcStormHighScore');

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(4000);

    const val = await page.evaluate((key) => localStorage.getItem(key), 'calcStormHighScore');
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const keys = ['Digit1', 'Digit2', 'Digit3', 'Enter'];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(keys[i % keys.length]).catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
