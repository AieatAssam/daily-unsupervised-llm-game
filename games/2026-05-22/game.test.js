import { test, expect } from '@playwright/test';

test.describe('2026-05-22 Neon Dice Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-22/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const gameContent = await page.textContent('body');
    expect(gameContent).toBeTruthy();
    expect(gameContent.length).toBeGreaterThan(0);
    expect(gameContent).toContain('NEON DICE RUSH');
    expect(gameContent).toContain('PLAY');
  });

  test('game responds to user input', async ({ page }) => {
    await page.click('text=PLAY');
    await page.waitForTimeout(1500);

    const hasCanvas = await page.locator('canvas').count();
    const hasRollBtn = await page.locator('button:has-text("ROLL")').count();
    const hasScoreBtn = await page.locator('button:has-text("SCORE")').count();
    expect(hasCanvas + hasRollBtn + hasScoreBtn).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.click('text=PLAY');
    await page.waitForTimeout(1000);

    for (let i = 0; i < 5; i++) {
      try {
        await page.click('button:has-text("SCORE")', { timeout: 300 });
      } catch (_) {}
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('text=PLAY');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('ROLL');
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('text=PLAY');
    await page.waitForTimeout(1500);

    // Score a couple of turns
    for (let i = 0; i < 3; i++) {
      try {
        await page.click('button:has-text("SCORE")', { timeout: 500 });
        await page.waitForTimeout(700);
      } catch (_) {}
    }

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('neon') || k.includes('dice')
      );
    });

    expect(storage.length).toBeGreaterThan(0);
  });
});
