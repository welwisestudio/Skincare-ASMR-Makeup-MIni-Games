import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out='test-results/expansion';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:480,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(()=>{const a=window.__spa.app;a.reducedMotion=true;a.save.purchased=Array.from({length:19},(_,i)=>i+1);});
for(let l=5;l<20;l++){
 await page.evaluate(i=>window.__spa.app.start(i),l);await page.waitForTimeout(60);
 for(let k=0;k<3;k++){
  await page.evaluate(k=>{const a=window.__spa.app;a.scene.stepIndex=k;a.scene.nextStep(true);a.ui.show('playing');a.freeze();},k);
  await page.waitForTimeout(50);await page.screenshot({path:`${out}/L${l+1}-S${k+1}.png`});
 }
}
await page.evaluate(()=>{const a=window.__spa.app;a.welcome();a.albumPage=3;a.ui.render(false);});await page.screenshot({path:`${out}/album.png`});
await browser.close();
