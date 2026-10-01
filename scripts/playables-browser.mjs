import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSave} from '../src/save.js';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const seed=freshSave();seed.coins=700;seed.passAds=7;seed.sound=true;seed.bonusUnlocked=['bubbles','stones'];
let cloud=JSON.stringify(seed),failLoad=false;
await page.exposeFunction('__cloudRead',()=>{if(failLoad)throw Error('load failed');return cloud;});
await page.exposeFunction('__cloudWrite',data=>{cloud=data;});
await page.addInitScript(()=>{
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Forbidden local persistence: '+key);}});
});
await page.route('https://www.youtube.com/game_api/v1',route=>route.fulfill({contentType:'application/javascript',body:`
 window.sdkTest={events:[],interstitials:0,rewards:[],scores:[],writes:0,failSave:false,reward:true,adFail:false,paused:false};
 window.ytgame={IN_PLAYABLES_ENV:true,game:{
 firstFrameReady(){sdkTest.events.push('first');},gameReady(){sdkTest.events.push('ready');},
 async loadData(){sdkTest.events.push('load');return await __cloudRead();},
 async saveData(data){sdkTest.writes++;if(sdkTest.failSave)throw Error('save failed');await __cloudWrite(data);}
 },system:{isAudioEnabled:()=>false,getLanguage:async()=>'en',onAudioEnabledChange(f){sdkTest.audio=f;},onPause(f){sdkTest.pause=()=>{sdkTest.paused=true;f();};},onResume(f){sdkTest.resume=()=>{sdkTest.paused=false;f();};}},
 engagement:{sendScore:async score=>{sdkTest.scores.push(score.value);}},health:{logWarning(){},logError(){}},ads:{
 async requestInterstitialAd(){sdkTest.interstitials++;if(sdkTest.adFail)throw Error('no fill');await new Promise(r=>setTimeout(r,60));},
 async requestRewardedAd(id){sdkTest.rewards.push(id);if(sdkTest.reward==='error')throw Error('unavailable');await new Promise(r=>setTimeout(r,60));return sdkTest.reward;}
 }};` }));
