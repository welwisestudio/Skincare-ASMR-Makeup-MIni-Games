import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/romance';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
const errors=[],completed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:41},(_,i)=>i+1);a.audio.enabled=false;});
 const screen=async(x,y)=>page.evaluate(({x,y})=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+x*s.fit)/a.pixelRatio,y:(s.root.y+y*s.fit)/a.pixelRatio};},{x,y});
 const move=async(x,y)=>{const p=await screen(x,y);await page.mouse.move(p.x,p.y);};
 const tap=async(x,y)=>{const p=await screen(x,y);await page.mouse.click(p.x,p.y);};
 const drag=async(a,b)=>{await move(a.x,a.y);await page.mouse.down();for(let i=1;i<=20;i++)await move(a.x+(b.x-a.x)*i/20,a.y+(b.y-a.y)*i/20);await page.mouse.up();};
 const state=()=>page.evaluate(()=>window.__spa.app.scene.romance.debug());
 const stage=async n=>{await page.waitForFunction(n=>{const s=window.__spa.app.scene;return s.stepIndex===n&&!s.transitioning;},n,{timeout:10000});};
 const shot=async(i,label)=>{await page.waitForTimeout(280);await page.screenshot({path:`${out}/${i+1}-${label}.png`});};
 for(let i=Number(process.env.START_INDEX||32);i<Number(process.env.END_INDEX||42);i++){
  await page.evaluate(i=>window.__spa.app.start(i),i);await stage(0);await shot(i,'before');
  for(let j=0;j<5;j++){const t=(await state()).targets[j];await move(t.x,t.y);await page.mouse.down();await page.waitForFunction(j=>window.__spa.app.scene.romance.targets[j]?.done||window.__spa.app.scene.stepIndex>0,j,{timeout:6000});await page.mouse.up();}
  await stage(1);await shot(i,'clean');
  for(const path of (await state()).paths){await move(path.points[0].x,path.points[0].y);await page.mouse.down();for(const p of path.points.slice(1))await move(p.x,p.y);await page.mouse.up();}
  await stage(2);let item=(await state()).items[0];
  // A wrong drop must not equip the dress.
  await drag(item,{x:530,y:480});await page.waitForTimeout(280);assert.equal((await state()).items[0].done,false);
  await drag(item,{x:item.tx,y:item.ty});let path=(await state()).zip;assert.ok(path,'Dress placement opens the zipper mechanic');
  await move(path.points[0].x,path.points[0].y);await page.mouse.down();for(const p of path.points.slice(1))await move(p.x,p.y);await page.mouse.up();
  await stage(3);await shot(i,'dress');
  for(item of (await state()).items)await drag(item,{x:item.tx,y:item.ty});
  await stage(4);await shot(i,'compare');
  await drag({x:300,y:540},{x:45,y:540});await drag({x:45,y:540},{x:555,y:540});assert.ok((await state()).ready);await tap(300,612);
  await stage(5);await shot(i,'proposal');item=(await state()).items[0];await drag(item,{x:item.tx,y:item.ty});
  await stage(6);await tap(300,612);assert.equal(await page.evaluate(()=>window.__spa.app.scene.stepProgress),0,'Wedding cannot be dismissed before its reveal');
  for(const h of (await state()).hearts)await tap(h.x,h.y);
  await page.waitForTimeout(3200);await shot(i,'wedding');await tap(300,612);
  await page.waitForSelector('#card-earned-continue',{timeout:10000});await page.click('#card-earned-continue');await page.waitForSelector('#next-button');
  assert.equal(await page.evaluate(i=>window.__spa.app.save.stars[i],i),3);await shot(i,'result');completed.push(i+1);console.log('Completed romance',i+1);
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/play-${process.env.START_INDEX||32}.json`,JSON.stringify({completed,realPointer:true,wrongDrop:true,zipper:true,comparison:true,proposal:true,wedding:true,errors},null,2));
}finally{await browser.close();}
