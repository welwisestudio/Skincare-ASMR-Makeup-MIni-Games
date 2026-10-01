import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [], report = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:5173'); await page.waitForSelector('#start-button');
try {
  for (const [level, step] of [[0, 0], [0, 3], [1, 2], [2, 2], [2, 4], [3, 1], [5, 0], [5, 2], [7, 0], [8, 0], [15, 0], [15, 2], [16, 0], [16, 1], [18, 0], [18, 1], [18, 2], [19, 0]]) {
    const demo = await page.evaluate(({ level, step }) => {
      const a = window.__spa.app;
      a.unfreeze(); a.state = 'playing'; a.modalName = null;
      a.scene.begin(level); a.scene.stepIndex = step; a.scene.nextStep(true); a.ui.show('playing'); a.scene.hint();
      const h = a.scene.gestureHint, state = a.scene.debugState();
      return { kind: h.plan.kind, points: h.plan.points, hold: h.plan.duration, duration: h.gestureDuration, fit: state.fit, offset: state.offset };
    }, { level, step });
    const move = p => page.mouse.move(demo.offset.x + p.x * demo.fit, demo.offset.y + p.y * demo.fit);
    const at = demo.points[0];
    await move(at);
    if (demo.kind === 'timing') await page.waitForFunction(() => Math.abs(window.__spa.app.scene.workshop.stackSprite.x - 300) < 12);
    if (demo.kind === 'rotate-drag') { await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(300); }
    await page.mouse.down();
    if (['hold', 'pour'].includes(demo.kind)) await page.waitForTimeout(demo.hold * 1000 + 30);
    else if (demo.points.length > 1) {
      const lengths = demo.points.slice(1).map((p, i) => Math.hypot(p.x - demo.points[i].x, p.y - demo.points[i].y));
      const total = lengths.reduce((a, b) => a + b, 0), frames = Math.ceil(demo.duration * 30);
      for (let f = 1; f <= frames; f++) {
        let d = total * f / frames, i = 0;
        while (i < lengths.length - 1 && d > lengths[i]) { d -= lengths[i]; i++; }
        const a = demo.points[i], b = demo.points[i + 1], t = lengths[i] ? Math.min(1, d / lengths[i]) : 1;
        await move({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        await page.waitForTimeout(1000 / 30);
      }
    }
    await page.mouse.up(); await page.waitForTimeout(100);
    const result = await page.evaluate(() => { const s = window.__spa.app.scene; return { progress: s.stepProgress, step: s.stepIndex, hintActive: s.gestureHint.active, transitioning: s.transitioning }; });
    assert.equal(result.hintActive, false);
    assert.ok(result.progress > 0 || result.step > step || result.transitioning, `L${level + 1} S${step + 1}: demonstrated ${demo.kind} did not advance gameplay`);
    report.push({ level: level + 1, step: step + 1, kind: demo.kind, ...result });
  }
  assert.deepEqual(errors, []);
  await writeFile('test-results/hints/real-gestures.json', JSON.stringify({ report, errors }, null, 2));
  console.log(`${report.length} demonstrated gestures replayed with real mouse input: PASS`);
} finally { await browser.close(); }
