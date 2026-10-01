import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'test-results/hints';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errors = [], coverage = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(r.url()); });
await page.goto('http://localhost:5173');
await page.waitForSelector('#start-button');
await page.evaluate(() => { window.__spa.app.save.purchased = Array.from({ length: 19 }, (_, i) => i + 1); });
const state = () => page.evaluate(() => window.__spa.getState());
async function fixture(level, step) {
  await page.evaluate(({ level, step }) => {
    const a = window.__spa.app;
    a.unfreeze(); a.modalName = null; a.metaStack = []; a.state = 'playing';
    a.scene.begin(level); a.scene.stepIndex = step; a.scene.nextStep(true);
    a.ui.show('playing'); a.scene.hint();
  }, { level, step });
}

// Every authored stage gets a finite, mechanic-specific demonstration.
for (let level = 0; level < 20; level++) {
  const count = await page.evaluate(async level => (await import('/src/levels.js')).LEVELS[level].steps.length, level);
  for (let step = 0; step < count; step++) {
    await fixture(level, step);
    const result = await page.evaluate(() => {
      const s = window.__spa.app.scene, h = s.gestureHint;
      const before = JSON.stringify({ progress: s.stepProgress, workshop: s.workshop?.debug(), grid: s.grid, targets: s.targets, patches: s.patches });
      const positions = [];
      for (let n = 0; n < 110; n++) { h.update(.05); positions.push({ ...h.position }); }
      const after = JSON.stringify({ progress: s.stepProgress, workshop: s.workshop?.debug(), grid: s.grid, targets: s.targets, patches: s.patches });
      return { ...h.debug(), unchanged: before === after, positions, usedHint: s.usedHint, interactive: !!h.hand.input || !!h.root.input };
    });
    assert.ok(result.active, `L${level + 1} S${step + 1} missing hint`);
    assert.ok(result.unchanged, `L${level + 1} S${step + 1} hint mutated gameplay`);
    assert.ok(result.usedHint); assert.equal(result.interactive, false);
    assert.ok(result.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 600 && p.y >= 0 && p.y <= 600));
    if (!['hold', 'pour', 'tap', 'timing'].includes(result.kind)) assert.ok(result.positions.some(p => Math.hypot(p.x - result.positions[0].x, p.y - result.positions[0].y) > 10), `Stationary ${result.kind}`);
    coverage.push({ level: level + 1, step: step + 1, kind: result.kind, points: result.points.length });
  }
}

// Real elapsed frames animate a hand, while real pointer input dismisses it and still plays.
await fixture(0, 0);
await page.waitForTimeout(800); const first = (await state()).gestureHint;
await page.waitForTimeout(550); const second = (await state()).gestureHint;
assert.ok(Math.hypot(second.position.x - first.position.x, second.position.y - first.position.y) > 3);
let s = await state(), p = s.gestureHint.points[0];
const cdp = await page.context().newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.offset.x + p.x * s.fit, y: s.offset.y + p.y * s.fit, id: 1 }] });
await page.waitForTimeout(250);
assert.equal((await state()).gestureHint.active, false);
assert.ok((await state()).progress > 0);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

// Ask again after partial progress: completed areas/items and paths are not demonstrated.
await fixture(19, 0);
await page.evaluate(() => { const s = window.__spa.app.scene; s.workshop.items[0].done = true; s.hint(); });
assert.equal((await state()).gestureHint.points[0].x, (await state()).workshop.items[1].x);
await fixture(5, 0);
await page.evaluate(() => { const s = window.__spa.app.scene; s.workshop.paths[0].index = 5; s.hint(); });
s = await state(); assert.deepEqual(s.gestureHint.points[0], s.workshop.paths[0].points[5]);
await fixture(19, 2);
await page.evaluate(() => { const s = window.__spa.app.scene; s.workshop.items.forEach(i => i.done = true); s.workshop.zip = { points: [{ x: 146, y: 133 }, { x: 453, y: 133 }, { x: 453, y: 435 }], index: 1 }; s.hint(); });
assert.equal((await state()).gestureHint.kind, 'trace');
assert.equal((await state()).gestureHint.points[0].x, 453);

// Inventory, pause, resize, restart and stage changes share one hint lifecycle.
await fixture(19, 0);
await page.evaluate(() => { window.__spa.app.scene.gestureHint.stop(); window.__spa.app.save.hints = 3; });
await page.click('#hint-button'); await page.click('#help-use');
assert.equal(await page.evaluate(() => window.__spa.app.save.hints), 2);
assert.equal((await state()).gestureHint.active, true);
await page.click('#pause-button'); const clock = (await state()).gestureHint.clock;
await page.waitForTimeout(200); assert.equal((await state()).gestureHint.clock, clock);
await page.click('#resume-button');
await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
assert.equal((await state()).gestureHint.active, true);
await page.click('#pause-button'); await page.click('#restart-button');
assert.equal((await state()).gestureHint.active, false);
await page.evaluate(() => { const s = window.__spa.app.scene; s.hint(); s.skipStage(); });
assert.equal((await state()).gestureHint.active, false);
await page.waitForTimeout(850); assert.equal((await state()).step, 1);

// Visual fixtures include every gesture family, at phone and landscape sizes.
const examples = [[0, 0, 'wipe'], [0, 3, 'hold'], [1, 2, 'peel'], [2, 2, 'patch'], [5, 0, 'trace'], [5, 2, 'braid'], [6, 0, 'dress'], [8, 1, 'makeup'], [10, 0, 'sort'], [15, 0, 'pour'], [15, 2, 'timing'], [16, 1, 'wax'], [18, 0, 'tap'], [18, 1, 'circle'], [19, 0, 'rotate']];
for (const [width, height] of [[390, 844], [844, 390]]) {
  await page.setViewportSize({ width, height });
  for (const [level, step, name] of examples) {
    await fixture(level, step);
    await page.waitForTimeout(name === 'rotate' ? 2400 : 1350);
    await page.screenshot({ path: `${out}/${width}-${name}.png` });
    const bounds = await page.evaluate(() => {
      const a = window.__spa.app, h = a.scene.gestureHint, rect = h.hand.getBounds();
      const hint = a.ui.stepHint.getBounds(), title = a.ui.stepTitle.getBounds();
      return { x: rect.x / a.pixelRatio, y: rect.y / a.pixelRatio, right: rect.right / a.pixelRatio, bottom: rect.bottom / a.pixelRatio, overlap: hint.top < title.bottom };
    });
    assert.ok(bounds.x >= -2 && bounds.y >= -2 && bounds.right <= width + 2 && bounds.bottom <= height + 2, JSON.stringify({ name, bounds, width }));
    assert.equal(bounds.overlap, false);
  }
}
assert.deepEqual(errors, []);
await writeFile(`${out}/report.json`, JSON.stringify({ coverage, stageCount: coverage.length, screenshots: examples.length * 2, noProgressMutation: true, realTouch: true, pauseResizeRestartSkip: true, errors }, null, 2));
await browser.close();
console.log(`Hint checks PASS: ${coverage.length} stages, ${examples.length * 2} screenshots, real touch, lifecycle, unchanged gameplay`);