const app=fn=>page.evaluate(fn);
const expire=()=>app(()=>{window.__spa.app.platform.lastInterstitialRequestCompleted=-Infinity;});
const idle=()=>page.waitForFunction(()=>!window.__spa.app.navigationBusy&&!window.__spa.app.rewardBusy&&!window.__spa.app.platform.adBusy);
fs.mkdirSync('test-results/playables',{recursive:true});
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 assert.deepEqual(await app(()=>sdkTest.events),['first','load','ready']);assert.equal(await app(()=>window.__spa.app.save.coins),700);assert.deepEqual(await app(()=>sdkTest.scores),[0]);
 await page.click('#start-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),1);
 await page.click('#home-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),1); // within 30 sec
 await expire();await page.click('#start-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),2);
 await page.click('#pause-button');await expire();await page.click('#restart-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),3);
 await expire();await page.click('#home-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),4);
 // SDK global mute wins over the in-game switch.
 assert.ok(await app(async()=>{const a=window.__spa.app;await a.audio.unlock();await a.toggleSound();await a.toggleSound();return a.audio.music.muted&&a.audio.music.paused&&!a.audio.platformEnabled;}));
 await app(()=>sdkTest.audio(true));assert.ok(await app(()=>window.__spa.app.audio.platformEnabled));
 await page.click('#start-button');await idle();
 await app(()=>{window.dispatchEvent(new Event('blur'));document.dispatchEvent(new Event('visibilitychange'));});
 assert.equal(await app(()=>window.__spa.app.ui.mode),'playing');
 assert.equal(await page.locator('#resume-button').count(),0);
 await app(()=>sdkTest.pause());const frozen=await app(()=>({elapsed:window.__spa.app.scene.elapsed,gift:window.__spa.app.save.playGift.seconds}));await page.waitForTimeout(220);
 assert.equal(await app(()=>window.__spa.app.ui.mode),'playing');
 assert.equal(await page.locator('#resume-button').count(),0);
 assert.deepEqual(await app(()=>({elapsed:window.__spa.app.scene.elapsed,gift:window.__spa.app.save.playGift.seconds})),frozen);assert.ok(await app(()=>document.getElementById('ui-accessibility').inert));
 await app(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});assert.ok(await app(()=>window.__spa.app.platformSuspended));
 await app(()=>sdkTest.resume());await page.waitForTimeout(120);assert.equal(await app(()=>window.__spa.app.platformSuspended),false);
 await page.click('#pause-button');await app(()=>{sdkTest.pause();sdkTest.resume();});
 assert.equal(await app(()=>window.__spa.app.ui.mode),'pause');
 assert.equal(await app(()=>window.__spa.app.scene.frozen),true);
 await page.click('#resume-button');
 // Retry and Again use the same global interstitial gate, including stage retry.
 await app(async()=>{const a=window.__spa.app;a.save.purchased.push(20);await a.start(20);});await idle();
 assert.ok(await app(()=>!!window.__spa.app.scene.puzzle));await expire();const retryBefore=await app(()=>sdkTest.interstitials);
 await page.click('#puzzle-retry');await idle();assert.equal(await app(()=>sdkTest.interstitials),retryBefore+1);
 await app(()=>{const a=window.__spa.app;a.modalName='puzzle-failed';a.freeze();a.ui.show('puzzle-failed');});await expire();await page.click('#puzzle-failed-retry');await idle();assert.equal(await app(()=>sdkTest.interstitials),retryBefore+2);
 // Unique completed levels, not star count or repeated completions.
 await app(async()=>{const a=window.__spa.app;await a.start(54);a.completed(54,20);});await page.waitForTimeout(150);assert.equal(await app(()=>sdkTest.scores.at(-1)),1);
 await app(async()=>{const a=window.__spa.app;await a.start(54);a.completed(54,20);});await page.waitForTimeout(150);assert.deepEqual(await app(()=>sdkTest.scores),[0,1]);
 await app(()=>{const a=window.__spa.app;a.finishCardCelebration();});await expire();const nextBefore=await app(()=>sdkTest.interstitials);await page.click('#next-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),nextBefore+1);
 // Unsuccessful interstitial does not advance the conservative request clock.
 await app(()=>{sdkTest.adFail=true;window.__spa.app.platform.lastInterstitialRequestCompleted=-Infinity;});const failedBefore=await app(()=>sdkTest.interstitials);
 await page.click('#home-button');await idle();await page.click('#start-button');await idle();assert.equal(await app(()=>sdkTest.interstitials),failedBefore+2);await app(()=>sdkTest.adFail=false);
 await app(()=>window.__spa.app.openLevels());await idle();await page.click('#menu-wallet');
 const beforeCoins=await app(()=>window.__spa.app.save.coins);
 for(const outcome of [false,'error']){await page.evaluate(value=>sdkTest.reward=value,outcome);await page.click('#coins-watch');await idle();assert.equal(await app(()=>window.__spa.app.save.coins),beforeCoins);if(await page.locator('#reward-continue').count())await page.click('#reward-continue');}
 await app(()=>sdkTest.reward=true);await page.click('#coins-watch');await idle();assert.equal(await app(()=>window.__spa.app.save.coins),beforeCoins+100);assert.deepEqual(await app(()=>sdkTest.rewards),Array(3).fill('skincare-coins'));
 await page.click('#reward-continue');await page.click('#supply-hints');await page.waitForTimeout(150);assert.equal(JSON.parse(cloud).hints,3);
 // Latest failed snapshot survives until retry. Never falls back to browser storage.
 await app(()=>{sdkTest.failSave=true;const a=window.__spa.app;a.save.coins+=7;a.persist();});await page.waitForSelector('#cloud-status:visible');const latest=await app(()=>window.__spa.app.save.coins);
 await app(()=>sdkTest.failSave=false);await page.click('#cloud-status');await page.waitForTimeout(150);assert.equal(JSON.parse(cloud).coins,latest);
 await page.reload();await page.waitForSelector('#start-button');assert.equal(await app(()=>window.__spa.app.save.coins),latest);assert.deepEqual(await app(()=>sdkTest.scores),[1]);
 // Cloud read error and corrupt data block play and never overwrite cloud.
 failLoad=true;await page.reload();await page.waitForSelector('#cloud-retry');assert.equal(await page.locator('#start-button').count(),0);assert.equal(await app(()=>sdkTest.writes),0);
 failLoad=false;await page.click('#cloud-retry');await page.waitForSelector('#start-button');
 const saved=cloud;cloud='{bad json';await page.reload();await page.waitForSelector('#cloud-retry');assert.equal(cloud,'{bad json');assert.equal(await app(()=>sdkTest.writes),0);cloud=saved;
 await page.click('#cloud-retry');await page.waitForSelector('#start-button');await page.screenshot({path:'test-results/playables/menu.png'});
 assert.deepEqual(errors,[]);console.log('PASS: SDK boot, cloud load/reload/failure/corruption, no browser persistence, ads and interval at transitions, muted audio, pause/resume, distinct-level score, reward true/false/reject, cloud retry');
}finally{await browser.close();}
