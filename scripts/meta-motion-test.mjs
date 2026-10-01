import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/meta-motion',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:844,height:390}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(()=>{const stream=document.querySelector('canvas').captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});recorder.ondataavailable=e=>chunks.push(e.data);window.metaRecording={stream,chunks,recorder};recorder.start();});
await page.evaluate(()=>{const a=window.__spa.app;a.save.bonusUnlocked.push('stones');a.playBonus('stones');});
await page.waitForTimeout(700);
for(let i=0;i<5;i++){
  await page.waitForFunction(()=>Math.abs(window.__spa.app.ui.stoneOffset)<8);
  await page.click('#stone-stack');await page.waitForTimeout(650);
  const n=await page.evaluate(()=>window.__spa.app.bonus.stacked);if(n===i)i--;
}
await page.waitForSelector('#reward-continue');await page.click('#reward-continue');await page.waitForTimeout(650);
for(const [width,height] of [[844,390],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(500);
  const gap=await page.evaluate(()=>{const a=window.__spa.app,ui=a.ui,t=ui.root.list.find(t=>t.text==='A lovely little break!'),b=ui.root.list.find(c=>c.type==='Container'&&c.list?.some(o=>o.text==='PLAY AGAIN'));return {text:t.getBounds().bottom,button:b.getBounds().top};});
  assert.ok(gap.button>gap.text,'Completion caption must sit above the replay button');
  await page.screenshot({path:`test-results/meta-motion/${width}x${height}-bonus-finished.png`});
}
await page.click('#bonus-replay');await page.waitForTimeout(600);await page.screenshot({path:'test-results/meta-motion/stone-whole-sprite.png'});
await page.evaluate(()=>{const a=window.__spa.app;a.save.passAds=0;a.save.coins=0;a.metaStack=[];a.openMeta('pass');});
await page.click('#pass-watch');await page.waitForFunction(()=>!document.getElementById('ad-complete')?.disabled);await page.click('#ad-complete');await page.waitForSelector('#reward-continue');
assert.equal(await page.evaluate(()=>window.__spa.app.save.passAds),1);assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),50);
await page.waitForTimeout(600);await page.screenshot({path:'test-results/meta-motion/direct-pass-reward.png'});
const video=await page.evaluate(()=>new Promise(resolve=>{const {stream,chunks,recorder}=window.metaRecording;recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());stream.getTracks().forEach(t=>t.stop());resolve(Array.from(bytes));};recorder.stop();}));
await writeFile('test-results/meta-motion/bonus-preview.webm',Buffer.from(video));
assert.deepEqual(errors,[]);await writeFile('test-results/meta-motion/report.json',JSON.stringify({bonusFinishedLayouts:2,wholeStone:true,directPassReward:true,errors},null,2));await context.close();await browser.close();
console.log('Bonus completion layouts, stone motion and direct Spa Pass claim: PASS');
