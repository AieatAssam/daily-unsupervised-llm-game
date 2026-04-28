import { test, expect } from '@playwright/test';

test.describe('2026-04-28 Wall Breach', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-28/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    // Start screen should show WALL BREACH title
    await expect(page.locator('text=WALL BREACH')).toBeVisible();
    await expect(page.locator('button', { hasText: 'PLAY' })).toBeVisible();
  });

  test('game responds to user input', async ({ page }) => {
    // Click the PLAY button to start
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(600);

    // Should have rendered player grid (canvas + react elements)
    const hasCanvas = await page.locator('canvas').count();
    const hasRoot = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);

    // HUD elements should be visible
    const body = await page.textContent('body');
    expect(body).toContain('LV');
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(400);

    // Rapidly click tiles in the player grid area (left side of screen)
    for (let i = 0; i < 10; i++) {
      await page.click('body', { position: { x: 60 + (i % 4) * 50, y: 200 + Math.floor(i / 4) * 50 } });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=WALL BREACH')).toBeVisible();

    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(600);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(500);

    // Click player grid cells to simulate play
    for (let i = 0; i < 5; i++) {
      await page.click('body', { position: { x: 50 + i * 45, y: 250 } });
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(1500);

    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('wallBreach') || k.includes('HS') || k.includes('score') || k.includes('high')
      )
    );

    expect(storage.length).toBeGreaterThan(0);
  });
});
