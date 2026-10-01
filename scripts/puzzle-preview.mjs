import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/puzzles',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});p.on('pageerror',e=>console.log('ERROR',e.message));
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
await p.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:31},(_,i)=>i+1);a.save.sound=false;a.audio.enabled=false;});
for(const i of [20,21,22,23,24,25,26,27,28,29,30,31]){await p.evaluate(i=>window.__spa.app.start(i),i);await p.waitForTimeout(650);await p.screenshot({path:`test-results/puzzles/level-${i+1}.png`});console.log(i+1,await p.evaluate(()=>window.__spa.app.scene.puzzle?.status));}
await p.setViewportSize({width:844,height:390});for(const i of [20,24,28,31]){await p.evaluate(i=>window.__spa.app.start(i),i);await p.waitForTimeout(350);await p.screenshot({path:`test-results/puzzles/wide-${i+1}.png`});}
await b.close();
