import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://www.youtube.com/game_api/v1',r=>r.fulfill({body:''}));
 await page.goto('http://localhost:5174');await page.waitForSelector('#start-button');
 await page.evaluate(async()=>{
  const a=window.__spa.app,{LEVELS,LEVEL_ORDER}=await import('/src/levels.js');
  const {campaignDestination}=await import('/src/premium-access.js');
  const last=LEVEL_ORDER.at(-1),missing=LEVEL_ORDER[0];
  a.save.stars.fill(3);a.save.stars[missing]=0;a.save.premiumSkipped=[];
  a.save.premiumUnlocked=LEVEL_ORDER.filter(i=>LEVELS[i].premium);
  if(campaignDestination(a.save,last)!==missing)throw Error('Last level must wrap to unfinished');
  a.save.stars[LEVEL_ORDER[10]]=0;
  if(campaignDestination(a.save,missing)!==LEVEL_ORDER[10])throw Error('Must skip completed levels');
  a.save.stars.fill(3);
  const samples=new Set(Array.from({length:200},()=>campaignDestination(a.save,last)));
  if(samples.size<2||samples.has(last))throw Error('Replays must be random and avoid immediate repeats');
  const vip=LEVEL_ORDER.find(i=>LEVELS[i].premium);
  a.save.premiumSkipped=[vip];a.save.premiumUnlocked=a.save.premiumUnlocked.filter(i=>i!==vip);a.save.stars[vip]=0;
  for(let i=0;i<200;i++)if(campaignDestination(a.save,last)===vip)throw Error('Skipped VIP returned');
  a.save.stars[missing]=0;a.resultIndex=last;a.resultCoins=0;a.state='result';a.modalName='result';
  a.ui.show('result');
  if(document.getElementById('next-button').textContent!=='NEXT')throw Error('Last result still has Finish');
  document.getElementById('next-button').click();
  while(a.navigationBusy)await new Promise(r=>setTimeout(r,5));
  if(a.ui.mode!=='playing'||a.scene.levelIndex!==missing)throw Error('Last result did not start unfinished level');
  a.welcome();a.save.coins=999999;a.displayCoins=999999;a.ui.render(false);
 });
 await mkdir('test-results/campaign-loop',{recursive:true});
 await page.waitForTimeout(800);
 await page.screenshot({path:'test-results/campaign-loop/menu-plus.png'});
 await page.click('#menu-wallet');
 assert.equal(await page.evaluate(()=>window.__spa.app.ui.mode),'coins');
 assert.deepEqual(errors,[]);
 console.log('PASS: unfinished wrap, completed-level skipping, random replays, skipped VIP exclusion, last-result Next and wallet shop');
}finally{await browser.close();}
