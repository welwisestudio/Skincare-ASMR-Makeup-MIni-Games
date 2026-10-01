import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:390,height:844}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args);};});
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.waitForTimeout(650);await p.click('#settings-button');await p.waitForTimeout(650);await p.screenshot({path:'test-results/modal-backdrop/canvas-fallback.png'});const r=await p.evaluate(()=>({type:window.__spa.app.game.renderer.type,snapshot:!!window.__spa.app.ui.modalBackdrop}));assert.equal(r.type,1);assert.ok(r.snapshot);assert.deepEqual(errors,[]);await p.click('#resume-button');assert.equal(await p.evaluate(()=>!!window.__spa.app.ui.modalBackdrop),false);console.log('Canvas fallback: PASS');await b.close();
