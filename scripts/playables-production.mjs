import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir} from 'node:fs/promises';
await mkdir('test-results/playables',{recursive:true});
const html=await readFile('dist/index.html','utf8');
assert.ok(!/<script\b[^>]*>\s*[^<\s]/i.test(html),'Production HTML must not contain inline script code');
for(const file of await readdir('dist/assets')){
 if(!file.endsWith('.js'))continue;
 assert.ok(!/document\.hidden|document\.visibilityState|visibilitychange|onvisibilitychange/.test(await readFile('dist/assets/'+file,'utf8')),`Forbidden visibility API in ${file}`);
}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://localhost:4173')&&r.url()!=='https://www.youtube.com/game_api/v1')external.push(r.url());});
let cloud='',failLoad=false;await page.exposeFunction('__read',()=>{if(failLoad)throw Error('Cloud unavailable');return cloud;});await page.exposeFunction('__write',s=>{cloud=s;});
await page.addInitScript(()=>{
 for(const k of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,k,{get(){throw Error('Local storage prohibited');}});
 window.cspViolations=[];document.addEventListener('securitypolicyviolation',event=>cspViolations.push(event.violatedDirective+': '+event.blockedURI));
 for(const k of ['hidden','visibilityState'])Object.defineProperty(document,k,{get(){throw Error('Browser visibility prohibited');}});
 const listen=document.addEventListener.bind(document);
 document.addEventListener=(type,...args)=>{if(type==='visibilitychange')throw Error('Browser suspension prohibited');return listen(type,...args);};
});
await page.route('http://localhost:4173/',async route=>{
 const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"default-src 'none'; script-src 'nonce-playables-test' 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.youtube.com/game_api/v1; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' blob: data:; sandbox allow-pointer-lock allow-same-origin allow-scripts; base-uri 'self'; worker-src 'self' blob:"}});
});
await page.route('https://www.youtube.com/game_api/v1',route=>route.fulfill({contentType:'application/javascript',body:`
 const state={events:[],ads:0,scores:[],loaded:false,writes:0};window.sdkTest=state;
 const ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady(){state.events.push('first');},gameReady(){state.events.push('ready');},loadData:async()=>{if(state.events[0]!=='first')throw Error('firstFrameReady missing');state.events.push('load');const data=await __read();state.loaded=true;return data;},saveData:async data=>{if(!state.loaded)throw Error('Write before successful load');state.writes++;await __write(data);}},system:{isAudioEnabled:()=>false,getLanguage:async()=>'en',onAudioEnabledChange(f){state.audio=f;},onPause(f){state.pause=f;},onResume(f){state.resume=f;}},health:{logWarning(){},logError(){}},engagement:{sendScore:async s=>state.scores.push(s.value)},ads:{requestInterstitialAd:async()=>{state.ads++;},requestRewardedAd:async()=>true}};` }));
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('#start-button');assert.equal(await page.evaluate(()=>typeof window.__spa),'undefined');assert.deepEqual(await page.evaluate(()=>sdkTest.events),['first','load','ready']);
 await page.click('#menu-wallet');await page.click('#coins-watch');await page.waitForSelector('#reward-continue');assert.equal(JSON.parse(cloud).coins,150);
 await page.click('#reward-continue');await page.click('#supply-hints');await page.waitForSelector('#reward-continue');await page.waitForTimeout(100);assert.equal(JSON.parse(cloud).coins,0);assert.equal(JSON.parse(cloud).hints,3);
 await page.reload();await page.waitForSelector('#start-button');await page.click('#start-button');await page.waitForSelector('#pause-button');assert.equal(await page.evaluate(()=>sdkTest.ads),1);
 await page.click('#home-button');await page.waitForSelector('#start-button');assert.equal(await page.evaluate(()=>sdkTest.ads),1);assert.equal(JSON.parse(cloud).hints,3);
 await page.setViewportSize({width:1703,height:820});await page.waitForTimeout(100);await page.click('#start-button');await page.waitForSelector('#pause-button');await page.screenshot({path:'test-results/playables/production-desktop.png'});
 for(const empty of ['', '  ', '{}', 'null']){
  cloud=empty;await page.reload();await page.waitForSelector('#start-button');assert.deepEqual(await page.evaluate(()=>sdkTest.events),['first','load','ready']);assert.equal(await page.evaluate(()=>sdkTest.writes),0);
 }
 for(const version of [undefined,1,2,3]){
  cloud=JSON.stringify({version,stars:[3,0,0],coins:37,hints:4,sound:false});
  await page.reload();await page.waitForSelector('#start-button');
  assert.equal(await page.locator('#coin-count').textContent(),'37');
  await page.evaluate(()=>sdkTest.pause());await page.waitForFunction(()=>sdkTest.writes>0);
  assert.equal(JSON.parse(cloud).coins,37);assert.equal(JSON.parse(cloud).hints,4);assert.equal(JSON.parse(cloud).stars[0],3);
  await page.evaluate(()=>sdkTest.resume());
 }
 const saved=cloud;
 for(const bad of ['{bad json',JSON.stringify({version:99,stars:[3],coins:37})]){
  cloud=bad;await page.reload();await page.waitForSelector('#cloud-retry');assert.equal(await page.evaluate(()=>sdkTest.writes),0);assert.equal(cloud,bad);
 }
 cloud=saved;failLoad=true;await page.reload();await page.waitForSelector('#cloud-retry');assert.equal(await page.evaluate(()=>sdkTest.writes),0);assert.equal(cloud,saved);
 failLoad=false;await page.click('#cloud-retry');await page.waitForSelector('#start-button');assert.equal(await page.locator('#coin-count').textContent(),'37');
 assert.deepEqual(await page.evaluate(()=>cspViolations),[]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: nonce CSP, no inline scripts or visibility APIs, SDK startup order, empty/legacy/current saves, failed/corrupt/future saves never overwritten, retry, cloud-only reload, rewarded purchase, desktop/mobile, no production debug global');
}finally{await browser.close();}
