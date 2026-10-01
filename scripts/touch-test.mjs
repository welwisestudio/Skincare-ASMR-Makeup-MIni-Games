import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.tap('#start-button');
const cdp=await page.context().newCDPSession(page);
const pos=await page.evaluate(()=>{const s=window.__spa.getState(),b=document.querySelector('canvas').getBoundingClientRect();return{x:b.x+s.offset.x+300*s.fit,y:b.y+s.offset.y+230*s.fit};});
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pos.x,y:pos.y,id:0}]});
for(let i=0;i<15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pos.x+Math.sin(i/3)*24,y:pos.y+Math.cos(i/3)*12,id:0}]});await page.waitForTimeout(70);}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const progress=await page.evaluate(()=>window.__spa.getState().progress);assert.ok(progress>.01,'Touch strokes must advance the treatment');
await page.screenshot({path:'test-results/touch-retina-portrait.png'});
assert.equal(await page.evaluate(()=>scrollY),0,'Touch gestures must not scroll the page');
await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);const afterRotate=await page.evaluate(()=>window.__spa.getState());assert.equal(afterRotate.progress,progress,'Rotation must preserve active treatment');
await page.screenshot({path:'test-results/touch-retina-landscape.png'});
await page.tap('#pause-button');assert.equal(await page.evaluate(()=>window.__spa.getState().paused),true);await page.tap('#resume-button');
await page.tap('#sound-button');assert.equal(await page.getAttribute('#sound-button','aria-pressed'),'false');await page.reload();await page.waitForSelector('#start-button');assert.equal(await page.getAttribute('#sound-button','aria-pressed'),'false','Muted sound preference persists');
assert.deepEqual(errors,[]);
await writeFile('test-results/touch-report.json',JSON.stringify({touch:true,rotation:true,noScroll:true,pause:true,soundPersistence:true,errors},null,2));console.log('Touch, orientation change, pause, no-scroll and sound persistence: PASS');
await browser.close();
