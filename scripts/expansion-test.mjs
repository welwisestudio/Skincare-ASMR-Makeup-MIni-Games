import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/expansion-play';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:480,height:900},deviceScaleFactor:2});
const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(()=>{const a=window.__spa.app;a.save.sound=false;a.audio.enabled=false;a.save.stars=Array(20).fill(0);a.save.coins=0;a.save.purchased=Array.from({length:19},(_,i)=>i+1);});
const state=()=>page.evaluate(()=>window.__spa.getState());
let transform;
async function move(x,y){await page.mouse.move(transform.offset.x+x*transform.fit,transform.offset.y+y*transform.fit);}
async function tap(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();await page.waitForTimeout(80);}
async function drag(a,b,ms=380){await move(a.x,a.y);await page.mouse.down();for(let i=1;i<=14;i++){await move(a.x+(b.x-a.x)*i/14,a.y+(b.y-a.y)*i/14);await page.waitForTimeout(ms/14);}await page.mouse.up();await page.waitForTimeout(260);}
async function shot(name){await page.screenshot({path:`${out}/${name}.png`});}
const start=+(process.env.START_WORKSHOP||6)-1,end=+(process.env.END_WORKSHOP||20);
for(let level=start;level<end;level++){
 await page.evaluate(i=>window.__spa.app.start(i),level);await page.waitForTimeout(100);transform=await state();
 if(level===start){await page.click('#pause-button');const before=(await state()).elapsed;await page.waitForTimeout(170);assert.equal((await state()).elapsed,before);await page.click('#resume-button');await tap(15,15);assert.equal((await state()).progress,0);}
 let last=-1,started=Date.now(),mid=new Set();
 while(true){
  const s=await state();if(!s.active){await page.waitForSelector('#next-button');break;}if(Date.now()-started>100000)throw new Error(`Stuck L${level+1}: ${JSON.stringify(s)}`);
  const w=s.workshop;if(!w){await page.waitForTimeout(50);continue;}
  if(s.step!==last){last=s.step;console.log(`L${level+1} S${last+1}: ${w.mechanic}`);await shot(`L${level+1}-S${last+1}-start`);}
  if(await page.evaluate(()=>window.__spa.app.scene.transitioning)){await page.waitForTimeout(150);continue;}
  if(w.zip){await move(w.zip.points[w.zip.index].x,w.zip.points[w.zip.index].y);await page.mouse.down();for(const p of w.zip.points.slice(w.zip.index)){await move(p.x,p.y);await page.waitForTimeout(45);}await page.mouse.up();}
  else if(w.paths.length){const path=w.paths.find(p=>!p.done);if(path){await move(path.points[path.index].x,path.points[path.index].y);await page.mouse.down();for(const p of path.points.slice(path.index)){await move(p.x,p.y);await page.waitForTimeout(36);}await page.mouse.up();}}
  else if(w.items.length){const i=w.items.find(i=>!i.done);if(i){if(i.rotate&&i.angle){await tap(i.x,i.y);await page.waitForTimeout(280);}await drag(i,{x:i.tx,y:i.ty});}}
  else if(w.moves?.length){const m=w.moves[w.sequence];if(m)await drag(m.a,m.b);}
  else if(['mix','swirl'].includes(w.mechanic)){await move(w.center.x+w.radius,w.center.y);await page.mouse.down();for(let i=0;i<=205;i++){const a=i*Math.PI*2/48;await move(w.center.x+Math.cos(a)*w.radius,w.center.y+Math.sin(a)*w.radius);await page.waitForTimeout(23);}await page.mouse.up();}
  else if(['filling','wax','fragrance'].includes(w.mechanic)){const t=w.targets.find(t=>!t.done);if(t){await move(t.x,t.y);await page.mouse.down();await page.waitForTimeout(w.mechanic==='wax'?2350:w.mechanic==='fragrance'?2650:1290);await page.mouse.up();}}
  else if(w.mechanic==='crush'){await tap(300,265);}
  else if(w.mechanic==='bath-pop'){const t=w.targets.find(t=>!t.done);if(t)await tap(t.x,t.y);}
  else if(w.mechanic==='stack'){if(Math.abs(w.stackX-300)<25)await tap(300,200);else await page.waitForTimeout(90);}
  else {const t=w.targets.find(t=>!t.done);if(t){await move(t.x,t.y);await page.mouse.down();for(let i=0;i<30;i++){const a=i*.7;await move(t.x+Math.cos(a)*11,t.y+Math.sin(a)*11);await page.waitForTimeout(38);}await page.mouse.up();}}
  const after=await state();if(after.active&&after.step===s.step&&after.progress>.22&&!mid.has(s.step)){mid.add(s.step);await shot(`L${level+1}-S${s.step+1}-mid`);}
 }
 await page.waitForTimeout(850);await shot(`L${level+1}-result`);
 report.push({level:level+1,seconds:(await state()).elapsed,stages:3});
 assert.equal(await page.evaluate(i=>window.__spa.app.save.stars[i],level),3);
 if(level===end-1){await page.setViewportSize({width:900,height:480});await page.waitForTimeout(120);await shot('result-landscape');}
}
assert.deepEqual(errors,[]);await page.reload();await page.waitForSelector('#start-button');const saved=await page.evaluate(()=>window.__spa.app.save);for(let i=start;i<end;i++)assert.equal(saved.stars[i],3);assert.equal(saved.coins,(end-start)*75);
await writeFile(`${out}/report-${start+1}-${end}.json`,JSON.stringify({report,errors,persistence:true},null,2));console.log(JSON.stringify({report,errors}));await browser.close();
