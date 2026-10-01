import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4173'))external.push(r.url());});
await page.addInitScript(()=>{if(!localStorage.getItem('skincare-asmr-v1'))localStorage.setItem('skincare-asmr-v1',JSON.stringify({version:3,stars:Array(32).fill(0),coins:700,sound:false,purchased:[32]}));});
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('#start-button');assert.equal(await page.evaluate(()=>typeof window.__spa),'undefined');
 for(let i=0;i<6;i++){await page.click('#album-next');await page.waitForTimeout(100);}await page.click('#level-card-32');await page.waitForSelector('#pause-button');
 const t=await page.evaluate(()=>{const W=480,H=Math.max(780,Math.min(1040,innerHeight/innerWidth*W)),scale=Math.min(innerWidth/W,innerHeight/H,1.65),x=(innerWidth-W*scale)/2,y=(innerHeight-H*scale)/2,top=196,bottom=H-205,fit=Math.min((W-22)/600,(bottom-top)/650)*scale;return{fit,x:x+W/2*scale-300*fit,y:y+(top+bottom)/2*scale-325*fit};});
 const move=(x,y)=>page.mouse.move(t.x+x*t.fit,t.y+y*t.fit);
 const tap=(x,y)=>page.mouse.click(t.x+x*t.fit,t.y+y*t.fit);
 const route=async points=>{await move(...points[0]);await page.mouse.down();for(let i=1;i<points.length;i++){const a=points[i-1],z=points[i];for(let j=1;j<=20;j++)await move(a[0]+(z[0]-a[0])*j/20,a[1]+(z[1]-a[1])*j/20);}await page.mouse.up();};
 const stage=async title=>{await page.waitForFunction(title=>document.getElementById('game-status').textContent.includes(title),title);await page.waitForTimeout(200);};
 for(const q of [[265,224],[323,289],[261,369],[317,443],[297,135]]){await move(...q);await page.mouse.down();await page.waitForTimeout(1200);await page.mouse.up();}
 await stage('A lovely new hairstyle');
 for(const points of [[[266,90],[233,143],[239,230]],[[300,60],[326,105],[333,228]],[[324,77],[337,127],[340,240]]])await route(points);
 await stage('Her dream dress');await route([[80,335],[300,300]]);await route([[303,305],[301,264],[300,220],[300,184]]);
 await stage('A little sparkle');await route([[80,290],[300,171]]);await route([[515,160],[322,70]]);
 await stage('Look how far she has come');await route([[300,540],[45,540],[555,540]]);await tap(300,612);
 await stage('A question from the heart');await route([[300,602],[300,304]]);
 await stage('Their happily ever after');await page.waitForTimeout(3400);await page.screenshot({path:'test-results/romance/production-wedding.png'});await tap(300,612);
 await page.waitForSelector('#card-earned-continue');await page.click('#card-earned-continue');await page.waitForSelector('#next-button');
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('skincare-asmr-v1')));assert.equal(save.stars.length,42);assert.equal(save.stars[32],3);assert.equal(save.coins,775);assert.ok(save.cards.includes('romance-rose'));
 await page.reload();await page.waitForSelector('#start-button');assert.equal(await page.locator('#star-count').textContent(),'3 / 126');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile('test-results/romance/production.json',JSON.stringify({level33:true,sevenStages:true,realPointer:true,oldSaveMigration:true,persistentReward:true,debugAbsent:true,external,errors},null,2));console.log('Production romance PASS: all 7 chapters, migration, rewards, no debug or external requests');
}finally{await browser.close();}
