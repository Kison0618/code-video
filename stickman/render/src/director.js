// 导演模块：把每个场景都要重复写的东西收在一起
//   - 时钟（停顿帧）、摄像机、打击系统
//   - 音效一律按"动画时间"登记，最后统一换算成真实时间（打击自带的音效除外，它们已经是真实时间）
//   - 镜头按语义写：在某个节拍上，给谁一个什么景别；具体位置等角色动作模拟完之后再算
//
//   const D = new Director();
//   D.cue(ta, 'touch');                                   // 音效（动画时间）
//   D.hit(ta, [x, y], 'light');                           // 打击（登记停顿帧）
//   D.shot(ta, 0.6, { kind: 'medium', on: hero });         // 在 ta 开始用 0.6 秒推到主角的中景
//   D.shot(ta, 0.4, { kind: 'wide', on: [hero, [x, y]] });  // 远景，把主角和某个点都框进来
//   D.track(t0, t1, { kind: 'full', on: hero, lead: 0.15 }); // 跟拍
//   const DUR = D.finalize({ actors: [hero], bodies: [...], dur: ADUR });
//
// 景别按"主角身高占画面高度"定义（拆解 2.1 节）：wide 远景 14%、full 全景 32%、medium 中景 48%、close 近景 75%、extreme 特写（对准一个点）
'use strict';
const K = require('./core');
const { W, H, clamp } = K;
const { Clock } = require('./actor2');
const { Camera } = require('./cam');
const { Impacts } = require('./impact');
const { flushSfx } = require('./phys');
const cues = require('./cues');

const KIND = { wide: 0.14, full: 0.32, medium: 0.48, close: 0.75, extreme: 1.25 };

