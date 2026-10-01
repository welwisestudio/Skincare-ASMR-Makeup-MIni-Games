import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const out='test-results/hair-continuous';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:454,height:886},hasTouch:true}),errors=[],completed=[];
page.on('pageerror',e=>errors.push(e.message));
const screen=point=>page.evaluate(p=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+p.x*s.fit)/a.pixelRatio,y:(s.root.y+p.y*s.fit)/a.pixelRatio};},point);
const move=async point=>{const p=await screen(point);await page.mouse.move(p.x,p.y);};
const begin=async i=>{await page.evaluate(async i=>{const a=window.__spa.app;await a.start(i);a.scene.stepIndex=1;a.scene.nextStep();},i);await page.waitForTimeout(120);};
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:42},(_,i)=>i);a.audio.enabled=false;});
 for(let i=32;i<42;i++){
  await page.setViewportSize(i%2?{width:844,height:390}:{width:454,height:886});await begin(i);
  const paths=await page.evaluate(()=>window.__spa.app.scene.romance.debug().paths);
  // Hover does nothing. A press outside the path can enter it later.
  await move(paths[0].points[0]);await move(paths[0].points.at(-1));
  assert.equal(await page.evaluate(()=>window.__spa.app.scene.stepProgress),0);
  await move({x:490,y:400});await page.mouse.down();
  for(let j=0;j<paths.length;j++){
   for(let k=0;k<paths[j].points.length;k++){
    await move(paths[j].points[k]);
    if(j===0&&k===4){
     // Leaving the strand does not require releasing to pick it up again.
     await move({x:450,y:350});await move(paths[j].points[k]);
    }
   }
   if(j<paths.length-1){
    assert.ok(await page.evaluate(j=>window.__spa.app.scene.romance.paths[j].done,j));
    assert.ok(await page.evaluate(()=>window.__spa.app.scene.down));
   }
  }
  await page.waitForFunction(()=>window.__spa.app.scene.stepIndex===2&&!window.__spa.app.scene.transitioning);
  await page.mouse.up();completed.push(i+1);
 }
 // A single finger gesture can also complete all three strands.
 await page.setViewportSize({width:454,height:886});await begin(32);
 const cdp=await page.context().newCDPSession(page),paths=await page.evaluate(()=>window.__spa.app.scene.romance.debug().paths),start=await screen({x:480,y:400});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
 for(const path of paths)for(const point of path.points){const p=await screen(point);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(()=>window.__spa.app.scene.stepIndex===2&&!window.__spa.app.scene.transitioning);
 // Dress zipper still requires its own press and follows its existing route.
 const item=await page.evaluate(()=>window.__spa.app.scene.romance.debug().items[0]);
 await move(item);await page.mouse.down();await move({x:item.tx,y:item.ty});await page.mouse.up();
 const zip=await page.evaluate(()=>window.__spa.app.scene.romance.debug().zip);assert.ok(zip);
 await move(zip.points[0]);await move(zip.points.at(-1));assert.equal(await page.evaluate(()=>window.__spa.app.scene.romance.zip.index),0);
 await move(zip.points[0]);await page.mouse.down();for(const p of zip.points.slice(1))await move(p);await page.mouse.up();
 await page.waitForFunction(()=>window.__spa.app.scene.stepIndex===3&&!window.__spa.app.scene.transitioning);
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/report.json`,JSON.stringify({completed,singleMousePress:true,startOutside:true,reentry:true,noHoverProgress:true,singleTouchGesture:true,zipper:true,errors},null,2));
 console.log('PASS: 10 hairstyles with one press, re-entry, hover guard, one-finger gesture and zipper regression');
}finally{await browser.close();}
