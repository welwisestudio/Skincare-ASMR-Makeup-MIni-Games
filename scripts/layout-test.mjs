import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
for(const [width,height] of [[320,480],[320,568],[390,844],[430,932],[768,1024],[1440,900],[2560,1440],[844,390],[667,375],[568,320],[480,320],[320,240]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}x${height}`);
  for(const button of await page.locator('.ui-hit').all()){const b=await button.boundingBox();assert.ok(b.x>=-1&&b.x+b.width<=width+1&&b.y>=-1&&b.y+b.height<=height+1,`${await button.getAttribute('id')} outside ${width}x${height}: ${JSON.stringify(b)}`);}
  await page.screenshot({path:`test-results/layout-${width}x${height}.png`});
  console.log(`${width}x${height} PASS`);
}
await browser.close();