class Director {
  constructor() {
    this.clock = new Clock(); this.cam = new Camera(); this.imp = new Impacts({ clock: this.clock, cam: this.cam });
    this.realCue = new Set(); this.plan = []; this.cueStart = cues.list.length;
  }
  cue(ta, type, o = {}) { cues.add(ta, type, o); return this; }
  hit(ta, pos, level, o) {
    const n = cues.list.length, np = this.cam.punches.length, tr = this.imp.hit(ta, pos, level, o);
    for (let i = n; i < cues.list.length; i++) this.realCue.add(cues.list[i]);
    for (let i = np; i < this.cam.punches.length; i++) this.cam.punches[i].real = true;       // 打击自带的推镜已经是真实时间
    return tr;
  }
  R(ta) { return this.clock.real(ta); }
  punch(ta, amt, dur) { this.cam.punch(ta, amt, dur); return this; }                        // 动画时间，finalize 时换算
  // 镜头意图（动画时间）。spec: { kind, on, z, dx, dy, lead, fit }
  shot(ta, dur, spec, ease = 'inOut3') { this.plan.push({ type: 'move', ta, dur, spec, ease }); return this; }
  cut(ta, spec) { this.plan.push({ type: 'move', ta, dur: 0.001, spec, ease: 'linear' }); return this; }
  track(t0, t1, spec, step = 0.2) { this.plan.push({ type: 'track', t0, t1, spec, step }); return this; }
  // 平滑跟拍（第 8 轮，打斗用）：每 1/24 秒算一次机位，再按 ±smooth 秒做滑动平均，镜头不会一顿一顿地追
  follow(t0, t1, spec, smooth = 0.25) { this.plan.push({ type: 'follow', t0, t1, spec, smooth }); return this; }
  // 景别 → 机位（在动作模拟完之后调用）
  frame(ta, spec) {
    const pts = [], actors = [];
    const add = o => {
      if (!o) return;
      if (o.jointsAt) { actors.push(o); const j = o.jointsAt(ta); pts.push(j.head, j.hip, j.lF[2], j.lB[2], j.aF[2], j.aB[2]); }
      else if (typeof o === 'function') add(o(ta));
      else if (Array.isArray(o) && typeof o[0] === 'number') pts.push(o);
      else if (Array.isArray(o)) o.forEach(add);
    };
    add(spec.on);
    const a = actors[0], Hh = a ? a.H : 300;
    let z = spec.z ?? (KIND[spec.kind || 'full'] * H / Hh);
    let cx, cy;
    if (a && actors.length === 1 && pts.length === 6 && spec.kind !== 'wide') {        // 只框一个人：按景别对准身体的不同部位
      const j = a.jointsAt(ta), s = a.stateAt(ta);
      const focus = { full: [(j.hip[0] + j.head[0]) / 2, (j.head[1] + Math.max(j.lF[2][1], j.lB[2][1])) / 2],
        medium: [j.neck[0], (j.neck[1] + j.hip[1]) / 2 - 0.05 * Hh], close: [j.head[0], j.head[1] + 0.12 * Hh], extreme: j.head }[spec.kind || 'full'];
      [cx, cy] = focus;
      cx += (s.dir || 1) * (spec.lead ?? 0.1) * W / z;                                  // 看的方向留空间
    } else {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      if (a) { y0 = Math.min(y0, a.jointsAt(ta).head[1] - 0.15 * Hh); }
      cx = (x0 + x1) / 2; cy = (y0 + y1) / 2;
      const fit = spec.fit ?? 0.72;                                                     // 一组东西：都框进画面的 72%
      z = Math.min(z, fit * W / Math.max(1, x1 - x0), fit * H / Math.max(1, y1 - y0));
    }
    if (spec.lead !== undefined && !(a && actors.length === 1 && pts.length === 6 && spec.kind !== 'wide') && a) cx += (a.stateAt(ta).dir || 1) * spec.lead * W / z;
    return { x: cx + (spec.dx || 0), y: cy + (spec.dy || 0), z };
  }
  finalize({ actors = [], bodies = [], dur, start = { x: 0, y: -330, z: 1 } }) {
    for (let i = this.cueStart; i < cues.list.length; i++) { const c = cues.list[i]; if (!this.realCue.has(c)) c.t = +this.clock.real(c.t).toFixed(4); }
    this.cam.punches.forEach(p => { if (!p.real) { p.t = this.clock.real(p.t); p.real = true; } });
    for (const a of actors) a.simulate(dur);
    flushSfx(bodies, this.clock);
    // 镜头：每个 move 是"先稳住到 ta，再在 dur 秒内移到新机位"
    let cur = { ...start };
    const keys = [{ ta: 0, ...cur, ease: 'linear' }];
    const items = [...this.plan].sort((p, q) => (p.ta ?? p.t0) - (q.ta ?? q.t0));
    for (const p of items) {
      if (p.type === 'move') {
        keys.push({ ta: p.ta, ...cur, ease: 'linear' });
        cur = this.frame(p.ta + p.dur, p.spec); keys.push({ ta: p.ta + p.dur, ...cur, ease: p.ease });
      } else if (p.type === 'follow') {
        const st = 1 / 24, raw = [];
        for (let ta = p.t0 - p.smooth; ta < p.t1 + p.smooth + 1e-6; ta += st) raw.push([ta, this.frame(clamp(ta, 0, dur), p.spec)]);
        const n = Math.round(p.smooth / st);
        for (let i = n; i < raw.length - n; i += 2) {
          let x = 0, y = 0, z = 0, w = 0;
          for (let k = -n; k <= n; k++) { const q = raw[i + k][1], c = 1 - Math.abs(k) / (n + 1); x += q.x * c; y += q.y * c; z += q.z * c; w += c; }
          cur = { x: x / w, y: y / w, z: z / w }; keys.push({ ta: raw[i][0], ...cur, ease: 'linear' });
        }
      } else {
        for (let ta = p.t0; ta < p.t1 + 1e-6; ta += p.step) { cur = this.frame(Math.min(ta, p.t1), p.spec); keys.push({ ta: Math.min(ta, p.t1), ...cur, ease: 'linear' }); }
      }
    }
    keys.push({ ta: dur, ...cur, ease: 'linear' });
    for (const k of keys) this.cam.key(this.clock.real(k.ta), { x: k.x, y: k.y, z: k.z, ease: k.ease });
    this.DUR = +this.clock.real(dur).toFixed(2);
    return this.DUR;
  }
}

module.exports = { Director, KIND };
