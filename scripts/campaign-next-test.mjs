import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://www.youtube.com/game_api/v1',route=>route.fulfill({body:''}));
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(async()=>{
  const a=window.__spa.app,{LEVELS,LEVEL_ORDER}=await import('/src/levels.js');
  await a.ensureGameAssets();a.tickPlayGift=()=>{};
  for(const vipState of ['locked','open','skipped'])for(let n=0;n<LEVEL_ORDER.length-1;n++){
   const index=LEVEL_ORDER[n],following=LEVEL_ORDER[n+1];
   a.save.stars.fill(0);a.save.stars[index]=3;a.save.purchased=[index];
   a.save.levelChest={steps:0,prizes:[]};a.save.premiumSkipped=[];
   a.save.premiumUnlocked=LEVELS[index].premium?[index]:[];
   if(LEVELS[following].premium){
    if(vipState==='open')a.save.premiumUnlocked.push(following);
    if(vipState==='skipped')a.save.premiumSkipped.push(following);
   }
   await a.start(index);a.resultIndex=index;a.resultCoins=75;a.state='result';a.modalName='result';a.freeze();a.ui.show('result');
   document.getElementById('next-button').click();
   while(a.navigationBusy)await new Promise(resolve=>setTimeout(resolve,5));
   const destination=LEVEL_ORDER.slice(n+1).find(i=>!a.save.premiumSkipped.includes(i));
   const expected=LEVELS[destination].premium&&!a.save.premiumUnlocked.includes(destination)?'premium-offer':'playing';
   if(a.ui.mode!==expected)throw Error(`Next from ${n+1} (${vipState}): ${a.ui.mode}, expected ${expected}`);
   if(expected==='playing'){
    if(a.scene.levelIndex!==destination)throw Error(`Wrong destination from ${n+1}`);
   }
  }
  // A directly selected skipped VIP continues within the current transition.
  const slot=LEVEL_ORDER.findIndex(index=>LEVELS[index].premium),vip=LEVEL_ORDER[slot];
  a.save.stars[LEVEL_ORDER[slot-1]]=3;a.save.premiumSkipped=[vip];
  await a.start(vip,'campaign');
  if(a.ui.mode!=='playing'||a.scene.levelIndex!==LEVEL_ORDER[slot+1])throw Error('Skipped VIP transition deadlock');
  // Locked regular destinations must show their access screen instead of no-op.
  a.save.stars.fill(0);a.save.purchased=[];await a.start(LEVEL_ORDER[2],'campaign');
  if(a.ui.mode!=='purchase')throw Error('Locked level transition silently ignored');
 });
 assert.deepEqual(errors,[]);
 console.log('PASS: all 57 Next transitions with locked/open/skipped VIP, progression after VIP, skipped VIP reentry, locked-level offer');
}finally{await browser.close();}
