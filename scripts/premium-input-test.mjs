import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:454,height:886},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);a.save.premiumSkipped=[];});
const screen=async point=>p.evaluate(point=>{const a=window.__spa.app,s=a.scene;return{x:(s.root.x+point.x*s.fit)/a.pixelRatio,y:(s.root.y+point.y*s.fit)/a.pixelRatio};},point);
const drag=async(from,to,via)=>{const a=await screen(from),z=await screen(to);await p.mouse.move(a.x,a.y);await p.mouse.down();if(via){const q=await screen(via);await p.mouse.move(q.x,q.y,{steps:5});}await p.mouse.move(z.x,z.y,{steps:5});await p.mouse.up();};
await p.evaluate(async()=>{const a=window.__spa.app;await a.start(42);});
// Actual pointer lifecycle, including returning a misplaced piece of litter.
let litter=await p.evaluate(()=>window.__spa.app.scene.premiumRitual.litter.map(t=>({...t})));
await drag(litter[0],{x:60,y:200});assert.equal(await p.evaluate(()=>window.__spa.app.scene.stepProgress),0);
for(let i=0;i<10;i++){const t=await p.evaluate(()=>window.__spa.app.scene.premiumRitual.mode==='pickup'?window.__spa.app.scene.premiumRitual.litter.find(t=>!t.done):null);if(!t)break;await drag(t,{x:470,y:590});}
await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===1);
const crumbs=await p.evaluate(()=>window.__spa.app.scene.premiumRitual.crumbs.map(t=>({...t})));
for(const t of crumbs){if(await p.evaluate(()=>window.__spa.app.scene.transitioning))break;await drag({x:t.x-20,y:t.y},{x:t.x+20,y:t.y});}
for(let pass=0;pass<3;pass++){const cells=await p.evaluate(()=>{const q=window.__spa.app.scene.premiumRitual;return q.mode==='vacuum'?q.cells.filter(t=>t.v<.99).filter((_,i)=>i%8===0):[];});for(const t of cells){if(await p.evaluate(()=>window.__spa.app.scene.transitioning||window.__spa.app.scene.stepIndex!==1))break;await drag({x:t.x-20,y:t.y},{x:t.x+20,y:t.y});}}
await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===2);
// Touch motion paints a local trail; one untouched point remains transparent.
const client=await p.context().newCDPSession(p),from=await screen({x:150,y:250}),to=await screen({x:200,y:350});
await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]});
for(let i=1;i<=12;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});
await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const foam=await p.evaluate(()=>{const s=window.__spa.app.scene,c=s.premiumRitual.foam.getContext('2d');return{progress:s.stepProgress,touched:c.getImageData(178,308,1,1).data[3],untouched:c.getImageData(420,260,1,1).data[3],held:s.premiumRitual.held,pointer:s.pointerId}});
assert.ok(foam.progress>0&&foam.progress<.5);assert.ok(foam.touched>50);assert.equal(foam.untouched,0);assert.equal(foam.held,false);assert.equal(foam.pointer,null);
await p.waitForTimeout(400);await p.screenshot({path:'test-results/premium-redesign/foam-touch.png'});
// Play shopping -> scanner -> packing through real pointer events and normal stage transitions.
await p.evaluate(async()=>{await window.__spa.app.start(44);});
for(let category=0;category<4;category++){
 const t=await p.evaluate(category=>window.__spa.app.scene.premiumRitual.items.filter(t=>t.category===category).sort((a,b)=>a.price-b.price)[0],category);await drag(t,{x:300,y:512});
}
await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===1);
for(let i=3;i>=0;i--){const t=await p.evaluate(i=>window.__spa.app.scene.premiumRitual.items[i],i);await drag(t,{x:465,y:550},{x:300,y:330});}
for(let pass=0;pass<3;pass++){const cells=await p.evaluate(()=>{const q=window.__spa.app.scene.premiumRitual;return q.mode==='vacuum'?q.cells.filter(t=>t.v<.99).filter((_,i)=>i%8===0):[];});for(const t of cells){if(await p.evaluate(()=>window.__spa.app.scene.transitioning||window.__spa.app.scene.stepIndex!==1))break;await drag({x:t.x-20,y:t.y},{x:t.x+20,y:t.y});}}
await p.waitForFunction(()=>window.__spa.app.scene.stepIndex===2);await p.waitForTimeout(300);await p.screenshot({path:'test-results/premium-redesign/packing.png'});
for(let i=3;i>=0;i--){const t=await p.evaluate(i=>window.__spa.app.scene.premiumRitual.items[i],i);await drag(t,t.target);}
await p.waitForFunction(()=>window.__spa.app.state==='result');assert.equal(await p.evaluate(()=>window.__spa.app.save.stars[44]),3);assert.ok(await p.evaluate(()=>window.__spa.app.save.cards.includes('vip-perfume')));
for(const [width,height,name] of [[320,480,'small'],[1245,880,'desktop']]){
 await p.setViewportSize({width,height});await p.waitForTimeout(350);await p.evaluate(()=>window.__spa.app.offerPremium(53));await p.waitForTimeout(300);
 const boxes=await p.locator('#premium-watch').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));for(const r of boxes)assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1);
 await p.click('#meta-close');await p.evaluate(async()=>{await window.__spa.app.start(43);});await p.waitForTimeout(400);await p.screenshot({path:`test-results/premium-redesign/rug-${name}.png`});
}
assert.deepEqual(errors,[]);console.log('PASS: mouse litter/vacuum, real touch foam coverage, full shopping completion and reward, small/desktop layout');
}finally{await b.close();}
