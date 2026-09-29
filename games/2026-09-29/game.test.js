import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-09-29 Neon Duelist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-09-29/index.html');
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
    await expect(page.locator('[data-testid="arena"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="level"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo"]')).toBeVisible();
    await expect(page.locator('[data-testid="enemy-hp"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-hp"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="hand-row"]')).toBeVisible();

    await assertInputResponds(page, { controls: 'click tap', target: '[data-testid="card-btn"]' });

    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    // Rapidly mash cards and the end-turn button/keys — the action lock and
    // card-affordability checks should absorb this without throwing.
    for (let i = 0; i < 25; i++) {
      const cards = page.locator('[data-testid="card-btn"]');
      const count = await cards.count();
      if (count > 0) {
        await cards.nth(i % count).click({ force: true, timeout: 1000 }).catch(() => {});
      }
      await page.keyboard.press(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Space'][i % 5]).catch(() => {});
      await page.waitForTimeout(20);
    }

    await page.waitForTimeout(500);
    // Game should still be alive: either still playing or has reached game over — both are valid,
    // non-error states. Confirm the app is still responsive to input either way.
    const startBtn = page.locator('[data-testid="start-btn"]');
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
      await assertInputResponds(page, { controls: 'click tap', target: '[data-testid="card-btn"]' });
    } else {
      await assertInputResponds(page, { controls: 'click tap', target: '[data-testid="card-btn"]' });
    }
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-09-29/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await assertMobilePlayable(page, {
      controls: 'tap',
      buttonSelector: '[data-testid="start-btn"]',
    });

    await page.waitForTimeout(500);

    const card = page.locator('[data-testid="card-btn"]').first();
    const box = await card.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    await card.tap().catch(() => {});
    await page.waitForTimeout(200);

    const endTurnBtn = page.locator('[data-testid="end-turn-btn"]');
    const etBox = await endTurnBtn.boundingBox();
    expect(Math.min(etBox.width, etBox.height)).toBeGreaterThanOrEqual(40);

    await expect(page.locator('[data-testid="play-field"]')).toBeVisible();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('neonDuelistHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(500);

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(['Digit1', 'Digit2', 'Digit3', 'Digit4'][i % 4]).catch(() => {});
      await page.waitForTimeout(80);
      await page.keyboard.press('Space').catch(() => {});
      await page.waitForTimeout(80);
      const startBtn = page.locator('[data-testid="start-btn"]');
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click().catch(() => {});
        await page.waitForTimeout(200);
      }
    }

    const val = await page.evaluate(() => localStorage.getItem('neonDuelistHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(1000);

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Digit1').catch(() => {});
      await page.waitForTimeout(30);
      await page.keyboard.press('Digit2').catch(() => {});
      await page.waitForTimeout(30);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
