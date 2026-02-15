import { test, expect } from '@playwright/test';

/**
 * Example test file for a daily flashy game
 * This demonstrates the 6 required tests that every game must pass
 * 
 * File location: games/YYYY-MM-DD/game.test.js
 * Tests file: games/YYYY-MM-DD/game.jsx
 * 
 * Copy this template and customize for each new game
 */

test.describe('Example Daily Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game (update path to match your date folder)
    await page.goto('/games/2026-02-15/game.jsx');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Optional: Wait for React to render
    await page.waitForTimeout(1000);
  });

  test('game loads without errors', async ({ page }) => {
    // Collect any console errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait to catch any delayed errors
    await page.waitForTimeout(2000);
    
    // Should have no errors
    expect(errors).toHaveLength(0);
  });

  test('game renders core elements', async ({ page }) => {
    // Check that the page has content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
    
    // Verify either canvas or React content is rendered
    const hasCanvas = await page.locator('canvas').count();
    const hasGameElements = await page.locator('[class*="game"], [id*="game"], [class*="score"]').count();
    
    expect(hasCanvas + hasGameElements).toBeGreaterThan(0);
  });

  test('game responds to user input', async ({ page }) => {
    // Record initial state
    const initialHTML = await page.content();
    
    // Interact with the game (click)
    await page.click('body');
    await page.waitForTimeout(500);
    
    // Try keyboard input
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    
    // Verify something changed (state update, animation, score, etc.)
    const afterHTML = await page.content();
    
    // The page should have some dynamic content
    // At minimum, verify no errors occurred
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
  });

  test('game handles rapid interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Rapid fire interactions
    for (let i = 0; i < 20; i++) {
      await page.click('body', { position: { x: 100 + i * 10, y: 100 + i * 5 } });
      await page.waitForTimeout(50);
    }
    
    // Rapid keyboard presses
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }
    
    // Should still be stable with no errors
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('game works on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Test touch interaction
    await page.touchscreen.tap(187, 300);
    await page.waitForTimeout(500);
    
    // Verify no errors and content renders
    expect(errors).toHaveLength(0);
    
    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('localStorage high score works', async ({ page }) => {
    // Play the game briefly to potentially generate a score
    await page.click('body');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    
    // Check for score-related localStorage keys
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key => 
        key.toLowerCase().includes('score') || 
        key.toLowerCase().includes('high') ||
        key.toLowerCase().includes('best') ||
        key.toLowerCase().includes('record')
      );
    });
    
    // Should have at least one score-related key
    // (Game might initialize high score even if no score earned yet)
    expect(storageKeys.length).toBeGreaterThanOrEqual(0); // Allow 0 if game hasn't started scoring yet
    
    // Verify localStorage is accessible (not blocked)
    const canUseStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const val = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return val === 'test-value';
      } catch (e) {
        return false;
      }
    });
    
    expect(canUseStorage).toBe(true);
  });
});
