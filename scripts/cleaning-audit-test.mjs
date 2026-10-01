import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:454,height:886}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('test-results/cleaning-audit',{recursive:true});
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);});
 for(const index of [42,43,46,48,50,53]){
  const masks=await page.evaluate(async index=>{const a=window.__spa.app;await a.start(index);const s=a.scene,q=s.premiumRitual;s.frozen=true;const reports=[];
   for(const [layer,name] of [[q.dirt,'fabric'],[q.dust,'floor'],[q.windowDirt,'glass']]){const pixels=layer.getContext('2d').getImageData(0,0,600,640).data,mask=q.maskPixels[name];let outside=0,visible=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]>0&&(!mask||mask[i]===0))outside++;if(pixels[i]>20)visible++;}reports.push({name,outside,visible});}
   return reports;
  },index);
  for(const r of masks)assert.equal(r.outside,0,`${index}: ${JSON.stringify(r)}`);
  await page.screenshot({path:`test-results/cleaning-audit/start-${index}.png`});
 }
 await page.evaluate(async()=>{const a=window.__spa.app;await a.start(43);a.scene.frozen=true;});
 const feedback=await page.evaluate(()=>{const s=window.__spa.app.scene,q=s.premiumRitual,alpha=(x,y)=>q.dust.getContext('2d').getImageData(x,y,1,1).data[3],before=alpha(230,220),untouched=alpha(440,430);q.down({x:170,y:220});q.move({x:290,y:220});q.up({x:290,y:220});const particles=q.particles.length;q.update(.1);return{before,after:alpha(230,220),untouched,untouchedAfter:alpha(440,430),particles,progress:s.stepProgress};});
 assert.ok(feedback.before>90&&feedback.after<20,JSON.stringify(feedback));assert.equal(feedback.untouched,feedback.untouchedAfter);assert.ok(feedback.particles>3&&feedback.progress>0&&feedback.progress<.5);
 await page.screenshot({path:'test-results/cleaning-audit/rug-local-trail.png'});
 const idle=await page.evaluate(()=>{const s=window.__spa.app.scene,q=s.premiumRitual,p=s.stepProgress;for(let i=0;i<25;i++)q.update(.05);return{p,after:s.stepProgress,particles:q.particles.length};});assert.equal(idle.p,idle.after);assert.equal(idle.particles,0);
 // Full stage visual contact sheets: native render for all 78 premium stages.
 for(let index=42;index<54;index++){
  const count=await page.evaluate(async index=>{const a=window.__spa.app;await a.start(index);a.scene.frozen=true;return a.scene.level.steps.length;},index);
  for(let step=0;step<count;step++){
   if(step){await page.evaluate(()=>window.__spa.app.scene.skipStage());await page.waitForTimeout(950);}else await page.waitForTimeout(450);
   await page.evaluate(()=>{const s=window.__spa.app.scene;s.premiumRitual?.update(1);});
   await page.screenshot({path:`test-results/cleaning-audit/stage-${index}-${step}.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: all six surface masks; local dust removal; particle lifecycle; 78 premium stage captures',feedback);
}finally{await browser.close();}
