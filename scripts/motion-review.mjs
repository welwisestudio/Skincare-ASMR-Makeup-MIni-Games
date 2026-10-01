import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/motion',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(async()=>{const a=window.__spa.app;a.save.stars=[3,3,3,3,0];a.save.coins=300;await a.start(4);});await page.waitForTimeout(800);
await page.evaluate(()=>{
  const chunks=[],stream=document.querySelector('canvas').captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1800000});
  recorder.ondataavailable=e=>chunks.push(e.data);window.motionRecording={recorder,chunks,stream};recorder.start();window.__spa.app.completed(4,63);
});
let previous=0;
for(const time of [0,160,450,900,1600]){await page.waitForTimeout(time-previous);await page.screenshot({path:`test-results/motion/victory-${time}.png`});previous=time;}
await page.waitForTimeout(900);
const video=await page.evaluate(()=>new Promise(resolve=>{const {recorder,chunks,stream}=window.motionRecording;recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());stream.getTracks().forEach(t=>t.stop());resolve(Array.from(bytes));};recorder.stop();}));
await writeFile('test-results/motion/victory-preview.webm',Buffer.from(video));
await page.click('#next-button');await page.waitForSelector('#collection-menu');await page.waitForTimeout(1200);await page.screenshot({path:'test-results/motion/final-collection.png'});
await page.click('#collection-menu');await page.waitForTimeout(1000);assert.equal(await page.locator('.level-card:not(:disabled)').count(),5);await page.screenshot({path:'test-results/motion/all-unlocked.png'});
assert.deepEqual(errors,[]);console.log('Victory animation capture and FINISH → collection → unlocked album: PASS.');await browser.close();
