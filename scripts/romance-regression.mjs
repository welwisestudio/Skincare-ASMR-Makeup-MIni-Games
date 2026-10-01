import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {LEVELS} from '../src/levels.js';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/romance';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});const errors=[],layouts=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
 await p.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:41},(_,i)=>i+1);a.save.hints=30;a.save.skips=10;a.audio.enabled=false;});
 const begin=async(i=32,step=0)=>{await p.evaluate(async({i,step})=>{const a=window.__spa.app;await a.start(i);if(step){a.scene.stepIndex=step;a.scene.nextStep();}},{i,step});await p.waitForTimeout(100);};
 const screen=async(x,y)=>p.evaluate(({x,y})=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+x*s.fit)/a.pixelRatio,y:(s.root.y+y*s.fit)/a.pixelRatio};},{x,y});
 for(let stage=0;stage<7;stage++){
  await begin(32,stage);await p.click('#hint-button');await p.click('#help-use');await p.waitForTimeout(400);
  assert.ok(await p.evaluate(()=>window.__spa.app.scene.gestureHint.active));assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepProgress),0);
  await p.screenshot({path:`${out}/hint-${stage}.png`});await p.click('#pause-button');const clock=await p.evaluate(()=>window.__spa.app.scene.romance.clock);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.clock),clock);await p.click('#resume-button');
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>window.__spa.app.scene.gestureHint.active));await p.setViewportSize({width:390,height:844});
 }
 // Touch cancel returns a held garment without advancing; a subsequent drag works.
 await begin(32,2);const cdp=await p.context().newCDPSession(p);let a=await screen(80,335),z=await screen(300,300);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...z,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(260);
 assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.items[0].done),false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...z,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await p.evaluate(()=>window.__spa.app.scene.romance.zip));
 await p.click('#pause-button');await p.click('#resume-button');assert.ok(await p.evaluate(()=>window.__spa.app.scene.romance.zip));
 await p.click('#hint-button');await p.click('#help-watch');await p.click('#ad-cancel');await p.click('#meta-close');assert.ok(await p.evaluate(()=>window.__spa.app.scene.romance.zip));
 await p.click('#puzzle-retry');assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepIndex),0);assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.actorState),'before');
 // Every skip has the same next chapter and only consumes one inventory unit.
 await begin(33,0);
 for(let step=0;step<7;step++){await p.click('#skip-button');await p.click('#help-use');if(step<6)await p.waitForFunction(step=>window.__spa.app.scene.stepIndex===step+1&&!window.__spa.app.scene.transitioning,step);}
 await p.waitForSelector('#card-earned-continue');await p.click('#card-earned-continue');assert.equal(await p.evaluate(()=>window.__spa.app.save.skips),3);assert.equal(await p.evaluate(()=>window.__spa.app.save.stars[33]),3);
 for(const [width,height] of [[320,480],[551,870],[876,876],[844,390],[320,240]]){
  await p.setViewportSize({width,height});
  for(let i=32;i<42;i++)for(let step=0;step<7;step++){
   await begin(i,step);const g=await p.evaluate(()=>{const a=window.__spa.app,s=a.scene,l=a.ui.layout,d=a.pixelRatio;return{cx:(s.root.x+300*s.fit)/d,expected:l.x+l.W*l.scale/2,top:s.root.y/d,bottom:(s.root.y+650*s.fit)/d,controls:[...document.querySelectorAll('.ui-hit')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})};});
   assert.ok(Math.abs(g.cx-g.expected)<1);assert.ok(g.top>=0&&g.bottom<=height);for(const r of g.controls)assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.w<=width+1&&r.y+r.h<=height+1);
   layouts.push({width,height,level:i+1,stage:step});
   if([320,844].includes(width)&&i===32&&[0,4,5,6].includes(step)){await p.waitForTimeout(280);await p.screenshot({path:`${out}/layout-${width}x${height}-${step}.png`});}
  }
 }
 await begin(0);assert.equal(await p.evaluate(()=>!!window.__spa.app.scene.romance),false);
 await begin(5);assert.ok(await p.evaluate(()=>!!window.__spa.app.scene.workshop));
 await begin(20);assert.ok(await p.evaluate(()=>!!window.__spa.app.scene.puzzle));
 await p.evaluate(page=>{const a=window.__spa.app;a.welcome();a.albumPage=page;a.ui.render(false);},Math.floor((LEVELS.length-1)/5));assert.equal(await p.locator('.level-card').count(),LEVELS.length%5||5);assert.equal(await p.locator('.collection-card').count(),1);
 assert.deepEqual(errors,[]);await writeFile(`${out}/regression.json`,JSON.stringify({layouts,hints:7,pause:true,touchCancel:true,touchDress:true,adCancel:true,restart:true,allSevenSkips:true,oldRouters:true,partialAlbum:true,errors},null,2));console.log('Romance regression PASS:',layouts.length,'layouts, 7 hints/skips, pause, touch, restart, old scenes');
}finally{await b.close();}
