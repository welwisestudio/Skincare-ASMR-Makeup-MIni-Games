import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await browser.newPage();await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
try{
for(const dt of [1/30,1/60,1/120])for(let index=20;index<24;index++){
const runs=[];
for(const push of [false,true])runs.push(await p.evaluate(async({index,dt,push})=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=Array.from({length:42},(_,i)=>i);await a.start(index);const s=a.scene,q=s.puzzle;s.frozen=true;const points=q.config.solution;q.down({x:points[0][0],y:points[0][1]});for(const [x,y] of points.slice(1))q.move({x,y});q.up({x:0,y:0});if(!push)q.pushShelter=()=>{};let trace=[];while(q.status==='surviving'&&q.survived<10){q.update(dt);trace.push({x:q.wall.position.x,y:q.wall.position.y,angle:q.wall.angle});}return{trace,pushes:q.beePushes,status:q.status};},{index,dt,push}));
assert.equal(runs[1].status,'surviving');assert.ok(runs[1].pushes>0);const delta=Math.max(...runs[1].trace.map((v,i)=>Math.hypot(v.x-runs[0].trace[i].x,v.y-runs[0].trace[i].y)));console.log(JSON.stringify({index,fps:1/dt,pushes:runs[1].pushes,delta}));assert.ok(delta>.02);
}
}finally{await browser.close();}
