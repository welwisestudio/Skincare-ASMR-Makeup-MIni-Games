import { PACE } from './levels.js';

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const point = p => ({ x: p.x, y: p.y });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const circle = (p, r, turns = 1) => Array.from({ length: 65 }, (_, i) => ({ x: p.x + Math.cos(i / 64 * Math.PI * 2 * turns) * r, y: p.y + Math.sin(i / 64 * Math.PI * 2 * turns) * r }));
const sprite = image => image && ({ key: image.texture.key, width: image.displayWidth, height: image.displayHeight, angle: image.angle, tint: image.tintTopLeft });

/** Read-only instructions, derived from the same unfinished targets as the game. */
export function hintPlan(s) {
  if(s.premiumRitual)return s.premiumRitual.hintPlan();
  if(s.romance)return s.romance.hintPlan();
  if(s.puzzle)return s.puzzle.hintPlan();
  const w = s.workshop;
  if (w) {
    const path = w.paths.find(p => !p.done), item = w.items.find(i => !i.done);
    const target = w.targets.find(t => !t.done), move = w.moves?.[w.sequence];
    if (w.zip) return { kind: 'trace', points: w.zip.points.slice(w.zip.index).map(point), instruction: 'Hold the zipper. Follow the glowing edge.' };
    if (path) return { kind: 'trace', points: path.points.slice(path.index).map(point), instruction: 'Press at the glow. Keep holding and follow the path.', tool: sprite(w.cursor) };
    if (item) return { kind: item.rotate && item.angle !== 0 ? 'rotate-drag' : 'drag', points: [point(item.sprite), { x: item.tx, y: item.ty }], ghost: sprite(item.sprite), instruction: item.rotate && item.angle !== 0 ? 'Tap to rotate. Then drag into the matching space.' : item.remove ? 'Hold the leaf. Drag it away.' : 'Hold the item. Drag to the glow, then let go.' };
    if (move) return { kind: 'drag', points: [point(move.a), point(move.b)], instruction: w.mode === 'braid' ? 'Hold the strand. Pull it across to the glow.' : 'Hold the glowing edge. Fold it in this direction.' };
    if (w.center) return { kind: 'circle', points: circle(w.center, w.radius, 2), instruction: 'Keep holding. Move in smooth circles.' };
    if (w.mode === 'stack') return { kind: 'timing', points: [{ x: 300, y: 320 }], instruction: 'Wait for the sweet to reach the center. Then tap!' };
    if (!target) return null;
    if (['crush', 'bath-pop'].includes(w.mode)) return { kind: 'tap', points: [point(target)], instruction: w.mode === 'crush' ? 'Tap the bath bomb to crack it open.' : 'Tap a bubble to pop it.' };
    if(w.mode==='ignite')return {kind:'hold',points:[point(target)],duration:.9,instruction:'Hold the lit match at the wick.',tool:sprite(w.cursor)};
      if (['wax', 'fragrance'].includes(w.mode))return {kind:'hold',points:[point(target)],duration:w.mode==='wax'?3:2.4,instruction:'Hold here until it is completely filled.',tool:sprite(w.cursor)};
      if (['filling'].includes(w.mode)) return { kind: w.mode === 'fragrance' ? 'hold' : 'pour', points: [point(target)], duration: w.mode === 'wax' ? 2.4 : w.mode === 'filling' ? 1.32 : 2.4, instruction: w.mode === 'fragrance' ? 'Press and hold here to add the fragrance.' : 'Hold here. Let go when the ring reaches mint.', tool: sprite(w.cursor) };
    return { kind: 'rub', points: circle(target, w.mode === 'polish' ? 14 : 23, 2), instruction: ['makeup', 'polish'].includes(w.mode) ? 'Hold and brush over the glowing area.' : 'Hold and rub little circles over the glow.', tool: sprite(w.cursor) };
  }
  if (['paint', 'wipe'].includes(s.mode)) {
    const cells = s.grid.filter(c => c.v < .95);
    if (!cells.length) return null;
    const start = cells[0], nearby = cells.filter(c => distance(c, start) < 90);
    const route = [point(start)];
    while (nearby.length && route.length < 9) {
      nearby.sort((a, b) => distance(route.at(-1), a) - distance(route.at(-1), b));
      const next = nearby.shift();
      if (distance(route.at(-1), next) > 3) route.push(point(next));
    }
    return { kind: 'rub', points: route.length > 1 ? [...route, ...route.slice(0, -1).reverse()] : circle(start, 12), instruction: s.mode === 'wipe' ? 'Hold and gently wipe across the glowing area.' : 'Hold and brush across the glowing area.', tool: sprite(s.tool) };
  }
  if (s.mode === 'place') {
    const p = s.patches.find(p => !p.placed);
    return p && { kind: 'drag', points: [point(p), point(p.target)], ghost: sprite(s.patchSprites[p.target.id]), instruction: 'Hold the eye patch. Drag it to its outline.' };
  }
  if (s.mode === 'peel') {
    const patch = s.step.layer === 'patches', p = patch ? s.patches.find(p => !p.removed) : s.targets.find(t => !t.done);
    return p && { kind: 'peel', points: [point(p), { x: p.x + (patch ? p.target.side * (PACE.patchPull + 10) : 0), y: p.y + (patch ? 32 : PACE.maskPull + 8) }], ghost: patch ? sprite(s.patchSprites[p.target.id]) : null, instruction: patch ? 'Hold the patch. Pull outwards to peel it off.' : 'Grab the glowing tab. Keep holding and pull down.' };
  }
  if (s.mode === 'trace') {
    const path = s.tracePaths.find(p => !p.done);
    return path && { kind: 'trace', points: [lerp(path.a, path.b, path.v), point(path.b)], instruction: 'Press at the glow. Roll slowly along the path.', tool: sprite(s.tool) };
  }
  const target = s.targets.find(t => !t.done);
  return target && { kind: 'hold', points: [point(target)], duration: Math.max(.7, (1 - target.v) * s.step.seconds / s.targets.length / PACE.speed), instruction: 'Press and keep holding until the ring is full.', tool: sprite(s.tool) };
}

