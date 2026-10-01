import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {MENU_ASSETS,ALL_ASSETS} from '../src/asset-loading.js';
import {mkdir} from 'node:fs/promises';

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],missing=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(/Texture.*not found|texture.*missing/i.test(message.text()))missing.push(message.text());});
 page.on('request',request=>{if(request.url().endsWith('.webp'))requests.push(new URL(request.url()).pathname);});
 let fail=true;
 await page.route('**/assets/ui/spa-room.webp',async route=>{
  await new Promise(resolve=>setTimeout(resolve,200));
  if(fail)await route.abort();else await route.continue();
 });
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 const menuPaths=new Set(MENU_ASSETS.map(asset=>asset.url.slice(1)));
 assert.ok(requests.every(path=>menuPaths.has(path)||path==='/assets/ui/timer.webp'));
 assert.equal(await page.evaluate(()=>window.__spa.app.scene.textures.exists('ui-spa-room')),false);
 await page.evaluate(()=>{const a=window.__spa.app;for(let i=0;i<12;i++){a.albumPage=i;a.ui.render(false);}a.albumPage=0;a.ui.render(false);});
 for(const mode of ['rewards','cards','pass','coins','daily','wheel','modes','shop']){
  await page.evaluate(mode=>window.__spa.app.openMeta(mode),mode);
  await page.evaluate(()=>window.__spa.app.backMeta());
 }
 assert.equal(await page.locator('#content-loading').count(),0);
 await page.click('#start-button');await page.waitForSelector('#content-loading');
 assert.equal(await page.evaluate(()=>window.__spa.app.scene.active),false);
 await page.waitForSelector('#content-loading button:not([hidden])');
 assert.equal(await page.evaluate(()=>!!window.__spa.app.gameAssetsReady),false);
 await mkdir('test-results/asset-loading',{recursive:true});
 await page.screenshot({path:'test-results/asset-loading/retry.png'});
 fail=false;await page.click('#content-loading button');await page.waitForSelector('#pause-button');
 assert.equal(await page.locator('#content-loading').count(),0);
 assert.equal(await page.evaluate(()=>window.__spa.app.gameAssetsReady),true);
 const absent=await page.evaluate(keys=>keys.filter(key=>!window.__spa.app.scene.textures.exists(key)),ALL_ASSETS.map(asset=>asset.key));
 assert.deepEqual(absent,[]);
 const count=requests.length;
 await page.evaluate(async()=>{
  const a=window.__spa.app,{LEVELS}=await import('/src/levels.js');
  a.save.purchased=LEVELS.map((_,i)=>i);a.save.premiumUnlocked=LEVELS.map((_,i)=>i);a.save.premiumSkipped=[];
  for(let i=0;i<LEVELS.length;i++){await a.start(i);if(a.scene.levelIndex!==i)throw Error(`Level ${i} did not start`);}
  await a.openLevels();await a.start(0);
 });
 assert.equal(requests.length,count);assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(`PASS: ${MENU_ASSETS.length}/${ALL_ASSETS.length} menu assets, all menu pages/dialogs, loading overlay, network failure/retry, all textures ready, all 58 levels without more downloads`);
}finally{await browser.close();}
