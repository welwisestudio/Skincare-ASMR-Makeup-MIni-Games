import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:844,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const mode=()=>page.evaluate(()=>window.__spa.app.ui.mode);
try{
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.bonusUnlocked=['bubbles','stones'];});
for(const id of ['bubbles','stones']){
for(let repeat=0;repeat<3;repeat++){
await page.click('#collection-card');await page.click(`#mode-${id}`);await page.click('#mode-unlock');assert.equal(await mode(),'bonus');
await page.click('#meta-close');assert.equal(await mode(),'modes');await page.click('#meta-close');assert.equal(await mode(),'levels');assert.equal(await page.evaluate(()=>window.__spa.app.metaStack.length),0);
}
// Completing and replaying stays within one game entry in navigation history.
await page.click('#collection-card');await page.click(`#mode-${id}`);await page.click('#mode-unlock');
await page.evaluate(()=>window.__spa.app.finishBonus());await page.waitForFunction(()=>window.__spa.app.ui.mode==='reward');await page.click('#reward-continue');assert.equal(await mode(),'bonus');await page.click('#bonus-replay');await page.keyboard.press('Escape');assert.equal(await mode(),'modes');await page.keyboard.press('Escape');assert.equal(await mode(),'levels');
// Result -> offer -> game -> result.
await page.evaluate(async id=>{const a=window.__spa.app;await a.start(0);a.completed(0,10);if(a.cardCelebration)a.finishCardCelebration();a.offerMode(id);},id);await page.click('#mode-unlock');await page.click('#meta-close');assert.equal(await mode(),'result');await page.click('#result-menu');
}
// Repair a stale loop from the old navigation behavior.
await page.evaluate(()=>{const a=window.__spa.app;a.metaStack=[{mode:'levels',data:{}},{mode:'bonus',data:{id:'bubbles'}},{mode:'mode-offer',data:{id:'bubbles'}},{mode:'bonus',data:{id:'bubbles'}}];a.metaData={id:'bubbles'};a.modalName='mode-offer';a.ui.show('mode-offer');});await page.click('#meta-close');assert.equal(await mode(),'levels');assert.equal(await page.evaluate(()=>window.__spa.app.metaStack.length),0);
// Unlock advertisement cancellation and success preserve the caller.
await page.evaluate(()=>{const a=window.__spa.app;a.save.bonusUnlocked=[];a.ads.duration=60;});await page.click('#collection-card');await page.click('#mode-bubbles');await page.click('#mode-unlock');await page.click('#ad-cancel');await page.waitForSelector('#mode-unlock');await page.click('#meta-close');assert.equal(await mode(),'modes');
await page.click('#mode-bubbles');await page.click('#mode-unlock');await page.waitForTimeout(90);await page.evaluate(()=>window.__spa.app.ads.complete());await page.waitForFunction(()=>window.__spa.app.ui.mode==='bonus');await page.click('#meta-close');assert.equal(await mode(),'modes');await page.click('#meta-close');assert.equal(await mode(),'levels');
// A delayed completion cannot reopen a reward after leaving.
await page.evaluate(()=>{const a=window.__spa.app;a.playBonus('bubbles');a.finishBonus();a.backMeta();});await page.waitForTimeout(1300);assert.equal(await mode(),'levels');assert.deepEqual(errors,[]);
console.log('PASS: both games, repeated visits, completion/replay, Escape, result return, stale loop recovery, ad cancel/unlock and delayed reward after exit');
}finally{await browser.close();}
