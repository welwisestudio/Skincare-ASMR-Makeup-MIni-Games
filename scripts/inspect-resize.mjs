import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');await page.click('#start-button');
for(const [width,height] of [[1440,1000],[390,844],[844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(650);
  console.log(await page.evaluate(()=>{const a=window.__spa.app,c=a.game.canvas,r=a.game.renderer;return{viewport:[innerWidth,innerHeight],canvas:[c.width,c.height,c.style.width,c.style.height],renderer:[r.width,r.height],scale:[a.game.scale.width,a.game.scale.height],camera:[a.ui.cameras.main.width,a.ui.cameras.main.height],layout:a.ui.layout};}));
}
await browser.close();
