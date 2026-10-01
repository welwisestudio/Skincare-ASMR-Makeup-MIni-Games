import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:454,height:886}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.passAds=7;a.ads.duration=100;});
// Menu and campaign entry must share the rewarded gate, even if stars/purchases are forged by old migrations.
await p.evaluate(async()=>{const a=window.__spa.app;a.save.purchased.push(42);a.save.stars[42]=3;await a.start(42);});assert.equal(await p.evaluate(()=>window.__spa.app.ui.mode),'premium-offer');
await p.click('#premium-watch');await p.evaluate(()=>window.__spa.app.ads.cancel());await p.waitForSelector('#premium-watch');assert.deepEqual(await p.evaluate(()=>window.__spa.app.save.premiumUnlocked),[]);
await p.click('#premium-watch');await p.waitForTimeout(140);await p.evaluate(()=>window.__spa.app.ads.complete());await p.waitForFunction(()=>window.__spa.app.ui.mode==='playing');assert.equal(await p.evaluate(()=>window.__spa.app.scene.levelIndex),42);
await p.reload();await p.waitForSelector('#start-button');assert.ok(await p.evaluate(()=>window.__spa.app.save.premiumUnlocked.includes(42)));
await p.evaluate(async()=>{const a=window.__spa.app;a.save.purchased.push(15);await a.start(15);a.completed(15,10);if(a.cardCelebration)a.finishCardCelebration();});await p.click('#next-button');assert.equal(await p.evaluate(()=>window.__spa.app.ui.mode),'premium-offer');assert.equal(await p.evaluate(()=>window.__spa.app.metaData.index),44);
await p.click('#premium-skip');assert.ok(await p.evaluate(()=>window.__spa.app.save.premiumSkipped.includes(44)));assert.equal(await p.evaluate(()=>window.__spa.app.scene.levelIndex),11);await p.reload();await p.waitForSelector('#start-button');assert.ok(await p.evaluate(()=>window.__spa.app.save.premiumSkipped.includes(44)));await p.evaluate(()=>window.__spa.app.offerPremium(44));assert.equal(await p.locator('#premium-watch').count(),0);await p.click('#premium-return');
assert.deepEqual(errors,[]);console.log('PASS: rewarded gate, cancel/complete, legacy bypass blocked, Next paywall, permanent skip and persistence');
}finally{await b.close();}
