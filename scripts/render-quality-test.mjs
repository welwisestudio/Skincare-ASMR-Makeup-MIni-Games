import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/render-quality',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[];
try{
for(const dpr of [1,1.25,2,3])for(const port of [5173,4173]){
const p=await b.newPage({viewport:{width:393,height:885},deviceScaleFactor:dpr,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:'+port);await p.waitForSelector('#start-button');
const check=async()=>{const data=await p.evaluate(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl')||c.getContext('webgl2'),a=window.__spa?.app;return{filter:getComputedStyle(c).imageRendering,aa:gl.getContextAttributes().antialias,width:c.width,height:c.height,cssWidth:c.getBoundingClientRect().width,cssHeight:c.getBoundingClientRect().height,config:a?{pixelArt:a.game.config.pixelArt,antialias:a.game.config.antialias,roundPixels:a.game.config.roundPixels}:null};});assert.equal(data.filter,'auto');assert.equal(data.aa,true);assert.equal(data.width,Math.round(data.cssWidth*Math.min(dpr,2)));if(data.config)assert.deepEqual(data.config,{pixelArt:false,antialias:true,roundPixels:false});};
await check();if(dpr===2)await p.screenshot({path:`test-results/render-quality/${port}-mobile.png`});
await p.setViewportSize({width:1280,height:720});await p.waitForTimeout(300);await check();
await p.click('#settings-button');await p.waitForTimeout(250);await p.click('#modal-close');assert.ok(await p.locator('#start-button').isVisible());
console.log(`PASS ${port===5173?'dev':'build'} DPR ${dpr}, smoothing, canvas dimensions, resize, button alignment`);await p.close();
}
assert.deepEqual(errors,[]);
}finally{await b.close();}
