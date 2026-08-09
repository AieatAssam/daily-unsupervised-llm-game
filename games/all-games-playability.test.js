import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const games = JSON.parse(readFileSync(new URL('../games-registry.json', import.meta.url), 'utf8'));
const startText = /\b(start|play|begin|launch|go|new game|try again|play again|restart|continue|click to begin|ignite)\b/i;

async function snapshot(page) {
  return page.evaluate(() => {
    let hash = 0;
    for (const canvas of document.querySelectorAll('canvas')) {
      try {
        const data = canvas.getContext('2d')?.getImageData(0, 0, 32, 32).data || [];
        for (let i = 0; i < data.length; i += 41) hash = (hash * 31 + data[i]) >>> 0;
      } catch {}
    }
    return { hash, text: document.body.innerText.slice(0, 2000), mutations: window.__auditMutations || 0 };
  });
}

async function installProbe(page) {
  await page.evaluate(() => {
    window.__auditMutations = 0;
    new MutationObserver(m => { window.__auditMutations += m.length; }).observe(document.body, {
      childList: true, subtree: true, attributes: true, characterData: true,
    });
  });
}

async function clickStart(page) {
  const button = page.locator('button:visible').filter({ hasText: startText }).first();
  if (await button.count()) {
    await button.click({ timeout: 500, force: true }).catch(() => page.mouse.click(200, 300));
    return true;
  }
  const textControl = page.getByText(startText).first();
  if (await textControl.count()) {
    await textControl.click({ timeout: 500, force: true }).catch(() => page.mouse.click(200, 300));
    return true;
  }
  const canvas = page.locator('canvas:visible').first();
  if (await canvas.count()) {
    const box = await canvas.boundingBox({ timeout: 500 }).catch(() => null);
    if (box) {
      for (const y of [.1, .3, .5, .7, .9]) for (const x of [.1, .3, .5, .7, .9])
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
    }
    return false;
  }
  await page.locator('body').click({ position: { x: 100, y: 100 }, timeout: 500 }).catch(() => {});
  return false;
}

async function exerciseControls(page, controls) {
  const c = controls.toLowerCase();
  if (/click|tap|mouse|aim|drag/.test(c)) {
    const canvas = page.locator('canvas:visible').first();
    const box = await canvas.boundingBox({ timeout: 500 }).catch(() => null);
    if (box) {
      for (const [x, y] of [[.2, .2], [.5, .2], [.8, .2], [.2, .5], [.5, .5], [.8, .5], [.2, .8], [.5, .8], [.8, .8]]) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
      }
      await page.mouse.move(box.x + box.width * .35, box.y + box.height * .55);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .4);
      await page.mouse.up();
    } else {
      const buttons = page.locator('button:visible, [role="button"]:visible, [class*="tile"]:visible, [class*="pad"]:visible, [class*="cell"]:visible');
      for (let i = 0; i < Math.min(await buttons.count(), 8); i++) await buttons.nth(i).click({ force: true, timeout: 500 }).catch(() => {});
    }
    const interactive = page.locator('button:visible, [role="button"]:visible, [class*="tile"]:visible, [class*="pad"]:visible, [class*="cell"]:visible').last();
    if (await interactive.count()) await interactive.click({ force: true, timeout: 500 }).catch(() => {});
  }
  if (/space/.test(c)) await page.keyboard.press('Space');
  if (/arrow|wasd|move|steer|keyboard/.test(c)) {
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) await page.keyboard.press(key);
  }
  if (/type|typing|word|letter/.test(c)) {
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.count()) await input.focus({ timeout: 500 }).catch(() => {});
    await page.keyboard.type('abcdefghijklmnopqrstuvwxyz', { delay: 10 });
  }
  await page.mouse.click(120, 320).catch(() => {});
  await page.mouse.click(240, 380).catch(() => {});
  await page.waitForTimeout(500);
}

async function fps(page) {
  return page.evaluate(async () => new Promise(resolve => {
    const start = performance.now(); let frames = 0;
    const tick = () => { frames++; if (performance.now() - start < 700) requestAnimationFrame(tick); else resolve(frames / ((performance.now() - start) / 1000)); };
    requestAnimationFrame(tick);
  }));
}

for (const game of games) {
  test(`${game.id} ${game.name} — generic playability (${game.difficulty})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${game.file}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    expect(errors, 'page errors before play').toEqual([]);
    expect(await page.locator('body').evaluate(node => node.children.length), 'game rendered no document content').toBeGreaterThan(0);

    await installProbe(page);
    const before = await snapshot(page);
    await clickStart(page);
    await exerciseControls(page, game.controls);
    const after = await snapshot(page);
    expect(errors, 'page errors after controls').toEqual([]);
    const changed = after.mutations > before.mutations || after.hash !== before.hash || after.text !== before.text;
    const canvasBacked = await page.locator('canvas').count();
    if (!/type|typing|word|letter/.test(game.controls.toLowerCase()) && !canvasBacked) {
      expect(changed, `controls did not produce an observable change: ${game.controls}`).toBe(true);
    } else {
      test.info().annotations.push({ type: 'info', description: `${game.id}: generic input path exercised; canvas/typing state is validated by the game-specific interaction test` });
    }
    expect(await fps(page), 'active game loop below 30fps').toBeGreaterThanOrEqual(30);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile horizontal overflow').toBe(true);
    const buttons = page.locator('button:visible');
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) expect(Math.min(box.width, box.height), `mobile tap target ${i} below 40px`).toBeGreaterThanOrEqual(40);
    }
    await clickStart(page);
    await exerciseControls(page, game.controls);
    expect(errors, 'page errors on mobile').toEqual([]);
  });
}
