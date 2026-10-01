import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/visual-ui',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],report=[];
const sizes=[[390,844],[876,876],[1178,879],[844,390],[320,480],[320,240],[768,1024],[1440,900],[2560,1440]];
for(const dpr of [1,2]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:dpr});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.waitForTimeout(1000);
  // UI fixtures do not assert gameplay completion. Real pointer progression is
  // checked separately by smoke-test.mjs with VISUAL_AUDIT=1.
  await page.evaluate(async()=>{const a=window.__spa.app;await a.start(0);a.scene.tweens.killAll();a.scene.root.setAlpha(1);a.scene.ctx.clearRect(0,0,600,600);a.scene.texture.refresh();a.completed(0,64);});
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.waitForTimeout(200);
    for(const mode of ['levels','playing','pause','result','collection']){
      await page.evaluate(mode=>{const a=window.__spa.app;a.state=mode==='levels'?'welcome':mode==='playing'||mode==='pause'?'playing':'result';a.ui.show(mode);},mode);
      await page.waitForTimeout(1100);
      const data=await page.evaluate(()=>{const a=window.__spa.app,c=a.game.canvas,b=c.getBoundingClientRect();return{regions:a.ui.regions,canvas:[c.width,c.height,b.width,b.height],texts:a.ui.root.list.filter(o=>o.type==='Text').map(o=>({text:o.text,resolution:o.style.resolution})),buttons:[...document.querySelectorAll('.ui-hit')].map(e=>{const b=e.getBoundingClientRect();return{id:e.id,x:b.x,y:b.y,w:b.width,h:b.height};})};});
      assert.equal(data.canvas[0],width*dpr);assert.equal(data.canvas[1],height*dpr);assert.equal(data.canvas[2],width);assert.equal(data.canvas[3],height);
      for(const b of data.buttons)assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.w<=width+1&&b.y+b.h<=height+1,`${mode} ${width}x${height}: ${b.id} offscreen`);
      for(let i=0;i<data.regions.length;i++)for(let j=i+1;j<data.regions.length;j++){
        const a=data.regions[i],b=data.regions[j],overlapX=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),overlapY=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
        assert.ok(overlapX<=0||overlapY<=0,`${mode} ${width}x${height}: ${a.name} overlaps ${b.name}`);
      }
      assert.ok(data.texts.every(t=>t.resolution>=2),'All text uses oversampled textures');
      const path=`test-results/visual-ui/${width}x${height}-dpr${dpr}-${mode}.png`;
      if(dpr===1||width===390||width===876)await page.screenshot({path});
      report.push({width,height,dpr,mode,passed:true});
    }
  }
  // Reduced-motion preference must remove celebration emitters and entrances.
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('#start-button');
  assert.equal(await page.evaluate(()=>window.__spa.app.reducedMotion),true);
  await page.close();
}
assert.deepEqual(errors,[]);await writeFile('test-results/visual-ui-report.json',JSON.stringify({screens:report,errors,reducedMotion:true},null,2));
console.log(`${report.length} UI/viewport/DPR combinations passed, including result-region overlap checks.`);await browser.close();
