import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/feel',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.click('#start-button');await page.waitForTimeout(650);
await page.evaluate(()=>window.__spa.app.freeze());
for(const [name,width,height] of [['phone',390,844],['landscape',844,390],['desktop',1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  await page.evaluate(()=>{const a=window.__spa.app;a.save.stars=[3,3,3,3,0];a.save.coins=300;a.updateWallet();a.progress(.48,44);});
  await page.screenshot({path:`test-results/feel/${name}-hud.png`});
  const centered=await page.evaluate(()=>{const s=window.__spa.app.scene;return Math.abs(s.root.x+s.fit*300-s.scale.width/2)<1;});assert.ok(centered);
}
await page.setViewportSize({width:390,height:844});
for(const value of [1,10,48,100]){await page.evaluate(value=>window.__spa.app.progress(value/100,44),value);await page.waitForTimeout(50);await page.screenshot({path:`test-results/feel/progress-${value}.png`});}
await page.evaluate(()=>window.__spa.app.unfreeze());
await page.click('#pause-button');await page.waitForTimeout(750);await page.screenshot({path:'test-results/feel/pause.png'});await page.click('#resume-button');
// Effect fixtures select a stage; all interactions below use actual pointer input.
for(const [level,step,label] of [[1,3,'serum'],[0,1,'foam'],[0,2,'rinse'],[0,3,'towel'],[4,1,'blush'],[2,1,'bunny-serum']]){
  await page.evaluate(async({level,step})=>{const a=window.__spa.app;a.save.stars=[3,3,3,3,3];await a.start(level);a.scene.stepIndex=step;a.scene.nextStep();}, {level,step});
  await page.waitForTimeout(700);
  await page.screenshot({path:`test-results/feel/${label}-idle.png`});
  const p=await page.evaluate(()=>{const s=window.__spa.app.scene,t=s.targets[0]||s.grid[Math.floor(s.grid.length*.55)];return{x:(s.root.x+t.x*s.fit)/devicePixelRatio,y:(s.root.y+t.y*s.fit)/devicePixelRatio};});
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(145);await page.screenshot({path:`test-results/feel/${label}-contact.png`});
  await page.waitForTimeout(130);await page.screenshot({path:`test-results/feel/${label}-absorb.png`});
  const closed=await page.evaluate(()=>window.__spa.app.scene.feedback.open);assert.ok(closed<.1,`Eyes close during ${label}: ${closed}`);
  if(label.includes('serum'))assert.ok(await page.evaluate(()=>window.__spa.app.scene.feedback.counts.splashes>0),'Serum must land and form a puddle');
  await page.mouse.up();await page.waitForTimeout(1000);
  const open=await page.evaluate(()=>window.__spa.app.scene.feedback.open);assert.ok(open>.8,`Eyes reopen after ${label}`);
}
assert.deepEqual(errors,[]);await writeFile('test-results/feel/report.json',JSON.stringify({errors,centered:true,eyes:true},null,2));await browser.close();console.log('Centered play area, material contacts and idle/treatment eyes passed.');
