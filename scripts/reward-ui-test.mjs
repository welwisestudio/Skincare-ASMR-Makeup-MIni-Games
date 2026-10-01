import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/reward-polish';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
try{
 await page.evaluate(()=>{const a=window.__spa.app;a.save.coins=725;a.displayCoins=725;a.observedCoins=725;a.save.passAds=6;a.save.cards=['fresh','berry','eyes','jade','glow'];a.save.items=['serum'];a.save.equipped='serum';});
 for(const [width,height] of [[390,844],[844,390],[320,480],[876,876]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(80);
  for(const mode of ['levels','wheel','pass','items','cards']){
   await page.evaluate(mode=>{const a=window.__spa.app;a.state='welcome';a.ui.show(mode);},mode);await page.waitForTimeout(650);
   await page.screenshot({path:`${out}/${width}-${mode}.png`});
   if(mode==='wheel'||mode==='pass')assert.ok(await page.evaluate(()=>window.__spa.app.ui.modalBackdrop?.postPipelines.length===1&&window.__spa.app.ui.scrim.commandBuffer.length>0));
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const a=window.__spa.app;a.cardScroll=0;a.ui.show('cards');});
 const start=await page.evaluate(()=>window.__spa.app.cardScroll);
 await page.click('#cards-down');await page.waitForTimeout(600);assert.ok(await page.evaluate(()=>window.__spa.app.cardScroll)>start);
 await page.locator('#cards-scroll').hover();await page.mouse.wheel(0,900);await page.waitForTimeout(500);
 assert.ok(await page.evaluate(()=>window.__spa.app.cardScroll)>400);
 await page.locator('#cards-scroll').focus();await page.keyboard.press('End');await page.waitForTimeout(600);
 assert.equal(await page.isDisabled('#cards-down'),true);await page.screenshot({path:`${out}/cards-last.png`});
 await page.click('#achievement-pouch');await page.waitForSelector('#card-back');await page.click('#card-back');
 assert.ok(await page.evaluate(()=>window.__spa.app.cardScroll)>1000);
 // Native touch scrolling, including beginning a swipe on a card button.
 await page.locator('#cards-scroll').focus();await page.keyboard.press('Home');await page.waitForTimeout(600);
 const box=await page.locator('#cards-scroll').boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+70,y:box.y+box.height-60,id:1}]});
 for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+70,y:box.y+box.height-60-i*21,id:1}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);
 assert.ok(await page.evaluate(()=>window.__spa.app.cardScroll)>50);assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'cards');
 // Actual grant: money is saved immediately; visible balance advances only on individual arrivals.
 await page.evaluate(()=>{const a=window.__spa.app;a.save.daily={claims:0,lastDay:''};a.ui.show('daily');window.coinHistory=[];const base=a.ui.updateCoinFX;a.ui.updateCoinFX=function(t,d){base.call(this,t,d);window.coinHistory.push({shown:a.displayCoins,queued:a.coinQueue,flying:this.coinFlights?.length||0});};a.claimDaily();});
 assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),825);assert.equal(await page.evaluate(()=>window.__spa.app.displayCoins),725);
 await page.waitForTimeout(800);await page.screenshot({path:`${out}/coin-flight.png`});
 const midway=await page.evaluate(()=>window.__spa.app.displayCoins);assert.ok(midway>725&&midway<825);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.click('#reward-continue');
 await page.waitForFunction(()=>window.__spa.app.displayCoins===825);
 assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),825);
 const history=await page.evaluate(()=>window.coinHistory);assert.ok(history.every((v,i)=>!i||v.shown>=history[i-1].shown));
 assert.equal(await page.evaluate(()=>window.__spa.app.coinQueue+window.__spa.app.ui.coinFlights.length),0);
 // First completion gets a card celebration, repeats do not.
 await page.evaluate(()=>{const a=window.__spa.app;a.save.stars[0]=0;a.save.cards=a.save.cards.filter(c=>c!=='fresh');a.scene.begin(0);a.scene.active=false;a.completed(0,32);});
 assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'card-earned');
 await page.waitForTimeout(800);await page.screenshot({path:`${out}/card-earned-landscape.png`});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:`${out}/card-earned-phone.png`});
 await page.click('#card-earned-continue');assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'result');
 await page.waitForTimeout(900);await page.screenshot({path:`${out}/result-coins.png`});
 await page.evaluate(()=>window.__spa.app.completed(0,20));assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'result');
 // Buying while coins are still flying settles the displayed wallet without minting extra currency.
 const spending=await page.evaluate(()=>{const a=window.__spa.app;a.save.coins+=50;a.persist();const before=a.save.coins;a.buyLevel(4);return{before,after:a.save.coins,shown:a.displayCoins,pending:a.coinQueue+a.ui.coinFlights.length};});
 assert.equal(spending.before-spending.after,300);assert.equal(spending.shown,spending.after);assert.equal(spending.pending,0);
 // A Spa Pass card earned by a hint ad is celebrated on the level and resumes that exact stage.
 await page.evaluate(()=>{const a=window.__spa.app;a.save.passAds=6;a.save.cards=a.save.cards.filter(c=>c!=='royal');a.metaStack=[];a.modalName=null;a.state='playing';a.unfreeze();a.scene.begin(0);a.ui.show('playing');});
 await page.click('#hint-button');await page.click('#help-watch');await page.waitForFunction(()=>document.getElementById('ad-complete')?.disabled===false);await page.click('#ad-complete');
 await page.waitForSelector('#card-earned-continue');assert.equal(await page.evaluate(()=>window.__spa.app.cardCelebration.card.id),'royal');
 const pausedTime=await page.evaluate(()=>window.__spa.app.scene.elapsed);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__spa.app.scene.elapsed),pausedTime);
 await page.click('#card-earned-continue');assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'playing');assert.equal(await page.evaluate(()=>window.__spa.app.scene.stepIndex),0);assert.equal(await page.evaluate(()=>window.__spa.app.scene.gestureHint.active),true);
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({backgrounds:true,scrollButtons:true,wheelScroll:true,touchScroll:true,keyboardScroll:true,scrollRestoration:true,coinHistory:history,coinResizeAndNavigation:true,newCardOnce:true,errors},null,2));
 console.log('Reward UI, scroll, coin flights, resize, card celebration: PASS');
}finally{await browser.close();}
