import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:8080/games/2026-04-03/index.html');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

const allKeys = await page.evaluate(() => Object.keys(localStorage));
console.log('All localStorage keys:', JSON.stringify(allKeys));
console.log('pegDropHighScore:', await page.evaluate(() => localStorage.getItem('pegDropHighScore')));

const hasReact = await page.evaluate(() => typeof window.React !== 'undefined');
console.log('React loaded:', hasReact);
const title = await page.textContent('body');
console.log('Body text snippet:', title.substring(0, 100));

await browser.close();
