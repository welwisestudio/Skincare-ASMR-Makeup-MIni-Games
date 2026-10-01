import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage();
try{await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');const values=[];
for(const i of [32,45,51])values.push(await p.evaluate(async i=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=[32];a.save.premiumUnlocked=[45,51];await a.start(i);const s=a.scene,r=s.romance;s.frozen=true;s.down=true;s.local={x:r.targets[0].x,y:r.targets[0].y};r.update(.2);s.down=false;return r.targets[0].v;},i));
assert.ok(values[0]>0);assert.deepEqual(values,[values[0],values[0],values[0]]);console.log('PASS: regular and both premium outfit wash rates are identical');
}finally{await b.close();}
