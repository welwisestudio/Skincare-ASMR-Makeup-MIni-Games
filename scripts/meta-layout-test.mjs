import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/meta-layout',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
const modes=['rewards','daily','wheel','boxes','coins','shop','purchase','cards','card-detail','pass','items','help','modes','mode-offer','bonus','reward','ad'];
for(const [width,height] of [[390,844],[844,390],[876,876],[320,480],[320,240],[768,1024],[1440,900]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(150);
 for(const mode of modes){
  await page.evaluate(mode=>{const a=window.__spa.app;a.metaData={index:4,id:mode==='card-detail'?'devoted':'stones',kind:'skip'};a.bonus={id:'stones',popped:[],stacked:2,finished:false,start:performance.now()};
   if(mode==='reward')a.metaData={title:'The royal collection!',rewards:[{coins:650,boxes:2,items:['serum','butterfly'],cards:['royal']}],art:'grand-bundle',extra:'Spa Pass 7/7 reward included'};
   a.ui.show(mode);
  },mode);
  await page.waitForTimeout(60);
  const controls=await page.evaluate(()=>[...document.querySelectorAll('.ui-hit')].map(e=>{const b=e.getBoundingClientRect();return{id:e.id,x:b.x,y:b.y,w:b.width,h:b.height};}));
  for(const c of controls)assert.ok(c.x>=-1&&c.y>=-1&&c.x+c.w<=width+1&&c.y+c.h<=height+1,`${mode} ${width}x${height}: ${c.id} outside viewport ${JSON.stringify(c)}`);
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j],x=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),y=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);assert.ok(x<2||y<2,`${mode} ${width}x${height}: ${a.id} overlaps ${b.id}`);}
  if(width===390||width===844){await page.waitForTimeout(550);await page.screenshot({path:`test-results/meta-layout/${width}x${height}-${mode}.png`});}
  report.push({width,height,mode,passed:true});
 }
}
assert.deepEqual(errors,[]);await writeFile('test-results/meta-layout-report.json',JSON.stringify({report,errors},null,2));await browser.close();console.log(`${report.length} monetization layouts pass at DPR 2.`);
