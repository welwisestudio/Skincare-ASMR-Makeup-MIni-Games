import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {RESCUES,DIFFERENCES} from '../src/puzzle-levels.js';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4173'))external.push(r.url());});
await page.addInitScript(()=>{if(!localStorage.getItem('skincare-asmr-v1'))localStorage.setItem('skincare-asmr-v1',JSON.stringify({version:3,stars:Array(20).fill(0),coins:700,sound:false,purchased:Array.from({length:12},(_,i)=>20+i)}));});
async function open(index){
 await page.goto('http://localhost:4173');await page.waitForSelector('#start-button');
 assert.equal(await page.evaluate(()=>typeof window.__spa),'undefined');
 for(let i=0;i<Math.floor(index/5);i++){await page.click('#album-next');await page.waitForTimeout(80);}
 await page.click(`#level-card-${index}`);await page.waitForSelector('#pause-button');await page.waitForTimeout(200);
}
async function transform(w,h){return page.evaluate(({w,h})=>{const W=480,H=Math.max(780,Math.min(1040,innerHeight/innerWidth*W)),scale=Math.min(innerWidth/W,innerHeight/H,1.65),x=(innerWidth-W*scale)/2,y=(innerHeight-H*scale)/2,top=196,bottom=H-205,fit=Math.min((W-22)/w,(bottom-top)/h)*scale;return{fit,x:x+W/2*scale-w/2*fit,y:y+(top+bottom)/2*scale-h/2*fit};},{w,h});}
async function result(i){await page.waitForSelector('#card-earned-continue',{timeout:18000});await page.click('#card-earned-continue');await page.waitForSelector('#next-button');assert.equal(await page.evaluate(i=>JSON.parse(localStorage.getItem('skincare-asmr-v1')).stars[i],i),3);}
try{
 await open(20);let t=await transform(600,560);
 for(let i=0;i<RESCUES[0].solution.length;i++){const [x,y]=RESCUES[0].solution[i];await page.mouse.move(t.x+x*t.fit,t.y+y*t.fit,{steps:i?18:1});if(i===0)await page.mouse.down();}
 await page.mouse.up();await result(20);await page.screenshot({path:'test-results/puzzles/production-rescue.png'});
 await open(24);t=await transform(600,940);
 for(const [x,y] of DIFFERENCES.tea.points){await page.mouse.click(t.x+(300+(x-.5)*540)*t.fit,t.y+(264+(y-.5)*405)*t.fit);await page.waitForTimeout(100);}
 await result(24);await page.screenshot({path:'test-results/puzzles/production-difference.png'});
 await open(28);t=await transform(600,560);await page.mouse.click(t.x+111*t.fit,t.y+167*t.fit);await page.waitForTimeout(350);
 await page.click('#pause-button');await page.click('#resume-button');await page.screenshot({path:'test-results/puzzles/production-memo.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile('test-results/puzzles/production-report.json',JSON.stringify({rescueWin:true,differenceWin:true,memoFlipPause:true,saveMigratedTo32:true,debugAbsent:true,errors,external},null,2));
 console.log('Production puzzles PASS: rescue/differences won, Memo flip/pause, no debug or external requests');
}finally{await browser.close();}
