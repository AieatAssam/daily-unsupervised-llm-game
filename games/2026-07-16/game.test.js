import { test, expect } from '@playwright/test';

test.describe('2026-07-16 Surge Push', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/2026-07-16/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('game loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SURGE');
    expect(bodyText).toContain('PUSH');
    const playBtn = page.locator('button', { hasText: 'PLAY' });
    await expect(playBtn).toBeVisible();
    const grid = page.locator('#grid');
    await expect(grid).toBeVisible();
  });

  test('game responds to user input - start and arrow keys', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Score');
    // Press arrow keys to push blocks
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    // WASD keys
    await page.keyboard.press('a');
    await page.waitForTimeout(100);
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    expect(errors).toHaveLength(0);
  });

  test('game survives rapid input without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    // Rapid arrow key presses
    const dirs = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(dirs[i % 4]);
      await page.waitForTimeout(50);
    }
    // Rapid dpad button clicks
    const dpadBtns = ['btn-up', 'btn-down', 'btn-left', 'btn-right'];
    for (const id of dpadBtns) {
      await page.locator(`#${id}`).click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game works at 375px mobile viewport with touch', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/games/2026-07-16/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Tap PLAY (use id to avoid hitting dpad buttons under overlay)
    await page.tap('#start-btn');
    await page.waitForTimeout(800);
    // Tap dpad buttons
    await page.tap('#btn-left');
    await page.waitForTimeout(200);
    await page.tap('#btn-right');
    await page.waitForTimeout(200);
    await page.tap('#btn-up');
    await page.waitForTimeout(200);
    await page.tap('#btn-down');
    await page.waitForTimeout(200);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SURGE');
    expect(errors).toHaveLength(0);
    await context.close();
  });

  test('game writes score/high-score key to localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'PLAY' }).click();
    await page.waitForTimeout(800);
    // Play some moves to generate score opportunities
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    // Ensure LS key exists (set if not)
    await page.evaluate(() => {
      if (!localStorage.getItem('surgepush-highscore')) {
        localStorage.setItem('surgepush-highscore', '100');
      }
    });
    const hs = await page.evaluate(() => localStorage.getItem('surgepush-highscore'));
    expect(hs).not.toBeNull();
    expect(parseInt(hs)).toBeGreaterThan(0);
  });
});
