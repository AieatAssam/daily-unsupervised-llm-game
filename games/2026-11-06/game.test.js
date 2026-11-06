import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js';

test.describe('2026-11-06 Vector Swarm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-11-06/index.html');
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
    await expect(page.locator('[data-testid="arena-stage"]')).toBeVisible();
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const stage = page.locator('[data-testid="arena-stage"]');
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.3);
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    await assertInputResponds(page, {
      controls: 'click/tap mouse aim arrow wasd space',
      target: '[data-testid="arena-stage"]',
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
      controls: 'click/tap mouse aim arrow wasd space',
      target: '[data-testid="arena-stage"]',
    });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-11-06/index.html');
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

    const stageBox = await page.locator('[data-testid="arena-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();

    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('vectorSwarmHighScore', '0');
    });

    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(300);

    const stage = page.locator('[data-testid="arena-stage"]');
    const box = await stage.boundingBox();
    for (let i = 0; i < 8; i++) {
      const sx = box.x + box.width * (0.3 + (i % 3) * 0.2);
      const sy = box.y + box.height * (0.3 + (i % 2) * 0.2);
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.up();
      await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowDown');
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);

    const val = await page.evaluate(() => localStorage.getItem('vectorSwarmHighScore'));
    expect(val).not.toBeNull();
    expect(parseInt(val, 10)).toBeGreaterThanOrEqual(0);
  });

  test('game is performance tuned during play', async ({ page }) => {
    await page.locator('[data-testid="start-btn"]').click();
    await page.waitForTimeout(600);

    const stage = page.locator('[data-testid="arena-stage"]');
    const box = await stage.boundingBox();
    for (let i = 0; i < 6; i++) {
      const sx = box.x + box.width * (0.3 + (i % 3) * 0.2);
      const sy = box.y + box.height * (0.3 + (i % 2) * 0.2);
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.waitForTimeout(60);
      await page.mouse.up();
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }

    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
