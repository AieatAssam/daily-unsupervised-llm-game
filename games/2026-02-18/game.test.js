import { test, expect } from '@playwright/test';
import { assertInputResponds, assertMobilePlayable, assertPerformanceTuned } from '../../scripts/playability-harness.js';
test.describe('2026-02-18 Neon Orbit',()=>{
 test.beforeEach(async({page})=>{await page.goto('/games/2026-02-18/index.html');await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(800)});
 test('game loads without page errors',async({page})=>{const e=[];page.on('pageerror',x=>e.push(x));await page.waitForTimeout(500);expect(e).toHaveLength(0)});
 test('game renders core elements',async({page})=>{await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();expect(await page.locator('body').textContent()).toContain('NEON ORBIT')});
 test('controls produce observable game-state change',async({page})=>{await page.locator('[data-testid="start-btn"]').click();await assertInputResponds(page,{controls:'click/tap',target:'canvas'})});
 test('game survives rapid input and stays responsive',async({page})=>{await page.locator('[data-testid="start-btn"]').click();for(let i=0;i<25;i++){await page.locator('canvas').click({position:{x:100+(i*17)%300,y:150+(i*23)%250}});await page.waitForTimeout(20)}await assertInputResponds(page,{controls:'click/tap',target:'canvas'});});
 test('game is mobile playable at 375px',async({browser})=>{const c=await browser.newContext({viewport:{width:375,height:667},hasTouch:true}),p=await c.newPage();await p.goto('/games/2026-02-18/index.html');await p.waitForLoadState('domcontentloaded');await p.locator('[data-testid="start-btn"]').tap();await assertMobilePlayable(p,{controls:'tap',buttonSelector:'[data-testid="start-btn"],canvas'});await c.close()});
 test('game writes score/high-score key to localStorage',async({page})=>{expect(await page.evaluate(()=>localStorage.getItem('neonOrbitHighScore'))).not.toBeNull()});
 test('game is performance tuned during play',async({page})=>{await page.locator('[data-testid="start-btn"]').click();await assertPerformanceTuned(page,{minFps:30})});
});
