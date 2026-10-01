import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LEVELS,LEVEL_ORDER} from '../src/levels.js';
import {freshSave,normalizeSave,unlocked} from '../src/save.js';
import {LEVEL_PRICES,CARDS} from '../src/meta-content.js';
import {CAMPAIGN_CARD_IDS} from '../src/workshop-levels.js';
const indices=[54,55,56,57];
assert.equal(LEVELS.length,58);assert.equal(CARDS.length,61);assert.equal(CAMPAIGN_CARD_IDS.length,58);
assert.deepEqual(LEVEL_ORDER.slice(-4),indices);
for(const i of indices){assert.ok(unlocked(freshSave(),i));assert.equal(LEVEL_PRICES[i],0);assert.ok(!LEVELS[i].premium);assert.equal(CAMPAIGN_CARD_IDS[i],LEVELS[i].id);}
const old={...freshSave(),stars:Array(54).fill(3),coins:3542,premiumUnlocked:[43],premiumSkipped:[42],cards:['fresh']},migrated=normalizeSave(old);
assert.deepEqual(migrated.stars.slice(0,54),old.stars);assert.deepEqual(migrated.stars.slice(54),[0,0,0,0]);assert.equal(migrated.coins,3542);assert.deepEqual(migrated.premiumSkipped,[42]);assert.deepEqual(migrated.premiumUnlocked,[43]);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:454,height:886},hasTouch:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
fs.mkdirSync('test-results/dressup-expansion',{recursive:true});
try{
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
 await page.evaluate(()=>{window.__spa.app.audio.enabled=false;});
 const screen=p=>page.evaluate(p=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+p.x*s.fit)/a.pixelRatio,y:(s.root.y+p.y*s.fit)/a.pixelRatio};},p);
 const drag=async (item,to,touch=false)=>{const from=await screen({x:item.x,y:item.y}),end=await screen(to);
  if(touch){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let n=1;n<=8;n++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(end.x-from.x)*n/8,y:from.y+(end.y-from.y)*n/8}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
  else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();}
 };
 for(const index of indices){
  await page.evaluate(async index=>{await window.__spa.app.start(index);},index);await page.waitForTimeout(550);
  assert.equal(await page.evaluate(()=>window.__spa.app.state),'playing');
  assert.equal(await page.evaluate(()=>window.__spa.app.save.coins),75*(index-54));
  const first=await page.evaluate(()=>window.__spa.app.scene.workshop.debug().items[0]);
  await drag(first,{x:60,y:60});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__spa.app.scene.stepProgress),0);
  for(let step=0;step<3;step++){
   await page.waitForFunction(step=>window.__spa.app.scene.stepIndex===step,step);await page.waitForTimeout(500);
   await page.screenshot({path:`test-results/dressup-expansion/${index}-${step}-before.png`});
   // Alternate item order: shoes and hair clip may be placed first.
   let items=await page.evaluate(()=>window.__spa.app.scene.workshop.debug().items);if(index%2)items.reverse();
   for(let n=0;n<items.length;n++){
    const item=items[n];await drag(item,{x:item.tx,y:item.ty},index===56);await page.waitForTimeout(350);
    if(n===0&&items.length===2){const partial=await page.evaluate(()=>{const s=window.__spa.app.scene;return{progress:s.stepProgress,overlays:s.workshop.placed.filter(p=>p.isCropped).length};});assert.equal(partial.progress,.5);assert.equal(partial.overlays,1);await page.screenshot({path:`test-results/dressup-expansion/${index}-${step}-partial.png`});}
   }
   if(step===2){await page.waitForTimeout(180);await page.screenshot({path:`test-results/dressup-expansion/${index}-finished.png`});}
  }
  await page.waitForFunction(()=>window.__spa.app.state==='result');
  assert.equal(await page.evaluate(index=>window.__spa.app.save.stars[index],index),3);
  assert.ok(await page.evaluate(index=>window.__spa.app.save.cards.includes(window.__spa.app.scene.level.id),index));
  assert.equal(await page.evaluate(()=>window.__spa.app.scene.workshop.hero.texture.key),`ui-${LEVELS[index].hero}`);
 }
 // Menu registration, free access on a fresh save, and responsive layouts.
 for(const viewport of [{width:390,height:844},{width:1703,height:820}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{const a=window.__spa.app;a.welcome();a.albumPage=11;a.ui.render(true);});await page.waitForTimeout(400);
  for(const i of [55,56,57]){const card=page.locator(`#level-card-${i}`);assert.ok(await card.count());assert.ok(!(await card.getAttribute('aria-label')).includes('buy'));}
  await page.screenshot({path:`test-results/dressup-expansion/menu-${viewport.width}.png`});
 }
 await page.reload();await page.waitForSelector('#start-button');const stars=await page.evaluate(()=>window.__spa.app.save.stars.slice(54));assert.deepEqual(stars,[3,3,3,3]);assert.deepEqual(errors,[]);
 console.log('PASS: four free levels, 20 correct placements, wrong-drop rejection, both item orders, visible partial outfits, touch/mouse, 4 rewards/cards, save migration/reload, phone/desktop menu');
}finally{await browser.close();}
