import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/ui-navigation',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:393,height:885},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
await p.mouse.move(160,350);await p.mouse.down();await p.mouse.move(65,350,{steps:8});await p.mouse.up();
assert.equal(await p.evaluate(()=>window.__spa.app.albumPage),1);assert.equal(await p.evaluate(()=>window.__spa.app.ui.mode),'levels');
await p.waitForTimeout(550);
const cdp=await p.context().newCDPSession(p);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:85,y:350}]});
for(let x=105;x<=225;x+=20)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:350}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.equal(await p.evaluate(()=>window.__spa.app.albumPage),0);assert.equal(await p.evaluate(()=>window.__spa.app.ui.mode),'levels');
await p.setViewportSize({width:1703,height:820});await p.waitForTimeout(600);
const layout=await p.evaluate(()=>window.__spa.app.ui.layout);assert.equal(layout.x,0);assert.equal(layout.y,0);
await p.screenshot({path:'test-results/ui-navigation/menu-desktop.png'});
await p.click('#settings-button');await p.waitForTimeout(750);await p.screenshot({path:'test-results/ui-navigation/pause-desktop.png'});await p.click('#modal-close');
for(let index=32;index<42;index++){
await p.evaluate(async index=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=Array.from({length:42},(_,i)=>i);await a.start(index);a.scene.stepIndex=4;a.scene.nextStep();},index);
assert.deepEqual(await p.evaluate(()=>window.__spa.app.scene.romance.hintPlan().points.map(p=>p.x)),[300,532.5]);
assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.actionButton.visible),false);
await p.evaluate(()=>window.__spa.app.scene.romance.slide({x:525}));
assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.ready),false);
await p.evaluate(()=>window.__spa.app.scene.romance.slide({x:532.5}));
assert.ok(await p.evaluate(()=>{const r=window.__spa.app.scene.romance;return r.ready&&r.actionButton.visible&&r.slider===1;}));
await p.evaluate(()=>window.__spa.app.scene.romance.slide({x:400}));assert.equal(await p.evaluate(()=>window.__spa.app.scene.romance.actionButton.visible),false);
}
await p.setViewportSize({width:393,height:885});await p.waitForTimeout(250);await p.click('#pause-button');await p.waitForTimeout(750);await p.screenshot({path:'test-results/ui-navigation/pause-mobile.png'});
await p.evaluate(()=>{const a=window.__spa.app;a.chestReveal={started:performance.now()-5000,rewards:[{coins:200},{hints:3},{skips:2}],opened:true,ready:true};a.openMeta('chest-reveal');});await p.waitForTimeout(200);await p.screenshot({path:'test-results/ui-navigation/chest-mobile.png'});
assert.deepEqual(errors,[]);console.log('PASS: mouse/touch swipes without accidental launch, desktop edge anchors, all 10 princesses reveal right only and gate action, pause and chest layout');
}finally{await b.close();}
