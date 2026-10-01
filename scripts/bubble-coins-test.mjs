import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
await mkdir('test-results/bubble-coins',{recursive:true});const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1245,height:880},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.bonusUnlocked=['bubbles'];a.playBonus('bubbles');});await page.waitForTimeout(600);
let baseline=await page.evaluate(()=>window.__spa.app.save.coins);
// Exercise both ends of the allowed random interval.
for(const [index,random,expected] of [[0,0,1],[1,4294967295,10]]){
await page.evaluate(value=>{window.originalRandom=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=array=>{array.fill(value);return array;};},random);
const button=page.locator(`#bubble-${index}`),bounds=await button.boundingBox(),click={x:bounds.x+20,y:bounds.y+25};await page.mouse.click(click.x,click.y);
await page.evaluate(()=>{crypto.getRandomValues=window.originalRandom;});
assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),baseline+expected);baseline+=expected;
await page.evaluate(index=>window.__spa.app.bonusAction(index),index);assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),baseline);
if(index===1){await page.waitForTimeout(170);const origins=await page.evaluate(()=>{const u=window.__spa.app.ui;return u.coinFlights.map(f=>({x:u.layout.x+f.from.x*u.layout.scale,y:u.layout.y+f.from.y*u.layout.scale}));});assert.ok(origins.some(p=>Math.abs(p.x-click.x)<1&&Math.abs(p.y-click.y)<1));await page.screenshot({path:'test-results/bubble-coins/trails.png'});}
}
await page.waitForTimeout(230);assert.ok(await page.evaluate(()=>window.__spa.app.ui.bubbleSprites.slice(0,2).every(p=>!p.visible)));
for(let i=2;i<18;i++){const before=await page.evaluate(()=>window.__spa.app.save.coins);await page.click(`#bubble-${i}`);const gained=await page.evaluate(()=>window.__spa.app.save.coins)-before-(i===17?25:0);assert.ok(gained>=1&&gained<=10);}
await page.waitForFunction(()=>window.__spa.app.ui.mode==='reward');await page.waitForFunction(()=>{const a=window.__spa.app;return a.displayCoins===a.save.coins&&a.coinQueue===0&&a.ui.coinFlights.length===0;});
const total=await page.evaluate(()=>window.__spa.app.save.coins);await page.evaluate(()=>window.__spa.app.bonusAction(17));assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),total);
await page.reload();await page.waitForSelector('#start-button');assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),total);
await page.setViewportSize({width:454,height:886});await page.evaluate(()=>window.__spa.app.playBonus('bubbles'));await page.locator('#bubble-0').tap();await page.waitForTimeout(150);await page.screenshot({path:'test-results/bubble-coins/portrait.png'});assert.equal(await page.evaluate(()=>window.__spa.app.bonus.popped.length),1);
assert.deepEqual(errors,[]);console.log('PASS: 1 and 10 coin bounds, per-click origin, rapid pops, duplicate guard, completion bonus, wallet arrivals, reload persistence and touch');
}finally{await browser.close();}
