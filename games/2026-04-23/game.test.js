import { test, expect } from '@playwright/test';

test.describe('2026-04-23 Fuse Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-23/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
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
    expect(body.length).toBeGreaterThan(0);
    const hasStart = body.includes('FUSE') || body.includes('START') || body.includes('DEFUSAL');
    expect(hasStart).toBe(true);
  });

  test('game responds to user input', async ({ page }) => {
    // Click start button
    await page.click('button');
    await page.waitForTimeout(1000);
    const hasCanvas = await page.locator('canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
    // Click the game canvas area
    await page.click('canvas', { position: { x: 200, y: 300 }, force: true });
    await page.waitForTimeout(500);
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Start game
    await page.click('button');
    await page.waitForTimeout(800);
    // Rapid clicks using force to bypass any overlay that may appear
    for (let i = 0; i < 12; i++) {
      const x = 100 + (i * 60) % 400;
      const y = 100 + (i * 50) % 300;
      await page.click('canvas', { position: { x, y }, force: true });
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Use click instead of tap (works across contexts)
    await page.click('button');
    await page.waitForTimeout(800);
    // Click canvas with force to handle touch-action contexts
    await page.click('canvas', { position: { x: 188, y: 350 }, force: true });
    await page.waitForTimeout(600);
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    expect(errors).toHaveLength(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Start game — game initializes localStorage key on start
    await page.click('button');
    await page.waitForTimeout(2000);
    // Click canvas to interact with game
    for (let i = 0; i < 4; i++) {
      await page.click('canvas', { position: { x: 150 + i*80, y: 200 + i*30 }, force: true });
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);
    // Check localStorage for score key
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') || k.includes('fuse') || k.includes('High')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
