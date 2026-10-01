import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/ui-v2',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.waitForTimeout(1000);await page.screenshot({path:'test-results/ui-v2/album-mobile.png'});
await page.click('#settings-button');await page.waitForTimeout(1000);await page.screenshot({path:'test-results/ui-v2/settings-mobile.png'});await page.click('#modal-close');
await page.click('#start-button');await page.waitForTimeout(1000);await page.screenshot({path:'test-results/ui-v2/game-mobile.png'});
await page.click('#pause-button');await page.waitForTimeout(1000);await page.screenshot({path:'test-results/ui-v2/pause-mobile.png'});await page.click('#resume-button');
// Render the result layout as a visual fixture; the gameplay smoke test
// separately verifies earning this state through real player gestures.
await page.evaluate(()=>window.__spa.app.completed(0,61));await page.waitForTimeout(1200);await page.screenshot({path:'test-results/ui-v2/result-mobile.png'});
await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.screenshot({path:'test-results/ui-v2/result-landscape.png'});
await page.click('#result-menu');await page.screenshot({path:'test-results/ui-v2/album-landscape.png'});
// The smallest portrait/landscape sizes must also fit every modal action.
for(const [width,height] of [[320,480],[320,240],[768,1024],[2560,1440]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  for(const mode of ['levels','playing','pause','result','collection']){
    await page.evaluate(mode=>window.__spa.app.ui.show(mode),mode);
    for(const button of await page.locator('.ui-hit').all()){
      const b=await button.boundingBox();assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${mode}: ${await button.getAttribute('id')} outside ${width}x${height}`);
    }
  }
}
assert.deepEqual(errors,[]);console.log('Illustrated UI: screenshots and all screen action bounds PASS.');await browser.close();
