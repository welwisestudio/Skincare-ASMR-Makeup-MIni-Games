import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/expansion-regression';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:19},(_,i)=>i+1);a.save.skips=10;a.save.hints=10;});
const state=()=>page.evaluate(()=>window.__spa.getState());
const cdp=await page.context().newCDPSession(page);
async function touch(type,p){const s=await state();await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:s.offset.x+p.x*s.fit,y:s.offset.y+p.y*s.fit,id:1}]});}
await page.evaluate(()=>window.__spa.app.start(19));await page.waitForTimeout(100);
let s=await state(),i=s.workshop.items[0];await touch('touchStart',i);await touch('touchEnd',i);await page.waitForTimeout(300);assert.equal((await state()).workshop.items[0].angle,0);
await touch('touchStart',i);for(let k=1;k<=12;k++){await touch('touchMove',{x:i.x+(i.tx-i.x)*k/12,y:i.y+(i.ty-i.y)*k/12});await page.waitForTimeout(20);}await touch('touchEnd',i);assert.equal((await state()).workshop.items[0].done,true);
const progress=(await state()).progress;await page.setViewportSize({width:844,height:390});await page.waitForTimeout(180);assert.equal((await state()).progress,progress);
await page.click('#pause-button');const elapsed=(await state()).elapsed;await page.waitForTimeout(160);assert.equal((await state()).elapsed,elapsed);await page.click('#resume-button');
await page.click('#hint-button');await page.click('#help-use');assert.equal(await page.evaluate(()=>window.__spa.app.save.hints),9);
await page.click('#skip-button');await page.click('#help-use');await page.waitForTimeout(900);assert.equal((await state()).step,1);assert.equal(await page.evaluate(()=>window.__spa.app.save.skips),9);
await page.click('#pause-button');await page.click('#restart-button');assert.equal((await state()).step,0);assert.equal((await state()).progress,0);
await page.evaluate(()=>window.__spa.app.start(0));await page.waitForTimeout(100);assert.equal((await state()).workshop,undefined);assert.equal(await page.evaluate(()=>window.__spa.app.scene.portrait.visible),true);
await page.evaluate(()=>window.__spa.app.start(5));assert.ok((await state()).workshop);assert.equal(await page.evaluate(()=>window.__spa.app.scene.portrait.visible),false);
// Rendering fixtures supplement the separate real-input completion test.
let screens=0;
for(const [width,height] of [[320,480],[390,844],[844,390],[876,876],[1440,900]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(70);
 for(let l=5;l<20;l++)for(let step=0;step<3;step++){
  await page.evaluate(({l,step})=>{const a=window.__spa.app;a.scene.begin(l);a.scene.stepIndex=step;a.scene.nextStep(true);a.ui.show('playing');a.freeze();},{l,step});
  const g=await page.evaluate(()=>{const a=window.__spa.app,s=a.scene,l=a.ui.layout;return {cx:(s.root.x+300*s.fit)/a.pixelRatio,center:l.x+l.W*l.scale/2,buttons:[...document.querySelectorAll('.ui-hit')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})};});assert.ok(Math.abs(g.cx-g.center)<1);
  for(const b of g.buttons)assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.w<=width+1&&b.y+b.h<=height+1);
  if(width===390||width===844){await page.screenshot({path:`${out}/${width}-L${l+1}-S${step+1}.png`});}screens++;
 }
}
assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({screens,touchRotation:true,touchPlacement:true,resizePreservesProgress:true,pause:true,hint:true,skip:true,restart:true,oldNewSceneSwitch:true,errors},null,2));await browser.close();console.log('Expansion regression PASS:',screens,'layouts, touch, pause, hints, skip, restart, old/new scene switch');
