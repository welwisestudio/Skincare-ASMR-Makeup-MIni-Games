import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:454,height:886},deviceScaleFactor:2});const errors=[],external=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4173'))external.push(r.url())});
await p.addInitScript(()=>localStorage.setItem('skincare-asmr-v1',JSON.stringify({version:3,levelOrderVersion:4,sound:false,premiumUnlocked:Array.from({length:12},(_,i)=>42+i),premiumSkipped:[],stars:Array(54).fill(0),purchased:Array.from({length:42},(_,i)=>i),hints:10,skips:20,coins:3000})));
try{
await p.goto('http://localhost:4173');await p.waitForSelector('#start-button');assert.equal(await p.evaluate(()=>typeof window.__spa),'undefined');
for(let index=42;index<54;index++){
 for(let j=0;j<11&&!await p.locator(`#level-card-${index}`).count();j++)await p.click('#album-next');
 await p.click(`#level-card-${index}`);await p.waitForSelector('#pause-button');await p.waitForTimeout(650);
 await p.screenshot({path:`test-results/premium-redesign/production-${index}.png`});
 const status=await p.locator('#game-status').textContent();assert.ok(status.length>20);console.log(index,status);
 await p.click('#pause-button');await p.click('#resume-button');await p.click('#home-button');await p.waitForSelector('#album-next');
}
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: production opens all 12 redesigned levels, pause/return, all assets loaded locally, no debug globals');
}finally{await b.close();}
