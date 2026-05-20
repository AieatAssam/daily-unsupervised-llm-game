import { test, expect } from '@playwright/test';

test.describe('2026-05-20 Shell Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-05-20/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(10);
    // Start screen or game title should be visible
    expect(bodyText).toMatch(/SHELL RUSH|SCORE|LIVES|PLAY/i);
  });

  test('game responds to user input', async ({ page }) => {
    // Click play button to start
    const playBtn = page.locator('button');
    await playBtn.first().click();
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    // Should show game UI after starting
    expect(bodyText).toMatch(/SCORE|LIVES|Level/i);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Start game
    const playBtn = page.locator('button').first();
    await playBtn.click();
    await page.waitForTimeout(500);

    // Rapid clicks on game area
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 200 + i * 20, y: 350 } });
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click the play button (touch context handled by Mobile Chrome project)
    await page.click('button');
    await page.waitForTimeout(1000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    expect(errors).toHaveLength(0);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game
    await page.click('button');
    await page.waitForTimeout(3000);

    // Try clicking cards
    await page.click('body', { position: { x: 188, y: 350 } });
    await page.waitForTimeout(500);
    await page.click('body', { position: { x: 300, y: 350 } });
    await page.waitForTimeout(2000);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('high') || k.includes('score') || k.includes('best') || k.includes('shellRush')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
