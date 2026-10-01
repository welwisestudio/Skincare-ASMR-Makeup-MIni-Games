import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { LEVELS } from '../src/levels.js';

await mkdir('test-results',{recursive:true});
const visualAudit=process.env.VISUAL_AUDIT==='1';
if(visualAudit)await mkdir('test-results/visual-stages',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const startAt=Math.max(0,Math.min(4,Number(process.env.START_LEVEL||1)-1));
if(startAt>0)await page.addInitScript(start=>{if(!localStorage.getItem('skincare-asmr-v1'))localStorage.setItem('skincare-asmr-v1',JSON.stringify({version:1,stars:Array.from({length:5},(_,i)=>i<start?3:0),coins:start*75,sound:false}));},startAt);
const errors=[];const report={levels:[],viewports:[]};
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.goto(process.env.GAME_URL||'http://localhost:5173');await page.waitForSelector('#start-button');
await page.click('#start-button');await page.waitForTimeout(200);

const state=()=>page.evaluate(()=>({...window.__spa.getState(),grid:window.__spa.app.scene.grid?.map(g=>({...g}))}));
async function point(x,y){const s=await state(),box=await page.locator('#game-canvas canvas').boundingBox();return{x:box.x+s.offset.x+x*s.fit,y:box.y+s.offset.y+y*s.fit};}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function drag(a,b,ms=850){await move(a.x,a.y);await page.mouse.down();for(let i=1;i<=18;i++){await move(a.x+(b.x-a.x)*i/18,a.y+(b.y-a.y)*i/18);await page.waitForTimeout(ms/18);}await page.mouse.up();}
async function hold(x,y,ms){await move(x,y);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();}

// Pausing must freeze both input and the active-play clock.
await page.click('#pause-button');const paused=await state();await page.waitForTimeout(300);assert.equal((await state()).elapsed,paused.elapsed);await page.click('#resume-button');
await move(20,20);await page.mouse.down();await page.waitForTimeout(300);await page.mouse.up();assert.equal((await state()).progress,0,'Dragging outside the face must not count');

for(let level=startAt;level<5;level++){
  const started=Date.now();let lastStep=-1,reviewedStep=-1;
  while(true){
    const s=await state();
    if(!s.active){await page.waitForSelector('#next-button');break;}
    assert.equal(s.level,level);if(Date.now()-started>180000)throw new Error(`Level ${level+1} stuck at ${JSON.stringify({...s,grid:undefined})}`);
    if(s.step!==lastStep){lastStep=s.step;console.log(`Ritual ${level+1}, step ${s.step+1}: ${s.mode} / ${s.layer}`);await page.screenshot({path:`test-results/level-${level+1}-step-${s.step+1}.png`});}
    if(visualAudit&&s.progress>=.25&&reviewedStep!==s.step){
      reviewedStep=s.step;await page.evaluate(()=>window.__spa.app.freeze());
      for(const [label,width,height] of [['phone',390,844],['square',876,876],['wide',844,390]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(130);
        await page.screenshot({path:`test-results/visual-stages/L${level+1}-S${s.step+1}-${label}.png`});
      }
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.evaluate(()=>window.__spa.app.unfreeze());
    }
    if(s.progress>=.94&&['paint','wipe'].includes(s.mode)){await page.waitForTimeout(250);continue;}
    if(['paint','wipe'].includes(s.mode)){
      // Use real pointer input on unfinished samples, never mutate completion state.
      const cells=s.grid.filter(g=>g.v<.96);
      if(!cells.length){await page.waitForTimeout(250);continue;}
      const radius=38;
      let best=cells[0],score=-1;
      for(const candidate of cells){let sum=0;for(const cell of cells){if(Math.hypot(cell.x-candidate.x,cell.y-candidate.y)<radius)sum+=1-cell.v;}if(sum>score){score=sum;best=candidate;}}
      await hold(best.x,best.y,140);
    }else if(s.mode==='hold'||s.mode==='dab'){
      const t=s.targets.find(t=>!t.done);if(t)await hold(t.x,t.y,200);else await page.waitForTimeout(150);
    }else if(s.mode==='place'){
      const p=s.patches.find(p=>!p.placed);if(p)await drag(p,p.target,240);else await page.waitForTimeout(150);
    }else if(s.mode==='peel'){
      if(s.layer==='patches'){const p=s.patches.find(p=>!p.removed);if(p)await drag(p,{x:p.x+p.target.side*84,y:p.y+30},300);else await page.waitForTimeout(150);}
      else{const t=s.targets.find(t=>!t.done);if(t)await drag(t,{x:t.x,y:t.y+170},320);else await page.waitForTimeout(150);}
    }else if(s.mode==='trace'){
      const p=s.trace.find(t=>!t.done);if(p){const a={x:p.a.x+(p.b.x-p.a.x)*p.v,y:p.a.y+(p.b.y-p.a.y)*p.v};await drag(a,p.b,640);}else await page.waitForTimeout(150);
    }
  }
  const elapsed=(await state()).elapsed;report.levels.push({level:level+1,elapsed:Math.round(elapsed*10)/10});console.log(`Ritual ${level+1} complete in ${elapsed.toFixed(1)}s`);
  await page.waitForTimeout(1300);await page.screenshot({path:`test-results/level-${level+1}-complete.png`});
  if(level<4)await page.click('#next-button');
}

const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('skincare-asmr-v1')));
assert.deepEqual(saved.stars.slice(0,5),[3,3,3,3,3]);assert.equal(saved.coins,375);
await page.reload();await page.waitForSelector('#start-button');assert.equal(await page.locator('#star-count').textContent(),`15 / ${LEVELS.length*3}`);
assert.equal(await page.locator('.level-card:not(:disabled)').count(),5);

for(const [width,height] of [[320,480],[320,568],[390,844],[430,932],[768,1024],[1440,900],[2560,1440],[844,390],[667,375],[568,320],[480,320],[320,240]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  const layout=await page.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return{scrollWidth:document.documentElement.scrollWidth,width:innerWidth,canvas:{x:c.x,y:c.y,width:c.width,height:c.height}};});
  assert.ok(layout.scrollWidth<=width,`Horizontal overflow at ${width}x${height}`);
  for(const button of await page.locator('.ui-hit').all()){const box=await button.boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1&&box.y>=-1&&box.y+box.height<=height+1,`Control outside ${width}x${height}: ${JSON.stringify(box)}`);}
  report.viewports.push({width,height,passed:true});await page.screenshot({path:`test-results/layout-${width}x${height}.png`});
}
assert.deepEqual(errors,[],'No page errors or failed HTTP requests');
report.errors=errors;report.persistence=true;report.pause=true;report.outsideInput=true;
await writeFile(startAt===0?'test-results/report.json':`test-results/retest-from-${startAt+1}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
await browser.close();
