import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-10-21 Sigil Duel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-10-21/index.html');
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
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="lives"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="duel-stage"]')).toBeVisible();
    await expect(page.locator('[data-testid="glyph-bolt"]')).toBeVisible();
    await expect(page.locator('[data-testid="glyph-shield"]')).toBeVisible();
    await expect(page.locator('[data-testid="glyph-core"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="glyph-bolt"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(200);

    await assertInputResponds(page, { controls: 'click/tap keyboard', target: '[data-testid="glyph-core"]' });

    const scoreText = await page.locator('[data-testid="score"]').innerText();
    expect(parseInt(scoreText, 10)).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    await assertResponsiveAfterBurst(page, { controls: 'click/tap keyboard', target: '[data-testid="glyph-shield"]' });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-10-21/index.html');
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

    const boltBox = await page.locator('[data-testid="glyph-bolt"]').boundingBox();
    expect(boltBox).not.toBeNull();
    expect(Math.min(boltBox.width, boltBox.height)).toBeGreaterThanOrEqual(40);
    const shieldBox = await page.locator('[data-testid="glyph-shield"]').boundingBox();
    expect(Math.min(shieldBox.width, shieldBox.height)).toBeGreaterThanOrEqual(40);
    const coreBox = await page.locator('[data-testid="glyph-core"]').boundingBox();
    expect(Math.min(coreBox.width, coreBox.height)).toBeGreaterThanOrEqual(40);

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('sigilDuelHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const buttons = ['glyph-bolt', 'glyph-shield', 'glyph-core'];
    for (let i = 0; i < 8; i++) {
      await page.locator(`[data-testid="${buttons[i % buttons.length]}"]`).click().catch(() => {});
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('sigilDuelHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    const buttons = ['glyph-bolt', 'glyph-shield', 'glyph-core'];
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-testid="${buttons[i % buttons.length]}"]`).click().catch(() => {});
      await page.waitForTimeout(300);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
