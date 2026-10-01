import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[],external=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4173'))external.push(r.url());});
try{
 await p.goto('http://localhost:4173');await p.waitForSelector('#start-button');assert.equal(await p.evaluate(()=>typeof window.__spa),'undefined');
 for(let index=54;index<58;index++){
  for(let n=0;n<12&&!await p.locator(`#level-card-${index}`).count();n++)await p.click('#album-next');
  const card=p.locator(`#level-card-${index}`);assert.ok(!(await card.getAttribute('aria-label')).includes('buy'));
  await card.click();await p.waitForSelector('#pause-button');await p.waitForTimeout(500);assert.match(await p.locator('#game-status').textContent(),/dress/i);
  assert.equal(await p.locator('#premium-watch').count(),0);assert.equal(await p.locator('#coin-count').textContent(),'0');
  await p.screenshot({path:`test-results/dressup-expansion/production-${index}.png`});
  await p.click('#pause-button');await p.click('#resume-button');await p.click('#home-button');await p.waitForSelector('#album-next');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: compiled build, all four levels free on a fresh save, no paywall/payment, local assets, pause/resume/exit');
}finally{await b.close();}
