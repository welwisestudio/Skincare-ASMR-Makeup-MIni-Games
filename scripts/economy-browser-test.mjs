import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
fs.mkdirSync('test-results/economy',{recursive:true});
const state=fn=>p.evaluate(fn);
try{
 await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
 await state(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.coins=1000;a.save.passAds=7;a.ads.duration=25;a.save.bonusUnlocked=['bubbles','stones'];a.persist();});
 await state(()=>window.__spa.app.openMeta('coins'));await p.waitForTimeout(350);await p.screenshot({path:'test-results/economy/coins-phone.png'});
 await p.click('#supply-hints');assert.equal(await state(()=>window.__spa.app.save.hints),3);assert.equal(await state(()=>window.__spa.app.save.coins),850);
 await state(()=>window.__spa.app.backMeta());await p.click('#supply-skips');assert.equal(await state(()=>window.__spa.app.save.skips),2);assert.equal(await state(()=>window.__spa.app.save.coins),600);
 await state(()=>window.__spa.app.backMeta());await p.click('#supply-box');assert.equal(await state(()=>window.__spa.app.save.boxes),2);assert.equal(await state(()=>window.__spa.app.save.coins),450);
 await state(()=>window.__spa.app.backMeta());await p.click('#coins-watch');await state(()=>window.__spa.app.ads.cancel());await p.waitForFunction(()=>!window.__spa.app.rewardBusy);assert.equal(await state(()=>window.__spa.app.save.coins),450);
 await p.click('#coins-watch');await p.waitForTimeout(40);await state(()=>window.__spa.app.ads.complete());await p.waitForFunction(()=>window.__spa.app.ui.mode==='reward');assert.equal(await state(()=>window.__spa.app.save.coins),550);
 // Previously issued receipts cannot award coins or advance the pass again.
 assert.ok(await state(async()=>{const a=window.__spa.app,show=a.ads.show.bind(a.ads),coins=a.save.coins,pass=a.save.passAds;a.ads.show=async()=>({status:'rewarded',receipt:a.save.adReceipts.at(-1)});await a.watchCoins();await new Promise(r=>setTimeout(r,50));a.ads.show=show;return a.save.coins===coins&&a.save.passAds===pass;}));
 await state(async()=>{const a=window.__spa.app;await a.start(0);a.save.skips=0;a.requestHelp('skip');});await p.screenshot({path:'test-results/economy/help-phone.png'});
 assert.match(await p.locator('#help-use').getAttribute('aria-label'),/150/);await p.click('#help-use');assert.equal(await state(()=>window.__spa.app.save.coins),400);await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===1);
 // Insufficient money and stale step references spend nothing.
 assert.ok(await state(()=>{const a=window.__spa.app;a.save.coins=0;a.save.hints=0;a.requestHelp('hint');a.useHelp(false,true);const rejected=a.save.coins===0;a.save.coins=400;a.metaData.step=-1;a.useHelp(false,true);return rejected&&a.save.coins===400;}));
 await state(()=>{const a=window.__spa.app;a.welcome();a.save.bonusEconomy={day:'',rounds:0};a.playBonus('bubbles');});
 for(let round=0;round<2;round++){
  const result=await state(()=>{const a=window.__spa.app,start=a.save.coins;for(let i=0;i<18;i++)a.bonusAction(i);const coins=a.bonus.coins,after=a.save.coins;a.bonusAction(0);return{coins,gain:after-start,noDuplicate:a.save.coins===after,earns:a.bonus.earnsCoins};});
  assert.ok(result.earns&&result.coins>=18&&result.coins<=180);assert.equal(result.gain,result.coins+10);assert.ok(result.noDuplicate);
  await p.waitForTimeout(1200);await state(()=>{const a=window.__spa.app;if(a.ui.mode==='reward')a.backMeta();});
  if(round===0)await p.click('#bonus-replay');
 }
 const before=await state(()=>window.__spa.app.save.coins);
 await p.click('#bonus-replay');assert.equal(await state(()=>window.__spa.app.bonus.earnsCoins),false);
 await state(()=>{for(let i=0;i<18;i++)window.__spa.app.bonusAction(i);});await p.waitForTimeout(1200);assert.equal(await state(()=>window.__spa.app.save.coins),before);
 await p.screenshot({path:'test-results/economy/bonus-practice-phone.png'});
 await p.click('#bonus-watch');await state(()=>window.__spa.app.ads.cancel());await p.waitForFunction(()=>!window.__spa.app.rewardBusy);assert.equal(await state(()=>window.__spa.app.save.coins),before);assert.equal(await state(()=>window.__spa.app.save.bonusEconomy.rounds),2);
 await p.click('#bonus-watch');await p.waitForTimeout(40);await state(()=>window.__spa.app.ads.complete());await p.waitForFunction(()=>window.__spa.app.bonus.adRound===true&&!window.__spa.app.bonus.finished);
 const extra=await state(()=>{const a=window.__spa.app,start=a.save.coins;for(let i=0;i<18;i++)a.bonusAction(i);return{gain:a.save.coins-start,pops:a.bonus.coins,quota:a.save.bonusEconomy.rounds};});assert.equal(extra.gain,extra.pops+10);assert.equal(extra.quota,2);
 await p.waitForTimeout(1200);await state(()=>{const a=window.__spa.app;if(a.ui.mode==='reward')a.backMeta();a.backMeta();a.offerMode('stones');});await p.screenshot({path:'test-results/economy/bonus-offer-phone.png'});
 await p.reload();await p.waitForSelector('#start-button');assert.equal(await state(()=>window.__spa.app.save.bonusEconomy.rounds),2);
 for(const [width,height] of [[320,568],[1703,820]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(200);
  for(const mode of ['coins','boxes','daily','pass']){await p.evaluate(mode=>{const a=window.__spa.app;a.welcome();a.openMeta(mode);},mode);await p.waitForTimeout(300);await p.screenshot({path:`test-results/economy/${mode}-${width}.png`});}
 }
 assert.deepEqual(errors,[]);console.log('PASS: supply purchases, coin help, insufficient/stale rejection, completed/cancelled/duplicate ads, daily coin rounds, practice, rewarded replay, save reload, responsive shops');
}finally{await b.close();}
