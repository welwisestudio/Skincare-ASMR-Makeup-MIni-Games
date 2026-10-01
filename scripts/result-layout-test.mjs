import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/result-layout';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:551,height:870},deviceScaleFactor:2});
const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{
  const a=window.__spa.app;a.scene.begin(9);a.freeze();a.state='result';a.modalName='result';a.resultIndex=9;a.elapsedResult=23;a.resultCanvas=a.scene.capturePortrait(true);a.save.coins=1605;a.displayCoins=1605;a.observedCoins=1605;a.resultId='layout';
  window.checkResult=()=>{
   const u=a.ui,dpr=a.pixelRatio,items=u.root.list.filter(o=>['Image','Container'].includes(o.type)&&o.visible&&o.alpha>.01).map(o=>{const b=o.getBounds();return{name:o.texture?.key||o.list.find(c=>c.type==='Text')?.text||'photo',x:b.x/dpr,y:b.y/dpr,w:b.width/dpr,h:b.height/dpr};}),issues=[];
   for(const item of items)if(item.x<0||item.y<0||item.x+item.w>innerWidth+.5||item.y+item.h>innerHeight+.5)issues.push({type:'outside',item});
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const p=items[i],q=items[j],x=Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x),y=Math.min(p.y+p.h,q.y+q.h)-Math.max(p.y,q.y);if(x>.5&&y>.5)issues.push({type:'overlap',a:p.name,b:q.name,x,y});}
   const ribbon=items.find(i=>i.name==='Level complete!'),back=document.getElementById('result-menu').getBoundingClientRect();
   if(ribbon&&Math.min(ribbon.x+ribbon.w,back.right)>Math.max(ribbon.x,back.x)&&Math.min(ribbon.y+ribbon.h,back.bottom)>Math.max(ribbon.y,back.y))issues.push({type:'banner-hit-area'});
   return issues;
  };
 });
 const sizes=[[551,870],[550,870],[552,870],[320,480],[390,844],[550,550],[876,876],[768,1024],[860,1000],[861,1000],[1199,960],[1200,960],[844,390],[1440,900],[2560,1080],[320,240]];
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.waitForTimeout(80);
  for(const coins of [0,75,225]){
   await page.evaluate(coins=>{const a=window.__spa.app;a.resultCoins=coins;a.resultIndex=coins===225?19:9;a.save.pendingResult={id:'layout',base:75,tripled:coins===225};a.ui.show('result');a.ui.render(false);},coins);
   const issues=await page.evaluate(()=>window.checkResult());report.push({width,height,coins,issues});
   if(width===551||width===876||width===844||width===320||issues.length)await page.screenshot({path:`${out}/${width}x${height}-${coins}.png`});
   assert.deepEqual(issues,[],`${width}x${height}, reward ${coins}`);
  }
 }
 await page.setViewportSize({width:551,height:870});await page.waitForTimeout(100);
 const animated=await page.evaluate(async()=>{const a=window.__spa.app;a.resultCoins=75;a.ui.show('result');const start=performance.now(),issues=[];while(performance.now()-start<1100){await new Promise(requestAnimationFrame);issues.push(...window.checkResult());}return issues;});assert.deepEqual(animated,[],'Entrance animation must keep artwork separated');
 await page.click('#result-menu');await page.waitForSelector('#start-button');assert.deepEqual(errors,[]);
 await writeFile(`${out}/report.json`,JSON.stringify({cases:report.length,report,animated,errors},null,2));console.log(`Result layout: ${report.length} cases, entrance animation and menu navigation PASS`);
}finally{await browser.close();}
