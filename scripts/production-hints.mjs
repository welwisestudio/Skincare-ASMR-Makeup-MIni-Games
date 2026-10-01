import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [], requests = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { requests.push(r.url()); if (r.status() >= 400) errors.push(r.url()); });
try {
  await page.goto('http://localhost:4173'); await page.click('#start-button');
  assert.equal(await page.evaluate(() => typeof window.__spa), 'undefined');
  await page.click('#hint-button');
  await page.screenshot({ path: 'test-results/hints/production-help.png' });
  await page.click('#help-watch'); await page.waitForFunction(() => document.getElementById('ad-complete')?.disabled === false);
  await page.click('#ad-complete'); await page.waitForSelector('#pause-button');
  await page.waitForTimeout(2500); await page.screenshot({ path: 'test-results/hints/production-demo.png' });
  await page.click('#pause-button'); await page.click('#resume-button');
  assert.ok(requests.some(url => url.endsWith('/assets/ui/hint-hand.webp')));
  assert.equal(requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== 'http://localhost:4173').length, 0);
  assert.deepEqual(errors, []);
  await writeFile('test-results/hints/production.json', JSON.stringify({ rewardedHint: true, localHandAsset: true, noDebugAPI: true, noExternalRequests: true, pauseResume: true, errors }, null, 2));
  console.log('Production rewarded hint, local artwork, pause/resume and no debug API: PASS');
} finally { await browser.close(); }