function along(points, t) {
  if (points.length === 1) return point(points[0]);
  const lengths = points.slice(1).map((p, i) => distance(points[i], p));
  let remain = lengths.reduce((a, b) => a + b, 0) * clamp(t);
  for (let i = 0; i < lengths.length; i++) {
    if (remain <= lengths[i]) return lerp(points[i], points[i + 1], lengths[i] ? remain / lengths[i] : 0);
    remain -= lengths[i];
  }
  return point(points.at(-1));
}

/** A separate, non-interactive display tree: never dispatches input or edits progress. */
class GestureHint {
  constructor(scene) {
    this.s = scene;
    this.root = scene.add.container();
    scene.root.add(this.root);
    this.guides = scene.add.graphics();
    this.root.add(this.guides);
    this.hand = scene.add.image(0, 0, 'ui-hint-hand').setOrigin(.09, .055);
    this.root.add(this.hand);
    this.root.setVisible(false);
    this.active = false;
  }
  start() {
    this.stop();
    const plan = hintPlan(this.s);
    if (!plan?.points.length) return;
    this.active = true;
    this.run = this.s.runId;
    this.step = this.s.stepIndex;
    this.plan = plan;
    this.clock = 0;
    this.cycle = 0;
    this.phase = 'arrive';
    this.s.app.ui?.updateStep(false);
    this.root.setVisible(true);
    this.s.root.bringToTop(this.root);
    this.prepare();
    this.update(0);
  }
  prepare() {
    const p = this.plan;
    this.ghost?.destroy(); this.ghost = null;
    this.tool?.destroy(); this.tool = null;
    const make = spec => {
      if (!spec || !this.s.textures.exists(spec.key)) return null;
      const image = this.s.add.image(0, 0, spec.key).setDisplaySize(spec.width, spec.height).setAngle(spec.angle).setTint(spec.tint ?? 0xffffff).setAlpha(.55);
      this.root.addAt(image, 1); return image;
    };
    this.ghost = make(p.ghost);
    this.tool = make(p.tool);
    this.drops = [];
    if (p.kind === 'pour' || this.s.step.tool === 'dropper' || this.s.workshop?.mode === 'fragrance') {
      for (let i = 0; i < 2; i++) {
        const drop = this.s.add.image(0, 0, 'ui-serum-drop').setDisplaySize(13, 20).setVisible(false);
        this.root.addAt(drop, 1); this.drops.push(drop);
      }
    }
    const right = Math.max(...p.points.map(p => p.x)) > 420;
    const bottom = Math.max(...p.points.map(p => p.y)) > 425;
    this.hand.setAngle(bottom ? (right ? 180 : -90) : (right ? 90 : 0));
    // The press pose already lasts .25 seconds: include it in timed holds.
    this.gestureDuration = p.duration ? Math.max(.1, p.duration - .25) : (p.kind === 'tap' ? .18 : p.kind === 'circle' ? 3.6 : p.kind === 'rub' ? 2.5 : clamp(p.points.slice(1).reduce((n, v, i) => n + distance(v, p.points[i]), 0) / 115, 1.2, 5));
    this.rotateDuration = p.kind === 'rotate-drag' ? 1.25 : 0;
    this.total = .65 + this.rotateDuration + this.gestureDuration + 1.2;
  }
  stop() {
    if (this.active) {
      const ui = this.s.app.ui;
      if (ui?.stepHint?.active && this.s.step) {
        ui.stepHint.setText(this.s.step.hint);
        ui.fitText(ui.stepHint, ui.layout.landscape ? 710 : 390, 49);
      }
    }
    this.active = false;
    this.root.setVisible(false);
    this.guides.clear();
    this.ghost?.destroy(); this.ghost = null;
    this.tool?.destroy(); this.tool = null;
    this.drops?.forEach(drop => drop.destroy()); this.drops = [];
  }
  caption(message) {
    const ui = this.s.app.ui, text = ui?.stepHint;
    if (!text?.active || ui.toastText) return;
    if (text.text !== message) { text.setText(message); ui.fitText(text, ui.layout.landscape ? 710 : 390, 49); }
  }
  update(dt) {
    if (!this.active) return;
    const s = this.s;
    if (!s.active || s.transitioning || s.runId !== this.run || s.stepIndex !== this.step) { this.stop(); return; }
    if (s.frozen) return;
    this.clock += dt;
    const p = this.plan, g = this.guides;
    g.clear();
    let t = this.clock % this.total, local, progress = 0, pressed = false;
    let message = p.instruction, alpha = 1;
    const first = p.points[0], last = p.points.at(-1);
    if(p.kind==='tap-pair'){
      const phase=this.clock%3.8;local=phase<1.5?first:phase<2?lerp(first,last,(phase-1.5)/.5):last;
      pressed=(phase>.45&&phase<1)||(phase>2.3&&phase<2.85);this.phase=pressed?'tap':'move';
      this.ring(first.x,first.y,29,0xffe69f,.8);this.ring(last.x,last.y,29,0xc4f3aa,.8);
    }else if (p.kind === 'timing') {
      const sweet = s.workshop.stackSprite;
      // Follow the actual moving sweet, so the demonstration never teaches a late tap.
      pressed = Math.abs(sweet.x - 300) < 32;
      local = first; this.phase = pressed ? 'tap' : 'wait';
      message = pressed ? 'Tap now! The sweet is in the center.' : 'Wait for the sweet to reach the center...';
      g.lineStyle(3, 0xffffff, .8).lineBetween(300, 110, 300, 355);
      this.ring(300, sweet.y, 39, pressed ? 0xb9ee93 : 0xffe6a0, .9);
      this.ring(sweet.x, sweet.y, 47, 0xffffff, .65);
      alpha = pressed ? 1 : .72;
    } else {
      const gestureStart = .65 + this.rotateDuration;
      if (this.ghost) this.ghost.setAngle(this.rotateDuration ? p.ghost.angle * (1 - clamp((t - .65) / (this.rotateDuration * .4))) : p.ghost.angle);
      if (t < .4) {
        this.phase = 'arrive'; local = first; alpha = .35 + t / .4 * .65;
      } else if (t < .65) { this.phase = 'press'; local = first; pressed = true; }
      else if (this.rotateDuration && t < gestureStart) {
        const rt = (t - .65) / this.rotateDuration;
        this.phase = 'rotate'; local = first; pressed = rt < .4 || rt > .8;
        message = 'Tap once to turn the item upright.';
        this.ghost?.setAngle(p.ghost.angle * (1 - clamp(rt / .4)));
        g.lineStyle(4, 0xffdf82, .9).beginPath().arc(first.x, first.y, 49, -.7, 4.6).strokePath();
        g.fillStyle(0xffdf82, 1).fillTriangle(first.x - 16, first.y - 48, first.x - 1, first.y - 50, first.x - 5, first.y - 36);
      } else if (t < gestureStart + this.gestureDuration) {
        this.phase = 'gesture'; progress = (t - gestureStart) / this.gestureDuration;
        local = along(p.points, progress); pressed = true;
        if (p.kind === 'rotate-drag') message = 'Now hold, drag into the glow, and let go.';
      } else {
        this.phase = 'release'; progress = 1; local = last;
        alpha = 1 - clamp((t - gestureStart - this.gestureDuration - .55) / .6);
        if (p.kind === 'pour') message = 'Let go now — the ring is mint!';
        else if (['drag', 'rotate-drag', 'peel'].includes(p.kind)) message = 'Let go here. Your turn!';
        else message = 'Your turn! Try the same movement.';
      }
      this.cycle = Math.floor(this.clock / this.total);
      if (p.points.length > 1) {
        // Small pearls of light communicate direction without covering the artwork.
        for (let i = 0; i <= 24; i++) {
          const v = along(p.points, i / 24);
          g.fillStyle(i / 24 < progress ? 0xc4f3aa : 0xfff5df, .85).fillCircle(v.x, v.y, i / 24 < progress ? 3.5 : 2.5);
        }
        this.ring(first.x, first.y, 21, 0xffe69f, .85);
        if (['drag', 'rotate-drag', 'trace', 'peel'].includes(p.kind)) this.ring(last.x, last.y, 28 + Math.sin(this.clock * 4) * 2, 0xc4f3aa, .9);
      }
      if (['hold', 'pour'].includes(p.kind)) {
        progress = clamp((t - .4) / (this.gestureDuration + .25));
        this.ring(first.x, first.y, 45, 0xffffff, .8);
        if (p.kind === 'pour') g.lineStyle(10, 0xb9ee93, .95).beginPath().arc(first.x, first.y, 45, -Math.PI / 2 + .66 * Math.PI * 2, -Math.PI / 2 + .94 * Math.PI * 2).strokePath();
        g.lineStyle(6, this.phase === 'release' ? 0xb9ee93 : 0xffdf82, 1).beginPath().arc(first.x, first.y, 45, -Math.PI / 2, -Math.PI / 2 + progress * (p.kind === 'pour' ? .8 : 1) * Math.PI * 2).strokePath();
      }
    }
    this.position = local;
    this.pressed = pressed;
    this.caption(message);
    const pulse = s.app.reducedMotion ? .35 : this.clock * 1.7 % 1;
    if (pressed) {
      g.fillStyle(0xffe49b, .19).fillCircle(local.x, local.y, 23);
      this.ring(local.x, local.y, 12 + pulse * 23, 0xffedab, (1 - pulse) * .85);
    }
    const targetSize = s.app.reducedMotion ? 91 : pressed ? 86 : 96;
    this.handSize = this.handSize == null ? targetSize : this.handSize + (targetSize - this.handSize) * (1 - Math.exp(-dt * 22));
    this.lift = (this.lift || 0) + ((pressed ? 0 : -9) - (this.lift || 0)) * (1 - Math.exp(-dt * 22));
    this.hand.setPosition(local.x, local.y + this.lift).setDisplaySize(this.handSize, this.handSize * 377 / 392).setAlpha(alpha);
    if (this.ghost) this.ghost.setPosition(local.x, local.y).setAlpha(alpha * .65);
    if (this.tool) {
      // A translucent tool preview is separate from the player's real tool.
      this.tool.setPosition(local.x + 38, local.y - 54).setAlpha(alpha * (pressed ? .7 : .3));
      if (s.step.tool === 'dropper') this.tool.setAngle(180);
      if (p.kind === 'pour') this.tool.setAngle(-35);
    }
    this.drops?.forEach((drop, i) => {
      const fall = (this.clock * 1.5 + i / 2) % 1;
      drop.setVisible(pressed).setPosition(local.x, local.y - 60 + fall * 60).setAlpha((1 - fall) * .85);
    });
  }
  ring(x, y, r, color, alpha) {
    this.guides.lineStyle(6, 0x785482, alpha * .45).strokeCircle(x, y, r);
    this.guides.lineStyle(3, color, alpha).strokeCircle(x, y, r);
  }
  debug() {
    return { active: this.active, kind: this.plan?.kind, phase: this.phase, clock: this.clock, points: this.plan?.points, position: this.position, pressed: this.pressed, instruction: this.plan?.instruction };
  }
}

export function installHints(Scene) {
  const proto = Scene.prototype;
  // Install after the workshop router to cover every level with one lifecycle.
  for (const method of ['begin', 'showWelcome', 'nextStep', 'finishStep', 'clear']) {
    const base = proto[method];
    proto[method] = function (...args) {
      this.gestureHint?.stop();const result=base.apply(this,args);
      if(method==='nextStep'&&this.romance?.mode==='compare'&&this.active&&!this.frozen){
        this.gestureHint ||= new GestureHint(this);this.gestureHint.start();
      }
      return result;
    };
  }
  const down = proto.onDown, update = proto.update, debug = proto.debugState;
  proto.onDown = function (pointer) {
    if (this.active && !this.frozen && !this.transitioning) this.gestureHint?.stop();
    return down.call(this, pointer);
  };
  proto.hint = function () {
    if (!this.active || this.transitioning || this.frozen) return;
    this.usedHint = true;
    this.gestureHint ||= new GestureHint(this);
    this.gestureHint.start();
  };
  proto.update = function (time, delta) { update.call(this, time, delta); this.gestureHint?.update(Math.min(delta / 1000, .05)); };
  proto.debugState = function () { return { ...debug.call(this), gestureHint: this.gestureHint?.debug() }; };
}
