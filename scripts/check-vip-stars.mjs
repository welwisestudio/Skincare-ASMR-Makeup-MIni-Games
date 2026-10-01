import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
const p=await b.newPage();await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);a.save.premiumSkipped=[];for(let i=42;i<54;i++)a.save.stars[i]=3;});
fs.mkdirSync('test-results/vip-stars',{recursive:true});
for(const [width,height] of [[390,844],[1703,820]]) {
 await p.setViewportSize({width,height});await p.waitForTimeout(200);
 const reports=await p.evaluate(()=>{const a=window.__spa.app,u=a.ui,reports=[];for(let page=0;page<12;page++){a.albumPage=page;u.render(true);for(const g of u.root.list){if(!g.list?.some(o=>o.texture?.key==='ui-vip-frame'))continue;const stars=g.list.filter(o=>o.texture?.key==='ui-star');if(stars.length===3){const frame=g.list.find(o=>o.texture?.key==='ui-vip-frame');reports.push({center:(stars[0].x+stars[2].x)/2,frame:frame.x,y:stars.map(s=>s.y)});}}}a.albumPage=4;u.render(true);return reports;});
 assert.equal(reports.length,12);for(const r of reports){assert.equal(r.center,r.frame);assert.ok(r.y.every(y=>y===r.y[0]));}
 await p.waitForTimeout(500);await p.screenshot({path:`test-results/vip-stars/${width}.png`});
}
console.log('PASS: all 12 VIP star rows centered, phone and desktop');
} finally {await b.close();}
