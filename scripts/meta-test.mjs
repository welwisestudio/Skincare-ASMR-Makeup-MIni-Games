import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/meta-flow',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],steps=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
const state=()=>page.evaluate(()=>({save:JSON.parse(JSON.stringify(window.__spa.app.save)),mode:window.__spa.app.ui.mode,stage:window.__spa.app.scene.stepIndex,paused:window.__spa.app.scene.frozen,elapsed:window.__spa.app.scene.elapsed}));
const shot=async name=>{await page.waitForTimeout(600);await page.screenshot({path:`test-results/meta-flow/${name}.png`});steps.push(name);};
async function ad(button){await page.click(button);await page.waitForSelector('#ad-complete');assert.equal(await page.isDisabled('#ad-complete'),true);await page.waitForFunction(()=>!document.getElementById('ad-complete')?.disabled);await page.click('#ad-complete');}
async function collect(){await page.waitForSelector('#reward-continue');await page.waitForTimeout(650);await page.click('#reward-continue');}
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
// Daily claims are real grants and cannot be repeated after reload.
await page.click('#menu-daily');await shot('daily-ready');await page.click('#daily-claim');assert.equal((await state()).save.coins,100);await collect();assert.equal(await page.isDisabled('#daily-claim'),true);
await page.reload();await page.waitForSelector('#start-button');await page.click('#menu-daily');assert.equal(await page.isDisabled('#daily-claim'),true);await page.click('#meta-close');
await page.click('#start-button');await page.click('#wardrobe-button');await ad('#item-bow');await shot('item-reward');await collect();assert.equal((await state()).save.passAds,1);assert.ok((await state()).save.items.includes('bow'));await page.click('#meta-close');
assert.equal(await page.evaluate(()=>window.__spa.app.scene.accessory.visible),true);
// Cancellation restores the frozen stage and grants neither action nor pass progress.
await page.click('#hint-button');const before=await state();await page.click('#help-watch');await page.waitForTimeout(200);await page.click('#ad-cancel');assert.equal((await state()).save.passAds,1);assert.deepEqual((await state()).save,before.save);assert.equal((await state()).elapsed,before.elapsed);
await ad('#help-watch');await page.waitForSelector('#pause-button');assert.equal(await page.evaluate(()=>window.__spa.app.scene.usedHint),true);assert.equal((await state()).save.passAds,2);
await page.click('#hint-button');const hints=(await state()).save.hints;await page.click('#help-use');assert.equal((await state()).save.hints,hints-1);assert.equal((await state()).save.passAds,2);
// Four rewarded skips exercise every first-ritual stage and earn a real result.
for(let i=0;i<4;i++){
 await page.click('#skip-button');assert.equal((await state()).stage,i);await ad('#help-watch');
 if(i<3)await page.waitForFunction(index=>window.__spa.app.scene.stepIndex===index+1,i);else await page.waitForSelector('#next-button');
}
assert.equal((await state()).save.stars[0],3);assert.ok((await state()).save.cards.includes('fresh'));assert.equal((await state()).save.passAds,6);await shot('earned-result');
const preX3=(await state()).save.coins;await ad('#result-x3');await shot('pass-grand-prize');assert.equal((await state()).save.passAds,7);assert.equal((await state()).save.coins,preX3+150+500);assert.ok((await state()).save.items.includes('serum'));assert.ok((await state()).save.cards.includes('royal'));await collect();assert.equal(await page.isDisabled('#result-x3'),true);
// Menu offer unlocks a permanent playable bonus mode.
await page.click('#result-offer');await ad('#mode-unlock');await page.waitForSelector('#bubble-0');await shot('bonus-bubbles');
for(let i=0;i<18;i++)await page.click(`#bubble-${i}`);await collect();await page.click('#meta-close');await page.click('#meta-close');await page.click('#result-menu');
// Wheel and box grants happen once and survive resizing during reveal.
await page.click('#menu-wheel');const coinsBeforeWheel=(await state()).save.coins;await ad('#wheel-spin');const afterSpin=await state();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.setViewportSize({width:390,height:844});await collect();assert.deepEqual((await state()).save,afterSpin.save);await page.click('#meta-close');
await page.click('#nav-rewards');await page.click('#hub-boxes');const boxes=(await state()).save.boxes;await page.click('#box-open');await page.waitForTimeout(200);await page.setViewportSize({width:876,height:876});await collect();assert.equal((await state()).save.boxes,boxes-1);await page.setViewportSize({width:390,height:844});await ad('#box-watch');await collect();assert.equal((await state()).save.boxes,boxes);await page.click('#meta-close');
await page.click('#hub-coins');const coins=(await state()).save.coins;await ad('#coins-watch');await collect();assert.equal((await state()).save.coins,coins+80);assert.equal((await state()).save.passAds,7);
await page.click('#coins-shop');await page.click('#shop-level-4');const balance=(await state()).save.coins;await page.click('#purchase-level');await collect();assert.equal((await state()).save.coins,balance-300);assert.ok((await state()).save.purchased.includes(4));await shot('purchased-ritual');
await page.reload();await page.waitForSelector('#start-button');assert.ok((await state()).save.purchased.includes(4));assert.ok((await state()).save.bonusUnlocked.includes('bubbles'));assert.equal((await state()).save.passAds,7);
await page.click('#nav-pass');assert.equal(await page.isDisabled('#pass-watch'),true);await shot('pass-complete');await page.click('#meta-close');await page.click('#nav-cards');await shot('achievement-cards');await page.click('#achievement-fresh');await shot('achievement-detail');await page.click('#meta-close');await page.click('#meta-close');
await page.click('#collection-card');await page.click('#mode-stones');await ad('#mode-unlock');await page.waitForSelector('#stone-stack');
for(let i=0;i<5;i++){await page.waitForFunction(()=>Math.abs(window.__spa.app.ui.stoneOffset)<12);await page.click('#stone-stack');await page.waitForTimeout(90);const n=await page.evaluate(()=>window.__spa.app.bonus.stacked);if(n===i)i--;}
await shot('zen-reward');await collect();
assert.deepEqual(errors,[]);await writeFile('test-results/meta-flow-report.json',JSON.stringify({steps,errors,save:(await state()).save,dailyOnce:true,cancelNoReward:true,passSeven:true,skipStages:4,tripleOnce:true,purchasePersists:true,bonusModes:2,revealResize:true},null,2));
console.log('All 12 systems: daily, item, hint, skips, wheel, boxes, cards, modes, x3, coins, purchase and 7-step pass passed.');await browser.close();
