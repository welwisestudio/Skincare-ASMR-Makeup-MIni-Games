import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const variant=process.argv[2]||'optimized';
assert.ok(['original','optimized'].includes(variant));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];fs.mkdirSync('test-results/build-compression/screens',{recursive:true});
try{
 for(const viewport of [{width:390,height:844},{width:1703,height:820}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:2,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  if(variant==='optimized')await page.route('**/*.webp',r=>{
   const name=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'');
   const file=path.resolve('dist',name);assert.ok(file.startsWith(path.resolve('dist')+path.sep));
   return r.fulfill({path:file,contentType:'image/webp'});
  });
  await page.addInitScript(()=>{let seed=120;window.seedImages=n=>{seed=n;};Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
  await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
  await page.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=Array.from({length:58},(_,i)=>i);a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);a.save.playGift.seconds=0;a.tickPlayGift=()=>{};a.ui.render(false);});
  const shot=async name=>{await page.waitForTimeout(100);await page.screenshot({path:`test-results/build-compression/screens/${variant}-${viewport.width}-${name}.png`});};
  await shot('menu');
  for(let index=0;index<58;index++){
   await page.evaluate(async index=>{seedImages(500+index);await window.__spa.app.start(index);window.__spa.app.freeze();},index);
   assert.equal(await page.evaluate(()=>window.__spa.app.scene.levelIndex),index);
   if([0,43,46,48,50,53,54,57].includes(index))await shot(`level-${index}`);
  }
  await page.evaluate(async()=>{const a=window.__spa.app;seedImages(100);await a.start(40);a.scene.stepIndex=6;a.scene.nextStep(true);a.freeze();});await shot('wedding');
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log(`PASS: ${variant} artwork, all 58 levels open on phone/desktop at DPR 2, no missing assets/JS errors; screenshots saved`);
}finally{await browser.close();}
