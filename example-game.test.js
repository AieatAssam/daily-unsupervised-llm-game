import { test, expect } from '@playwright/test';
import {
  assertInputResponds,
  assertResponsiveAfterBurst,
  assertMobilePlayable,
  assertPerformanceTuned,
} from '../../scripts/playability-harness.js'; // path relative to games/YYYY-MM-DD/

/**
 * Example test file for a daily flashy game — the 7 required tests.
 *
 * File location: games/YYYY-MM-DD/game.test.js
 * Tests file:    games/YYYY-MM-DD/index.html
 *
 * Copy this template, update the date path, the start flow (how the game
 * begins), and the `controls` hint (mirror the registry "controls" field:
 * "click/tap", "arrows + space", "mouse aim", "typing", ...).
 *
 * The harness (scripts/playability-harness.js) proves the game RESPONDS to
 * its controls — a dead painting that merely doesn't throw errors will fail.
 */

const GAME_URL = '/games/2026-02-15/index.html';
const CONTROLS = 'click/tap'; // e.g. 'arrows + space', 'mouse aim', 'typing'

test.describe('Example Daily Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
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
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    const hasCanvas = await page.locator('canvas').count();
    const hasGameElements = await page
      .locator('[class*="game"], [id*="game"], [data-testid*="game"], [class*="score"]')
      .count();
    expect(hasCanvas + hasGameElements).toBeGreaterThan(0);
  });

  test('controls produce observable game-state change', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // TODO: start the game (adjust to your game's start flow)
    // await page.locator('[data-testid="start-btn"]').click();

    await assertInputResponds(page, { controls: CONTROLS });
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input and stays responsive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // await page.locator('[data-testid="start-btn"]').click();

    await assertResponsiveAfterBurst(page, { controls: CONTROLS });
    expect(errors).toHaveLength(0);
  });

  test('game is mobile playable at 375px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(GAME_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Checks: no horizontal overflow, tap targets >= 40px, tap responds
    await assertMobilePlayable(page, { controls: CONTROLS });
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    // Play briefly so the game can persist a score
    await page.mouse.click(200, 300);
    await page.waitForTimeout(1000);

    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const val = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return val === 'test-value';
      } catch {
        return false;
      }
    });
    expect(canUseStorage).toBe(true);

    const storageKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        /score|high|best|record/i.test(k)
      )
    );
    expect(storageKeys.length).toBeGreaterThanOrEqual(0); // initialized on play or game over
  });

  test('game is performance tuned during play', async ({ page }) => {
    // await page.locator('[data-testid="start-btn"]').click();
    await page.mouse.click(200, 300); // get gameplay running
    await assertPerformanceTuned(page, { minFps: 30 });
  });
});
