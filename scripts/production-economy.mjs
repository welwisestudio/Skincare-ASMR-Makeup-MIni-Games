import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('skincare-asmr-v1')));
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('#start-button');
 assert.equal(await page.evaluate(()=>typeof window.__spa),'undefined');
 await page.click('#menu-wallet');await page.click('#coins-watch');await page.click('#ad-cancel');
 assert.equal((await save())?.coins||0,0);
 await page.click('#coins-watch');await page.waitForFunction(()=>!document.getElementById('ad-complete')?.disabled);await page.click('#ad-complete');
 await page.waitForSelector('#reward-continue');assert.equal((await save()).coins,150); // 100 + first Spa Pass reward 50
 await page.click('#reward-continue');await page.click('#supply-hints');await page.waitForSelector('#reward-continue');
 assert.equal((await save()).coins,0);assert.equal((await save()).hints,3);
 await page.reload();await page.waitForSelector('#start-button');assert.equal((await save()).hints,3);
 assert.deepEqual(errors,[]);console.log('PASS: production bundle, ad cancellation/completion, 100 coins + disclosed pass bonus, purchase, persistence, no debug global or asset errors');
}finally{await browser.close();}
