import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/resize',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.click('#start-button');
if(process.env.WORKSHOP)await page.evaluate(async()=>{const a=window.__spa.app;a.save.purchased.push(19);await a.start(19);});
await page.evaluate(()=>{
  const a=window.__spa.app,gl=a.game.renderer.gl;window.resizeProbe={frames:0,black:0};
  a.game.events.on('postrender',()=>{
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,rgba=new Uint8Array(4);let sum=0;
    for(const [x,y] of [[8,8],[w-9,8],[8,h-9],[w-9,h-9]]){gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);sum+=rgba[0]+rgba[1]+rgba[2];}
    window.resizeProbe.frames++;if(sum<120)window.resizeProbe.black++;
  });
});
const cdp=await page.context().newCDPSession(page);let frame=0;const pending=[];
cdp.on('Page.screencastFrame',data=>{pending.push(writeFile(`test-results/resize/frame-${String(frame++).padStart(3,'0')}.jpg`,Buffer.from(data.data,'base64')));cdp.send('Page.screencastFrameAck',{sessionId:data.sessionId}).catch(()=>{});});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:65,maxWidth:600,maxHeight:500,everyNthFrame:1});
const report=[];
for(let round=0;round<2;round++)for(const [width,height,dpr] of [[1200,800,1],[960,640,1.25],[800,534,1.5],[600,400,2],[390,844,2],[844,390,2],[1440,900,1],[876,876,1],[320,480,1]]){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false});
  await page.waitForTimeout(150);
  const values=await page.evaluate(()=>{const a=window.__spa.app,s=a.scene,c=a.game.canvas;return{canvas:[c.width,c.height],ratio:a.pixelRatio,inputScale:[a.game.scale.displayScale.x,a.game.scale.displayScale.y],center:s.root.x+300*s.fit,width:s.scale.width};});
  assert.ok(Math.abs(values.center-values.width/2)<1);
  assert.ok(Math.abs(values.inputScale[0]-dpr)<.01,`Input scale mismatch: ${JSON.stringify(values)}`);
  report.push({width,height,dpr,...values});
}
await cdp.send('Page.stopScreencast');await Promise.all(pending);
const probe=await page.evaluate(()=>window.resizeProbe);assert.equal(probe.black,0);assert.deepEqual(errors,[]);
await writeFile(process.env.WORKSHOP?'test-results/resize-workshop-report.json':'test-results/resize-report.json',JSON.stringify({report,probe,compositorFrames:frame,errors},null,2));
await browser.close();console.log(JSON.stringify({probe,compositorFrames:frame,changes:report.length}));
