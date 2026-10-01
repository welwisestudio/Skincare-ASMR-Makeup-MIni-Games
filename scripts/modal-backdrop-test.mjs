import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-results/modal-backdrop';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.waitForTimeout(700);
 const stats=()=>page.evaluate(()=>{const u=window.__spa.app.ui,s=u.modalBackdrop;return{mode:u.mode,snapshot:!!s,blur:s?.postPipelines.length||0,crisp:u.root.postPipelines?.length||0,count:u.children.list.filter(x=>x.type==='RenderTexture').length};});
 const snap=async name=>{await page.waitForTimeout(650);await page.screenshot({path:`${out}/${name}.png`});};
 await page.click('#settings-button');await snap('settings');assert.deepEqual(await stats(),{mode:'pause',snapshot:true,blur:1,crisp:0,count:1});
 await page.click('#resume-button');assert.equal((await stats()).count,0);
 await page.click('#menu-daily');await page.evaluate(()=>window.firstBackdrop=window.__spa.app.ui.modalBackdrop);await snap('daily');
 await page.click('#daily-claim');await snap('daily-gift');assert.equal(await page.evaluate(()=>window.firstBackdrop===window.__spa.app.ui.modalBackdrop),true);
 await page.click('#reward-continue');await page.click('#meta-close');assert.equal((await stats()).count,0);
 for (const [selector,name] of [['#menu-wheel','wheel'],['#nav-pass','pass'],['#nav-cards','cards']]) {
  await page.click(selector);await snap(name);assert.equal((await stats()).blur,1);await page.click('#meta-close');
 }
 await page.click('#nav-pass');await page.evaluate(()=>window.firstBackdrop=window.__spa.app.ui.modalBackdrop);await page.click('#pass-watch');await snap('ad');
 await page.click('#ad-cancel');await page.waitForSelector('#pass-watch');assert.equal(await page.evaluate(()=>window.firstBackdrop===window.__spa.app.ui.modalBackdrop),true);
 await page.click('#pass-watch');await page.waitForFunction(()=>!document.getElementById('ad-complete')?.disabled);await page.click('#ad-complete');await page.waitForSelector('#reward-continue');await snap('pass-gift');
 assert.equal(await page.evaluate(()=>window.firstBackdrop===window.__spa.app.ui.modalBackdrop),true);
 await page.click('#reward-continue');await page.click('#meta-close');await page.click('#start-button');await page.waitForTimeout(500);await page.click('#pause-button');await snap('pause');
 const elapsed=await page.evaluate(()=>window.__spa.app.scene.elapsed);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__spa.app.scene.elapsed),elapsed);
 await page.evaluate(()=>{const a=window.__spa.app,gl=a.game.renderer.gl;window.probe={frames:0,black:0};a.game.events.on('postrender',()=>{let sum=0;const p=new Uint8Array(4),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;for(const [x,y] of [[8,8],[w-9,8],[8,h-9],[w-9,h-9]]){gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);sum+=p[0]+p[1]+p[2];}window.probe.frames++;if(sum<60)window.probe.black++;});});
 for(const [width,height] of [[844,390],[320,480],[876,876],[1440,900],[390,844]]){
  await page.setViewportSize({width,height});await snap(`pause-${width}`);assert.equal((await stats()).count,1);
  const coverage=await page.evaluate(()=>{const u=window.__spa.app.ui,b=u.modalBackdrop.getBounds();return b.x<=0&&b.y<=0&&b.right>=u.scale.width-1&&b.bottom>=u.scale.height-1;});assert.ok(coverage);
 }
 await page.click('#resume-button');assert.equal((await stats()).count,0);
 for(let i=0;i<6;i++){await page.click('#pause-button');assert.equal((await stats()).count,1);await page.click('#resume-button');assert.equal((await stats()).count,0);}
 const probe=await page.evaluate(()=>window.probe);assert.equal(probe.black,0);assert.deepEqual(errors,[]);
 await writeFile(`${out}/report.json`,JSON.stringify({screens:['settings','pause','daily','daily-gift','wheel','pass','cards','ad','pass-gift'],nestedReuse:true,adCancel:true,pauseResume:true,snapshotCleanup:true,resizeProbe:probe,errors},null,2));
 console.log('Modal blur, crisp UI, nested rewards, ad cancellation, snapshot cleanup and five viewport resizes: PASS',probe);
} finally {await browser.close();}
