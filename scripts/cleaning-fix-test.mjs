import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:454,height:886},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(async()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=[43,46];await a.start(46);});
await p.waitForTimeout(800);fs.mkdirSync('test-results/cleaning-fix',{recursive:true});await p.screenshot({path:'test-results/cleaning-fix/sofa-dirty.png'});
const sofa=await p.evaluate(()=>{const s=window.__spa.app.scene,q=s.premiumRitual;s.frozen=true;const mask=q.fabricMaskPixels,dirt=q.dirt.getContext('2d').getImageData(0,0,600,640).data;let dirtyOutside=0;for(let i=3;i<mask.length;i+=4)if(mask[i]===0&&dirt[i]>0)dirtyOutside++;
s.stepIndex=2;s.nextStep();q.update(1);const b=q.bounds;for(let y=b.y+5;y<b.y+b.h;y+=11)q.stroke({x:b.x,y},{x:b.x+b.w,y},b.w);q.draw();const foam=q.foam.getContext('2d').getImageData(0,0,600,640).data;let foamOutside=0;for(let i=3;i<mask.length;i+=4)if(mask[i]===0&&foam[i]>0)foamOutside++;const art=q.source('clean-sofa'),c=document.createElement('canvas');c.width=art.width;c.height=art.height;c.getContext('2d').drawImage(art,0,0);return{dirtyOutside,foamOutside,progress:s.stepProgress,corner:c.getContext('2d').getImageData(0,0,1,1).data[3]};});
assert.deepEqual([sofa.dirtyOutside,sofa.foamOutside,sofa.corner],[0,0,0]);assert.ok(sofa.progress>.975);await p.waitForTimeout(450);await p.screenshot({path:'test-results/cleaning-fix/sofa-foam.png'});
await p.evaluate(async()=>{const a=window.__spa.app;await a.start(43);a.scene.frozen=true;});
const transitions=await p.evaluate(()=>{const s=window.__spa.app.scene,q=s.premiumRitual,pixels=()=>q.ctx.getImageData(0,0,600,640).data,delta=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)n+=Math.abs(a[i]-b[i]);return n;},reports=[];
for(let step=0;step<5;step++){
 s.stepIndex=step;s.nextStep();q.update(1);
 if(q.mode==='vacuum')q.crumbs.forEach(t=>t.done=true);
 else {const b=q.bounds;for(let pass=0;pass<3&&s.stepProgress<1;pass++)if(q.mode==='groom'){for(let x=b.x+5;x<b.x+b.w;x+=11)q.stroke({x,y:b.y},{x,y:b.y+b.h},b.h);}else for(let y=b.y+5;y<b.y+b.h;y+=11)q.stroke({x:b.x,y},{x:b.x+b.w,y},b.w);}
 q.draw();const before=pixels(),foamBefore=q.foam.toDataURL();q.finish();const start=pixels();q.update(.30);const halfway=pixels();q.update(.40);const end=pixels();reports.push({step,boundary:delta(before,start),half:delta(start,halfway),total:delta(start,end),maxDelta:start.reduce((m,v,i)=>Math.max(m,Math.abs(v-end[i])),0),foamPreserved:step!==1||foamBefore===q.foam.toDataURL()});
 if(step<4){s.stepIndex=step+1;s.nextStep();const next=pixels();reports.push({enter:step+1,boundary:delta(end,next)});q.update(1);}
}
return reports;});
for(const r of transitions){assert.equal(r.boundary,0,JSON.stringify(r));if(r.foamPreserved!==undefined)assert.ok(r.foamPreserved);if(r.maxDelta>1)assert.ok(r.half>0&&r.half<r.total,JSON.stringify(r));}console.log('Exact stage-boundary pixel continuity:',transitions);
// Live transition keeps animating, freezes in pause, and advances exactly once.
await p.evaluate(async()=>{const a=window.__spa.app;await a.start(43);a.scene.skipStage();});await p.waitForTimeout(200);await p.click('#pause-button');const t=await p.evaluate(()=>window.__spa.app.scene.premiumRitual.blend?.time);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__spa.app.scene.premiumRitual.blend?.time),t);await p.click('#resume-button');await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===1);await p.waitForTimeout(850);assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepIndex),1);
await p.evaluate(()=>{const s=window.__spa.app.scene;s.stepIndex=4;s.nextStep();});await p.waitForTimeout(800);await p.screenshot({path:'test-results/cleaning-fix/rug-groom.png'});
assert.deepEqual(errors,[]);console.log('PASS: sofa cutout, exact dirt/foam mask, complete sofa coverage, rug transitions, pause/resume');
}finally{await b.close();}
