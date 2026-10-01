import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const out='test-results/engagement';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:454,height:886}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=fn=>page.evaluate(fn);
const begin=async(index,step=0)=>{await page.evaluate(async({index,step})=>{const a=window.__spa.app;a.save.purchased=Array.from({length:42},(_,i)=>i);a.audio.enabled=false;await a.start(index);if(step){a.scene.stepIndex=step;a.scene.nextStep();}},{index,step});};
const move=async p=>{const q=await page.evaluate(p=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+p.x*s.fit)/a.pixelRatio,y:(s.root.y+p.y*s.fit)/a.pixelRatio};},p);await page.mouse.move(q.x,q.y);};
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 // An album opened from an active game must remain the return destination.
 await begin(0);await page.click('#home-button');await page.click('#settings-button');assert.equal(await page.locator('#restart-button').count(),0);await page.click('#resume-button');assert.equal(await state(()=>window.__spa.app.ui.mode),'levels');
 await page.click('#settings-button');await page.click('#modal-close');assert.equal(await state(()=>window.__spa.app.ui.mode),'levels');
 await begin(0);await page.click('#pause-button');await page.click('#restart-button');assert.equal(await state(()=>window.__spa.app.scene.levelIndex),0);assert.equal(await state(()=>window.__spa.app.scene.stepIndex),0);
 // Play-time schedule, paused time, two free claims, then completed/cancelled ads.
 await state(()=>{const a=window.__spa.app;a.save.playGift={claims:0,seconds:0};for(let i=0;i<100;i++)a.tickPlayGift(100);});
 assert.ok(await state(()=>window.__spa.app.save.playGift.seconds>=9.99));
 await page.click('#pause-button');const paused=await state(()=>window.__spa.app.save.playGift.seconds);await state(()=>{for(let i=0;i<100;i++)window.__spa.app.tickPlayGift(100);});assert.equal(await state(()=>window.__spa.app.save.playGift.seconds),paused);await page.click('#resume-button');
 for(const [claim,limit,coins] of [[0,30,30],[1,60,50]]){
  await page.evaluate(limit=>{const a=window.__spa.app;a.save.playGift.seconds=limit-.1;a.claimPlayGift();},limit);assert.equal(await state(()=>window.__spa.app.save.playGift.claims),claim);
  await page.evaluate(limit=>{const a=window.__spa.app;a.save.playGift.seconds=limit;a.openMeta('play-gift');},limit);const before=await state(()=>window.__spa.app.save.coins);await page.click('#play-gift-claim');assert.equal(await state(()=>window.__spa.app.save.coins),before+coins);assert.equal(await state(()=>window.__spa.app.save.playGift.claims),claim+1);await state(()=>window.__spa.app.backMeta());
 }
 await state(()=>{const a=window.__spa.app;a.save.playGift.seconds=90;a.ads.duration=100;a.save.passAds=7;a.openMeta('play-gift');});assert.equal(await page.locator('#play-gift-claim').getAttribute('aria-label'),'WATCH & CLAIM');
 const before=await state(()=>window.__spa.app.save.coins);await page.click('#play-gift-claim');await state(()=>window.__spa.app.ads.cancel());await page.waitForFunction(()=>window.__spa.app.ui.mode==='play-gift');assert.equal(await state(()=>window.__spa.app.save.coins),before);assert.equal(await state(()=>window.__spa.app.save.playGift.claims),2);
 await page.click('#play-gift-claim');await page.waitForTimeout(140);await state(()=>window.__spa.app.ads.complete());await page.waitForFunction(()=>window.__spa.app.ui.mode==='reward');assert.equal(await state(()=>window.__spa.app.save.coins),before+125);assert.equal(await state(()=>window.__spa.app.save.playGift.claims),3);await state(()=>window.__spa.app.backMeta());
 // Each distinct completed run advances one step; duplicate completion is ignored.
 await state(()=>{const a=window.__spa.app;a.save.levelChest={steps:0,prizes:[]};a.save.cards=[];});
 for(let n=1;n<=5;n++){await begin(0);await state(()=>{const a=window.__spa.app;a.completed(0,10);a.completed(0,10);if(a.cardCelebration)a.finishCardCelebration();});assert.equal(await state(()=>window.__spa.app.save.levelChest.steps),n);}
 await page.waitForFunction(()=>window.__spa.app.ui.mode==='level-chest');const prizes=await state(()=>window.__spa.app.save.levelChest.prizes);assert.equal(new Set(prizes).size,3);
 await page.reload();await page.waitForSelector('#level-chest-open');assert.deepEqual(await state(()=>window.__spa.app.save.levelChest.prizes),prizes);
 await state(()=>{window.__spa.app.ads.duration=100;});await page.click('#level-chest-open');await state(()=>window.__spa.app.ads.cancel());await page.waitForSelector('#level-chest-open');assert.deepEqual(await state(()=>window.__spa.app.save.levelChest.prizes),prizes);
 await page.click('#gift-dismiss');assert.equal(await state(()=>window.__spa.app.save.levelChest.steps),0);assert.deepEqual(await state(()=>window.__spa.app.save.levelChest.prizes),[]);
 await state(()=>{const a=window.__spa.app;for(let i=0;i<5;i++)a.advanceChest();a.offerLevelChest();});await page.click('#level-chest-open');await page.waitForTimeout(140);await state(()=>window.__spa.app.ads.complete());await page.waitForFunction(()=>window.__spa.app.ui.mode==='chest-reveal');assert.equal(await state(()=>window.__spa.app.chestReveal.rewards.length),3);await page.waitForFunction(()=>window.__spa.app.chestReveal.ready);assert.equal(await state(()=>window.__spa.app.save.levelChest.steps),0);await state(()=>window.__spa.app.backMeta());
 // Pearls can be picked and placed in reverse order.
 await begin(13,1);const items=await state(()=>window.__spa.app.scene.workshop.debug().items);
 for(const i of [...items].reverse()){await move(i);await page.mouse.down();await move({x:i.tx,y:i.ty});await page.mouse.up();await page.waitForTimeout(80);}
 await page.waitForFunction(()=>window.__spa.app.scene.stepIndex===2);
 // Comparison slider still works and its larger action advances normally.
 await begin(33,4);await move({x:300,y:350});await page.mouse.down();await move({x:70,y:350});await move({x:532,y:350});await page.mouse.up();assert.ok(await state(()=>window.__spa.app.scene.romance.ready));
 await page.screenshot({path:`${out}/compare.png`});await move({x:300,y:600});await page.mouse.click(...Object.values(await page.evaluate(()=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+300*s.fit)/a.pixelRatio,y:(s.root.y+600*s.fit)/a.pixelRatio};})));await page.waitForFunction(()=>window.__spa.app.scene.stepIndex===5);
 assert.deepEqual(errors,[]);console.log('PASS: settings return/restart, active-time schedule, 2 free gifts, rewarded cancellation/completion, 5-run chest progression, reload persistence, permanent discard, 3 prizes, reverse-order pearls, comparison action');
}finally{await browser.close();}
