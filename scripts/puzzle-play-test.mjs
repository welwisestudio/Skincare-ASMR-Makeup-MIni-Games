import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {LEVELS} from '../src/levels.js';
const out='test-results/puzzles';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});const errors=[],completed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{const a=window.__spa.app;a.save.purchased=Array.from({length:31},(_,i)=>i+1);a.save.hints=8;a.save.skips=5;a.audio.enabled=false;});
 const screen=async(x,y)=>page.evaluate(({x,y})=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+x*s.fit)/a.pixelRatio,y:(s.root.y+y*s.fit)/a.pixelRatio};},{x,y});
 const tap=async(x,y)=>{const p=await screen(x,y);await page.mouse.click(p.x,p.y);};
 const begin=async i=>{await page.evaluate(i=>window.__spa.app.start(i),i);await page.waitForTimeout(120);};
 const result=async i=>{await page.waitForSelector('#card-earned-continue',{timeout:18000});await page.click('#card-earned-continue');await page.waitForSelector('#next-button');assert.equal(await page.evaluate(i=>window.__spa.app.save.stars[i],i),3);completed.push(i+1);await page.screenshot({path:`${out}/won-${i+1}.png`});};
 const draw=async points=>{let p=await screen(...points[0]);await page.mouse.move(p.x,p.y);await page.mouse.down();for(const point of points.slice(1)){p=await screen(...point);await page.mouse.move(p.x,p.y,{steps:18});}await page.mouse.up();};
 // Each authored solution is drawn through real browser pointer events.
 for(let i=20;i<24;i++){
  await begin(i);const path=await page.evaluate(()=>window.__spa.app.scene.puzzle.config.solution);
  await draw(path);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.status),'surviving');
  await page.waitForTimeout(1800);await page.screenshot({path:`${out}/swarm-${i+1}.png`});
  if(i===20){await page.click('#pause-button');const time=await page.evaluate(()=>window.__spa.app.scene.puzzle.survived);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.survived),time);await page.click('#resume-button');}
  await result(i);
 }
 // Five authored differences per scene; repeated and incorrect taps do not count.
 for(let i=24;i<28;i++){
  await begin(i);await tap(300,200);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.found.length),0);
  for(let j=0;j<5;j++){
   const target=await page.evaluate(j=>{const q=window.__spa.app.scene.puzzle,p=q.panels[j%2],v=q.diff.points[j];return{x:p.g.x+(v[0]-.5)*540,y:p.g.y+(v[1]-.5)*405};},j);
   await tap(target.x,target.y);if(j===0){await tap(target.x,target.y);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.found.length),1);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);}
  }
  await result(i);await page.setViewportSize({width:390,height:844});
 }
 // Memo: mismatch closes, pairs stay matched, decks can be solved on touch too.
 const cdp=await page.context().newCDPSession(page);
 for(let i=28;i<32;i++){
  await begin(i);
  if(i===28){const pair=await page.evaluate(()=>{const c=window.__spa.app.scene.puzzle.cards;return[c[0],c.find(v=>v.pair!==c[0].pair)].map(v=>({x:v.x,y:v.y}));});await tap(pair[0].x,pair[0].y);await page.waitForTimeout(320);await tap(pair[1].x,pair[1].y);await page.waitForTimeout(1450);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.cards.filter(c=>c.open).length),0);assert.equal(await page.evaluate(()=>window.__spa.app.scene.puzzle.matchCount),0);}
  const pairs=await page.evaluate(()=>{const c=window.__spa.app.scene.puzzle.cards;return [...new Set(c.map(v=>v.pair))].map(pair=>c.filter(v=>v.pair===pair).map(v=>({x:v.x,y:v.y})));});
  for(const pair of pairs)for(const v of pair){
   if(i===31){const t=await screen(v.x,v.y);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...t,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
   else await tap(v.x,v.y);
   await page.waitForFunction(()=>!window.__spa.app.scene.puzzle.busy);await page.waitForTimeout(30);
  }
  await result(i);
 }
 // Back to the old games and the new partial album page must remain valid.
 await page.evaluate(()=>window.__spa.app.start(0));assert.equal(await page.evaluate(()=>!!window.__spa.app.scene.puzzle),false);
 await page.evaluate(()=>window.__spa.app.start(5));assert.ok(await page.evaluate(()=>!!window.__spa.app.scene.workshop));
 await page.evaluate(last=>{const a=window.__spa.app;a.welcome();a.albumPage=last;a.ui.render(false);},Math.ceil(LEVELS.length/5)-1);
 assert.equal(await page.locator('.level-card').count(),LEVELS.length%5||5);assert.equal(await page.locator('.collection-card').count(),1);await page.screenshot({path:`out/final-album.png`.replace('out/',out+'/')});
 assert.deepEqual(errors,[]);await writeFile(`${out}/play-report.json`,JSON.stringify({completed,realMouseAndTouch:true,rescuePause:true,differenceResize:true,memoMismatch:true,partialAlbum:true,errors},null,2));console.log('All 12 puzzle levels completed with real pointer/touch input:',completed);
}finally{await browser.close();}
