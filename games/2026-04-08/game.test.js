import { test, expect } from '@playwright/test';

test.describe('2026-04-08 Swarm Rush', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-04-08/index.html');
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
    const html = await page.content();
    expect(html).toContain('SWARM');
  });

  test('game responds to user input', async ({ page }) => {
    // Click the PLAY button to start the game
    await page.locator('button').first().click();
    await page.waitForTimeout(800);

    // Canvas should be present and properly sized
    const count = await page.locator('canvas').count();
    expect(count).toBeGreaterThan(0);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('game handles rapid interactions', async ({ page }) => {
    // Start the game via the play button
    await page.locator('button').first().click();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Rapid mouse moves across the canvas to guide the swarm
      for (let i = 0; i < 14; i++) {
        const x = box.x + box.width * (0.15 + (i % 7) * 0.11);
        const y = box.y + box.height * (0.3 + (i % 3) * 0.2);
        await page.mouse.move(x, y);
        await page.waitForTimeout(35);
      }
    }

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    // Tap the play button to start
    await page.locator('button').first().click();
    await page.waitForTimeout(600);

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Canvas should exist and be mobile-sized
    const canvas = page.locator('canvas');
    const count = await canvas.count();
    expect(count).toBeGreaterThan(0);

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeLessThanOrEqual(376);
  });

  test('localStorage high score works', async ({ page }) => {
    // High score key is initialised on component mount (before any gameplay)
    await page.waitForTimeout(500);

    // Start game via play button
    await page.locator('button').first().click();
    await page.waitForTimeout(600);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Move the swarm around to collect gems
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        await page.mouse.move(
          cx + Math.cos(angle) * box.width * 0.28,
          cy + Math.sin(angle) * box.height * 0.28
        );
        await page.waitForTimeout(120);
      }
    }

    // Verify swarmRushHighScore key exists (set on mount)
    const storage = await page.evaluate(() =>
      Object.keys(localStorage).filter(k =>
        k.includes('swarmRush') || k.includes('highScore') ||
        k.includes('score') || k.includes('best') ||
        k.includes('Hi') || k.includes('hi')
      )
    );
    expect(storage.length).toBeGreaterThan(0);
  });
});
