import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});p.on('pageerror',e=>console.log('ERROR',e.message));
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:31},(_,i)=>i+1);a.audio.enabled=false;});
for(let i=20;i<24;i++){
 await p.evaluate(i=>window.__spa.app.start(i),i);
 const result=await p.evaluate(()=>{const s=window.__spa.app.scene,q=s.puzzle;q.down({x:q.config.solution[0][0],y:q.config.solution[0][1]});for(const [x,y] of q.config.solution.slice(1))q.move({x,y});q.up({x:0,y:0});s.frozen=true;let count=0;while(q.status==='surviving'&&q.survived<10&&count++<1000)q.update(1/60);return q.debug();});
 assert.equal(result.status,'surviving');assert.ok(result.survived>=10);assert.ok(Math.abs(result.wall.angle)<.2);console.log(i+1,'valid shelter survives');await p.screenshot({path:`test-results/puzzles/physics-${i+1}.png`});
 await p.evaluate(i=>window.__spa.app.start(i),i);
 const failed=await p.evaluate(()=>{const s=window.__spa.app.scene,q=s.puzzle;q.down({x:60,y:250});q.move({x:110,y:250});q.up({x:110,y:250});s.frozen=true;for(let k=0;k<601&&q.status==='surviving';k++)q.update(1/60);return q.debug();});
 console.log(JSON.stringify(failed.bees?.slice(0,3)));assert.equal(failed.status,'failed',`Level ${i+1}: an unrelated line must not protect the pet`);console.log(i+1,'open shelter fails at',failed.survived);
}
await b.close();

