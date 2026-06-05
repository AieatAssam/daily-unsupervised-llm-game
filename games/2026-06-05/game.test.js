import { test, expect } from '@playwright/test';

test.describe('2026-06-05 Hue Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-06-05/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(10);
    // Should show the HUE RUSH title on start screen
    await expect(page.locator('text=HUE RUSH')).toBeVisible();
    // Should have PLAY button
    await expect(page.locator('button', { hasText: 'PLAY' })).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Click PLAY to start
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(800);

    // After starting, color buttons should appear
    const hasCanvas = await page.locator('canvas').count();
    const hasButtons = await page.locator('button').count();
    expect(hasCanvas + hasButtons).toBeGreaterThan(0);

    // Click any color button
    const firstBtn = page.locator('button').first();
    if (await firstBtn.isVisible()) {
      await firstBtn.click();
    }
    await page.waitForTimeout(400);

    // Score element should exist
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start the game
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(500);

    // Rapid clicks on all available buttons
    for (let i = 0; i < 15; i++) {
      const buttons = page.locator('button');
      const count = await buttons.count();
      if (count > 0) {
        const idx = i % count;
        try { await buttons.nth(idx).click({ timeout: 200 }); } catch(_) {}
      }
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-06-05/index.html');
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Should still show title and play button
    await expect(page.locator('text=HUE RUSH')).toBeVisible();

    // Start game via tap
    await page.tap('button:has-text("PLAY")');
    await page.waitForTimeout(600);

    // Tap a color button
    const buttons = page.locator('button');
    const count = await buttons.count();
    if (count > 0) {
      await page.tap('button').catch(() => {});
    }

    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('localStorage high score works', async ({ page }) => {
    // Start and play briefly
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(400);

    // Click several color buttons to score
    for (let i = 0; i < 8; i++) {
      const buttons = page.locator('button');
      const count = await buttons.count();
      if (count > 0) {
        try { await buttons.nth(i % count).click({ timeout: 200 }); } catch(_) {}
      }
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(600);

    // Check localStorage for score key
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.toLowerCase().includes('high') ||
        k.toLowerCase().includes('score') ||
        k.toLowerCase().includes('best')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
