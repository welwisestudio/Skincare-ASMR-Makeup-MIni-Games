import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
await mkdir('test-results/candle-tools',{recursive:true});const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:454,height:886}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const move=async pt=>{const q=await p.evaluate(pt=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+pt.x*s.fit)/a.pixelRatio,y:(s.root.y+pt.y*s.fit)/a.pixelRatio};},pt);await p.mouse.move(q.x,q.y);};
try{await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(async()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=Array.from({length:42},(_,i)=>i);await a.start(16);});
for(let step=0;step<2;step++){
const t=await p.evaluate(()=>window.__spa.app.scene.workshop.targets[0]);await move(t);await p.mouse.down();await p.waitForTimeout(900);await p.mouse.up();const progress=await p.evaluate(()=>window.__spa.app.scene.stepProgress);assert.ok(progress>.2&&progress<.8);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepProgress),progress);await p.screenshot({path:`test-results/candle-tools/fill-${step}.png`});await p.mouse.down();await p.waitForFunction(step=>window.__spa.app.scene.stepIndex===step+1&&!window.__spa.app.scene.transitioning,step);await p.mouse.up();}
const paths=await p.evaluate(()=>window.__spa.app.scene.workshop.debug().paths);for(const path of paths){await move(path.points[0]);await p.mouse.down();for(const pt of path.points){await move(pt);await p.waitForTimeout(80);}await p.mouse.up();}
await p.waitForFunction(()=>window.__spa.app.scene.workshop.mode==='ignite'&&!window.__spa.app.scene.transitioning);
const t=await p.evaluate(()=>window.__spa.app.scene.workshop.targets[0]);await move(t);await p.mouse.down();await p.waitForFunction(()=>!!window.__spa.app.scene.workshop.flame);await p.mouse.up();await p.screenshot({path:'test-results/candle-tools/lit.png'});await p.waitForFunction(()=>window.__spa.app.state==='result');
// Audit every workshop tool/stage and all romance brush/shower variants at both orientations.
for(const viewport of [{width:454,height:886},{width:844,height:390}]){
await p.setViewportSize(viewport);
for(let index=5;index<20;index++){
const count=await p.evaluate(async index=>{const a=window.__spa.app;await a.start(index);return a.scene.level.steps.length;},index);
for(let step=0;step<count;step++){const box=await p.evaluate(step=>{const s=window.__spa.app.scene;s.stepIndex=step;s.nextStep();const c=s.workshop.cursor;return {w:c.displayWidth,h:c.displayHeight,key:c.texture.key};},step);assert.ok(Number.isFinite(box.w)&&box.w>0);assert.notEqual(box.key,'__MISSING');}
}
for(let index=32;index<42;index++)for(const step of [0,1])await p.evaluate(async({index,step})=>{const a=window.__spa.app;await a.start(index);a.scene.stepIndex=step;a.scene.nextStep();},{index,step});
}
assert.deepEqual(errors,[]);console.log('PASS: fragrance/wax full fill and resume, wick, ignition/result, 15 workshop levels all stages, 10 romance tool variants in 2 orientations');
}finally{await b.close();}
