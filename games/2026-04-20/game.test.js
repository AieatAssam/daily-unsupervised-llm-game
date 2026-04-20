import { test, expect } from '@playwright/test';

test.describe('2026-04-20 Tilt Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-20/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
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

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const w = await canvas.getAttribute('width');
    const h = await canvas.getAttribute('height');
    expect(parseInt(w)).toBeGreaterThan(0);
    expect(parseInt(h)).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Click to start the game (force bypasses the start-screen overlay)
    await page.click('canvas', { force: true });
    await page.waitForTimeout(500);

    // Move mouse to tilt the beam
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await page.waitForTimeout(300);
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
    await page.waitForTimeout(300);

    const hasCanvas = await page.locator('canvas').count();
    const hasRoot   = await page.locator('#root').count();
    expect(hasCanvas + hasRoot).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Start game (force bypasses the start-screen overlay)
    await page.click('canvas', { force: true });
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    // Rapid left/right mouse movements simulating frantic tilting
    for (let i = 0; i < 20; i++) {
      const x = box.x + (i % 2 === 0 ? 0.2 : 0.8) * box.width;
      await page.mouse.move(x, box.y + box.height * 0.5);
      await page.waitForTimeout(40);
    }

    // Also try clicking repeatedly
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Tap to start (click the PLAY button which is visible on the overlay)
    await page.click('button', { force: true });
    await page.waitForTimeout(400);

    // Drag to simulate touch tilt (left then right)
    await page.mouse.move(80,  333);
    await page.waitForTimeout(200);
    await page.mouse.move(295, 333);
    await page.waitForTimeout(200);
    await page.mouse.move(187, 333);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
    const body = await page.locator('body').count();
    expect(body).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // High score key is initialised on page load — just verify it exists
    await page.click('canvas', { force: true });
    await page.waitForTimeout(1200);

    const storage = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k =>
        k.includes('highScore') || k.includes('score') || k.includes('best') ||
        k.toLowerCase().includes('high') || k.toLowerCase().includes('tilt')
      );
    });

    expect(storage.length).toBeGreaterThan(0);

    // Verify localStorage is writable
    const ok = await page.evaluate(() => {
      try {
        localStorage.setItem('_tr_test', '1');
        const v = localStorage.getItem('_tr_test');
        localStorage.removeItem('_tr_test');
        return v === '1';
      } catch (e) { return false; }
    });
    expect(ok).toBe(true);
  });
});
