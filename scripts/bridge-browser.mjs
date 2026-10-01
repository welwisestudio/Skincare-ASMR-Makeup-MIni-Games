// Playgama Bridge integration against a scripted Bridge double.
// Run with the dev server on http://localhost:5173: node scripts/bridge-browser.mjs
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {freshSave} from '../src/save.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const seed=freshSave();seed.coins=700;seed.passAds=7;seed.stars[0]=3;seed.hasLaunched=true;seed.daily.lastDay='2999-01-01';
// Storage lives on the Node side so it survives page reloads.
const cloud={skincare_progress:JSON.stringify(seed)};let writes=0;
await page.exposeFunction('__storageGet',keys=>keys.map(k=>cloud[k]??null));
await page.exposeFunction('__storageSet',(keys,values)=>{writes++;keys.forEach((k,i)=>{cloud[k]=values[i];});});
await page.route('**/playgama-bridge.js',route=>route.fulfill({contentType:'application/javascript',body:`
 const E={AUDIO_STATE_CHANGED:'audio_state_changed',PAUSE_STATE_CHANGED:'pause_state_changed',INTERSTITIAL_STATE_CHANGED:'interstitial_state_changed',REWARDED_STATE_CHANGED:'rewarded_state_changed'};
 const emitter=()=>({l:{},on(e,f){(this.l[e]??=[]).push(f);},off(e,f){this.l[e]=(this.l[e]||[]).filter(x=>x!==f);},emit(e,v){(this.l[e]||[]).slice().forEach(f=>f(v));}});
 const platform=Object.assign(emitter(),{id:'playgama',language:'ru',isAudioEnabled:true,isPaused:false,sendMessage(m,o){test.messages.push(o?.level?m+':'+o.level:m);return Promise.resolve();}});
 const ad=Object.assign(emitter(),{isInterstitialSupported:true,isRewardedSupported:true,interstitialState:'closed',rewardedState:'closed'});
 // Bridge raises pause/audio together with the ad state, like its aggregators do.
 const state=(kind,s)=>{ad[kind+'State']=s;ad.emit(kind==='interstitial'?E.INTERSTITIAL_STATE_CHANGED:E.REWARDED_STATE_CHANGED,s);if(s==='opened'){platform.emit(E.PAUSE_STATE_CHANGED,true);platform.emit(E.AUDIO_STATE_CHANGED,false);}if(s==='closed'||s==='failed'){platform.emit(E.PAUSE_STATE_CHANGED,false);platform.emit(E.AUDIO_STATE_CHANGED,true);}};
 const play=(kind,steps)=>{state(kind,'loading');steps.forEach((s,i)=>setTimeout(()=>state(kind,s),40*(i+1)));};
 ad.showInterstitial=p=>{test.interstitials.push(p);if(test.throttle){state('interstitial','loading');state('interstitial','failed');return;}play('interstitial',['opened','closed']);};
 ad.showRewarded=p=>{test.rewarded.push(p);play('rewarded',test.watch?['opened','rewarded','closed']:['opened','closed']);};
 window.test={messages:[],interstitials:[],rewarded:[],throttle:false,watch:true};
 window.bridge={EVENT_NAME:E,platform,advertisement:ad,initialize:()=>Promise.resolve(),
  storage:{get(keys,parse){test.getCall=[keys,parse];return __storageGet(keys);},set(keys,values){return __storageSet(keys,values);}}};
 `}));
const app=fn=>page.evaluate(fn);
const idle=()=>page.waitForFunction(()=>!window.__spa.app.navigationBusy&&!window.__spa.app.rewardBusy&&!window.__spa.app.platform.adBusy);
try{
 await page.goto(process.env.GAME_URL||'http://localhost:5173');await page.waitForSelector('#start-button');
 // Single storage call with raw JSON; language from Bridge; game_ready once the menu is interactive.
 assert.deepEqual(await app(()=>test.getCall),[['skincare_progress'],false]);
 assert.equal(await app(()=>document.documentElement.lang),'ru');
 assert.equal(await app(()=>window.__spa.app.save.coins),700);assert.equal(await app(()=>window.__spa.app.save.stars[0]),3);
 assert.deepEqual(await app(()=>test.messages),['game_ready']);
 // Host pause freezes the loop and audio; resume restores both.
 await app(()=>bridge.platform.emit('pause_state_changed',true));
 assert.ok(await app(()=>window.__spa.app.platform.paused&&window.__spa.app.audio.blocked&&!document.getElementById('platform-shield').hidden));
 await app(()=>bridge.platform.emit('pause_state_changed',false));
 assert.ok(await app(()=>!window.__spa.app.platform.paused&&!window.__spa.app.audio.blocked));
 await app(()=>bridge.platform.emit('audio_state_changed',false));assert.equal(await app(()=>window.__spa.app.audio.platformEnabled),false);
 await app(()=>bridge.platform.emit('audio_state_changed',true));assert.equal(await app(()=>window.__spa.app.audio.platformEnabled),true);
 // Interstitial at a natural break; the level starts only after the ad closes.
 const before=writes;
 await page.click('#start-button');await idle();
 assert.deepEqual(await app(()=>test.interstitials),['level-campaign']);
 assert.equal(await app(()=>window.__spa.app.state),'playing');
 assert.ok((await app(()=>test.messages)).some(m=>m.startsWith('level_started:')));
 assert.ok(writes>before,'Progress is saved through bridge.storage');
 assert.equal(JSON.parse(cloud.skincare_progress).coins,700);
 // A throttled interstitial reports 'failed' immediately and never blocks navigation.
 await app(()=>{test.throttle=true;});await page.click('#home-button');await idle();
 assert.equal(await app(()=>window.__spa.app.ui.mode),'levels');
 // Rewarded: grant only after the 'rewarded' state.
 await app(()=>window.__spa.app.openMeta('coins'));await page.click('#coins-watch');await idle();
 assert.equal(await app(()=>window.__spa.app.save.coins),800);
 await page.waitForTimeout(100);assert.equal(JSON.parse(cloud.skincare_progress).coins,800);
 await app(()=>{test.watch=false;window.__spa.app.backMeta();window.__spa.app.openMeta('coins');});await page.click('#coins-watch');await idle();
 assert.equal(await app(()=>window.__spa.app.save.coins),800,'Closing early grants nothing');
 assert.ok((await app(()=>test.rewarded)).every(p=>p==='coins'));
 // A reload restores the saved snapshot.
 await page.reload();await page.waitForSelector('#start-button');
 assert.equal(await app(()=>window.__spa.app.save.coins),800);
 assert.deepEqual(errors,[]);
 console.log('Bridge integration: OK');
}finally{await browser.close();}
