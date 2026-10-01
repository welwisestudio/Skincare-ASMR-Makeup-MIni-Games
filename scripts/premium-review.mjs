import {chromium} from '@playwright/test';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:454,height:886}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);a.save.premiumSkipped=[];});
fs.mkdirSync('test-results/premium-redesign',{recursive:true});
for(const i of [42,43,44,45,47,48,49,50,51,52,53]){
 await p.evaluate(async i=>{await window.__spa.app.start(i)},i);await p.waitForTimeout(150);await p.screenshot({path:`test-results/premium-redesign/start-${i}.png`});
 console.log(i,await p.evaluate(()=>{const s=window.__spa.app.scene;return {name:s.level.name,step:s.step.name,mode:s.mode,ritual:!!s.premiumRitual,romance:!!s.romance,fit:s.fit};}));
}
console.log('ERRORS',errors);await b.close();
