import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errors=[],layouts=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
 await p.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:31},(_,i)=>i+1);a.save.hints=20;a.save.skips=3;a.audio.enabled=false;});
 const begin=async i=>{await p.evaluate(i=>window.__spa.app.start(i),i);await p.waitForTimeout(100);};
 const tap=async(x,y)=>{const v=await p.evaluate(({x,y})=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+x*s.fit)/a.pixelRatio,y:(s.root.y+y*s.fit)/a.pixelRatio};},{x,y});await p.mouse.click(v.x,v.y);};
 for(const [i,kind] of [[20,'trace'],[24,'tap'],[28,'tap-pair']]){
  await begin(i);await p.click('#hint-button');await p.click('#help-use');await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(()=>window.__spa.app.scene.gestureHint.plan.kind),kind);assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepProgress),0);
  await p.screenshot({path:`test-results/puzzles/hint-${i+1}.png`});
  await p.click('#pause-button');const clock=await p.evaluate(()=>window.__spa.app.scene.gestureHint.clock);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>window.__spa.app.scene.gestureHint.clock),clock);await p.click('#resume-button');
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>window.__spa.app.scene.gestureHint.active),true);await p.setViewportSize({width:390,height:844});
 }
 // Timers and a revealed card survive pause and orientation changes.
 await begin(28);let c=await p.evaluate(()=>{const c=window.__spa.app.scene.puzzle.cards[0];return{x:c.x,y:c.y};});await tap(c.x,c.y);await p.waitForTimeout(350);await p.click('#pause-button');
 const remaining=await p.evaluate(()=>window.__spa.app.scene.puzzle.remaining);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.remaining),remaining);await p.click('#resume-button');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.selected.length),1);
 await p.click('#hint-button');await p.click('#help-watch');await p.waitForTimeout(250);await p.click('#ad-cancel');await p.click('#meta-close');assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.selected.length),1);
 // A timeout presents a working retry, with a fresh deck and full timer.
 await p.evaluate(()=>window.__spa.app.scene.puzzle.remaining=.01);await p.waitForFunction(()=>window.__spa.app.scene.puzzle.status==='failed');await p.screenshot({path:'test-results/puzzles/memo-timeout.png'});
 await p.click('#puzzle-failed-retry');assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.status),'matching');assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.matchCount),0);
 await p.click('#puzzle-retry');assert.equal(await p.evaluate(()=>window.__spa.app.scene.puzzle.cards.some(c=>c.open)),false);
 // Skip inventory completes a puzzle through the standard reward flow.
 await begin(24);await p.click('#skip-button');await p.click('#help-use');await p.waitForSelector('#card-earned-continue');await p.click('#card-earned-continue');assert.equal(await p.evaluate(()=>window.__spa.app.save.skips),2);assert.equal(await p.evaluate(()=>window.__spa.app.save.stars[24]),3);
 for(const [width,height] of [[320,480],[551,870],[876,876],[844,390],[1440,900],[320,240]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(100);
  for(let i=20;i<32;i++){
   await begin(i);const geometry=await p.evaluate(()=>{const a=window.__spa.app,s=a.scene,q=s.puzzle,l=a.ui.layout,d=a.pixelRatio;return{center:(s.root.x+q.width*s.fit/2)/d,expected:l.x+l.W*l.scale/2,top:s.root.y/d,bottom:(s.root.y+q.height*s.fit)/d,buttons:[...document.querySelectorAll('.ui-hit')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})};});
   assert.ok(Math.abs(geometry.center-geometry.expected)<1);assert.ok(geometry.top>=0&&geometry.bottom<=height);for(const r of geometry.buttons)assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=width+1&&r.y+r.h<=height+1);
   layouts.push({width,height,level:i+1});if((width===320&&height===480)||(width===844))await p.screenshot({path:`test-results/puzzles/layout-${width}x${height}-${i+1}.png`});
  }
 }
 assert.deepEqual(errors,[]);await writeFile('test-results/puzzles/regression-report.json',JSON.stringify({layouts,hints:true,readOnlyHint:true,pausedTimers:true,adCancellation:true,timeoutRetry:true,skip:true,errors},null,2));console.log('Puzzle regression:',layouts.length,'layouts; animated hints, pause, resize, ad cancellation, timeout, retry, skip PASS');
}finally{await b.close();}
