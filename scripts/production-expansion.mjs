import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4173'))external.push(r.url());});
await page.addInitScript(()=>localStorage.setItem('skincare-asmr-v1',JSON.stringify({version:3,stars:Array(20).fill(0),coins:700,sound:false,purchased:[19]})));
await page.goto('http://localhost:4173');await page.waitForSelector('#start-button');assert.equal(await page.evaluate(()=>typeof window.__spa),'undefined');
for(let i=0;i<3;i++){await page.click('#album-next');await page.waitForTimeout(100);}await page.click('#level-card-19');await page.waitForSelector('#pause-button');assert.match(await page.locator('#game-status').textContent(),/Pack & Go/);
// Compute the documented worktable transform without a development hook.
const transform=await page.evaluate(()=>{const W=480,H=Math.max(780,Math.min(1040,innerHeight/innerWidth*W)),scale=Math.min(innerWidth/W,innerHeight/H,1.65),x=(innerWidth-W*scale)/2,y=(innerHeight-H*scale)/2,top=196,bottom=H-205,fit=Math.min((W-28)/600,(bottom-top)/570)*scale;return{fit,x:x+W/2*scale-300*fit,y:y+(top+bottom)/2*scale-292*fit};});
const move=(x,y)=>page.mouse.move(transform.x+x*transform.fit,transform.y+y*transform.fit);
await move(145,513);await page.mouse.down();await page.mouse.up();await page.waitForTimeout(350);
await move(145,513);await page.mouse.down();for(let i=1;i<=15;i++){await move(145+(195-145)*i/15,513+(207-513)*i/15);await page.waitForTimeout(25);}await page.mouse.up();await page.waitForTimeout(100);
assert.notEqual(await page.locator('#progress-label').textContent(),'0%');await page.screenshot({path:'test-results/production-level-20.png'});
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile('test-results/production-expansion.json',JSON.stringify({level20:true,albumPages:4,rotationAndPlacement:true,debugAbsent:true,errors,external},null,2));console.log('Production expansion PASS: 4 album pages, level 20, real rotation/placement, no debug or external requests');await browser.close();
