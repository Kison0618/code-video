// 可复用的火柴人角色（v2 动作系统）：只写意图，弹簧 + IK 负责动作的质感
//
//   const a = new Actor2({ x0: -40 });
//   a.hip(1.4, [x, y]); a.lean(1.4, 40); a.head(1.4, 30);      // 胯 / 前倾 / 低头 的目标（交给弹簧去追）
//   a.foot('F', 1.0, [x, 0], 0.22, 18);                         // 脚：按弧线挪到新位置（抬脚 18 px），落地自动配脚步声
//   a.hand('F', 1.4, 'free', [0.05, 0.35]);                     // 手：free 相对肩膀（单位 H）/ world 世界坐标 / obj 拿着的东西上的点
//   a.hand('F', 2.0, 'strike', { to: [x, y], dur: 0.06 });      // 出拳：dur 秒内加速打到精确位置（打击点和停顿帧对得上）
//   a.obj(2.1, 'held', { fwd: 0.24, up: 0.05 });                // 拿着的东西：rest 放着（固定或函数）/ held 跟着身体（带弹簧）
//   a.simulate(12);                                             // 写完所有意图后模拟一次（240 Hz，确定性）
//   a.draw(ctx, ta)                                             // 按动画时间画（含拖影）
//
// 所有时间都是"动画时间"；停顿帧用 Clock 做时间重映射。
'use strict';
const K = require('./core');
const { clamp, lerp, E, noise1 } = K;
const { Dyn, Track, body, paint, smear, FEEL } = require('./rig2');
const { P } = require('./rig');
const cues = require('./cues');

const DT = 1 / 240;

// —— 时钟：真实时间 ↔ 动画时间（停顿帧期间动画时间暂停，真实时间继续：闪光、震屏照常走）——
class Clock {
  constructor() { this.f = []; }
  freeze(ta, d) { this.f.push({ ta, d }); this.f.sort((a, b) => a.ta - b.ta); return this; }
  anim(t) {           // 真实 → 动画
    let off = 0;
    for (const z of this.f) { if (t < z.ta + off) break; if (t < z.ta + off + z.d) return z.ta; off += z.d; }
    return t - off;
  }
  real(ta) {          // 动画 → 真实（接触那一刻本身算在冻结之前）
    let off = 0; for (const z of this.f) if (ta > z.ta) off += z.d; return ta + off;
  }
  get total() { return this.f.reduce((s, z) => s + z.d, 0); }
}

class Foot {
  constructor(p, actor, name) { this.m = [{ t: -1e9, to: p, dur: 0, lift: 0, ease: 'inOut' }]; this.a = actor; this.name = name; }
  move(t, to, dur, lift = 16, ease = 'inOut', sfx = true) {
    this.m.push({ t, to, dur, lift, ease, sfx }); this.m.sort((a, b) => a.t - b.t); return this;
  }
  at(t) {
    let i = 0; while (i < this.m.length - 1 && this.m[i + 1].t <= t) i++;
    const c = this.m[i], p = this.m[Math.max(0, i - 1)].to;
    if (i === 0 || t >= c.t + c.dur) return c.to;
    const u = (E[c.ease] || E.inOut)((t - c.t) / c.dur);
    return [lerp(p[0], c.to[0], u), lerp(p[1], c.to[1], u) - c.lift * Math.sin(Math.PI * u)];
  }
}

class Actor2 {
  constructor(o = {}) {
    this.H = o.H || 300; this.color = o.color || K.C.yellow; this.headStyle = o.head || 'fill'; this.dir = o.dir || 1;
    this.clock = o.clock || null;
    const x0 = o.x0 ?? 0, st = -(o.stand ?? 0.44) * this.H;
    this.STAND = -st;
    this.hipT = new Track([x0, st]); this.leanT = new Track(o.lean ?? 2); this.headT = new Track(o.headTilt ?? 10);
    this.feet = { F: new Foot([x0 + 22, 0], this, 'F'), B: new Foot([x0 - 20, 0], this, 'B') };
    this.hands = { F: [{ t: -1e9, mode: 'free', arg: [0.05, 0.35] }], B: [{ t: -1e9, mode: 'free', arg: [-0.04, 0.35] }] };
    this.objModes = [{ t: -1e9, mode: 'none' }];
    this.objJiggle = o.objJiggle || null;          // t → [dy, drot]（比如敲键盘时电脑的微震）
    this.noise = o.noise ?? 1;                     // "活"的停顿强度
    this.feel = { ...FEEL, ...(o.feel || {}) };
  }
  hip(t, v, dur = 0, ease = 'inOut') { this.hipT.set(t, v, dur, ease); return this; }
  lean(t, v, dur = 0, ease = 'inOut') { this.leanT.set(t, v, dur, ease); return this; }
  head(t, v, dur = 0, ease = 'inOut') { this.headT.set(t, v, dur, ease); return this; }
  foot(f, t, to, dur, lift = 16, ease = 'inOut', sfx = true) { this.feet[f].move(t, to, dur, lift, ease, sfx); return this; }
  hand(h, t, mode, arg) { this.hands[h].push({ t, mode, arg }); this.hands[h].sort((a, b) => a.t - b.t); return this; }
  obj(t, mode, arg) { this.objModes.push({ t, mode, arg }); this.objModes.sort((a, b) => a.t - b.t); return this; }

  simulate(dur) {
    const H = this.H, D = this.dir, f = this.feel, N = Math.ceil(dur / DT) + 2;
    const at = (list, t) => { let m = list[0]; for (const x of list) if (x.t <= t) m = x; return m; };
    const h0 = this.hipT.at(0);
    const dyn = {
      hx: new Dyn(...f.hip, h0[0]), hy: new Dyn(...f.hip, h0[1]), lean: new Dyn(...f.lean, this.leanT.at(0)), head: new Dyn(...f.head, this.headT.at(0)),
      Fx: new Dyn(...f.hand, 0), Fy: new Dyn(...f.hand, 0), Bx: new Dyn(...f.hand, 0), By: new Dyn(...f.hand, 0),
      ox: new Dyn(...f.obj, 0), oy: new Dyn(...f.obj, 0), or: new Dyn(...f.obj, 0),
    };
    const R = this.rec = { hip: [], lean: [], head: [], hF: [], hB: [], fF: [], fB: [], obj: [] };
    const sw = { F: -9, B: -9 }, prev = { F: null, B: null };
    let objInit = false;
    const LEG = (P.thigh + P.shin) * H * 0.97, nz = this.noise;
    for (let i = 0; i < N; i++) {
      const t = i * DT;
      const ht = this.hipT.at(t), feet = { F: this.feet.F.at(t), B: this.feet.B.at(t) };
      // 胯的目标 + "活"的停顿；够得着约束加在目标上（脚踩地够不到时胯往下沉、膝盖弯，而不是脚被拖着滑）
      const tg = [ht[0] + 4.5 * nz * noise1(t * 0.9, 1), ht[1] + 2.4 * nz * noise1(t * 1.1, 2)];
      for (const p of [feet.F, feet.B]) {
        if (p[1] < -4) continue;
        const dx = p[0] - tg[0];
        if (Math.abs(dx) < LEG) tg[1] = Math.max(tg[1], p[1] - Math.sqrt(LEG * LEG - dx * dx));
      }
      const hip = [dyn.hx.step(DT, tg[0]), dyn.hy.step(DT, tg[1])];
      const lean = dyn.lean.step(DT, this.leanT.at(t) + 1.8 * nz * noise1(t * 0.8, 3));
      const head = dyn.head.step(DT, this.headT.at(t) + 3.5 * nz * noise1(t * 1.0, 4));
      const b0 = body({ t, hip, lean, head, fF: feet.F, fB: feet.B, hF: hip, hB: hip }, H, D);
      const up = [b0.neck[0] - hip[0], b0.neck[1] - hip[1]], ul = Math.hypot(...up); up[0] /= ul; up[1] /= ul;
      const fwd = [-up[1] * D, up[0] * D];
      // 拿着的东西
      const om = at(this.objModes, t);
      let os = null;
      if (om.mode === 'rest') {
        os = typeof om.arg === 'function' ? om.arg(t) : om.arg;
        dyn.ox.snap(os[0]); dyn.oy.snap(os[1]); dyn.or.snap(os[2] || 0); objInit = true;
      } else if (om.mode === 'held') {
        const a = om.arg, g = [hip[0] + fwd[0] * a.fwd * H + up[0] * a.up * H, hip[1] + fwd[1] * a.fwd * H + up[1] * a.up * H];
        if (!objInit) { dyn.ox.snap(g[0]); dyn.oy.snap(g[1]); objInit = true; }
        const j = this.objJiggle ? this.objJiggle(t) : [0, 0];
        os = [dyn.ox.step(DT, g[0]), dyn.oy.step(DT, g[1]) + j[0], dyn.or.step(DT, (a.rot || 0) + lean * 0.004) + j[1]];
      }
      // 手
      const hp = {};
      for (const h of ['F', 'B']) {
        const m = at(this.hands[h], t);
        if (prev[h] !== m) { sw[h] = t; prev[h] = m; }
        let g, exact = false;
        if (m.mode === 'free') g = [b0.sh[0] + D * m.arg[0] * H, b0.sh[1] + m.arg[1] * H];
        else if (m.mode === 'world') g = typeof m.arg === 'function' ? m.arg(t) : m.arg;
        else if (m.mode === 'strike') { g = m.arg.to; exact = m.arg.dur || 0.06; }        // 出拳：在 dur 秒内加速打到精确位置
        else if (m.mode === 'obj' && os) {
          const p = typeof m.arg === 'function' ? m.arg(t) : m.arg, c = Math.cos(os[2]), s = Math.sin(os[2]);
          g = [os[0] + D * (p[0] * c - p[1] * s), os[1] + p[0] * s + p[1] * c]; exact = true;
        } else g = [b0.sh[0], b0.sh[1] + 0.35 * H];
        if (i === 0) { dyn[h + 'x'].snap(g[0]); dyn[h + 'y'].snap(g[1]); }
        const sx = dyn[h + 'x'].step(DT, g[0]), sy = dyn[h + 'y'].step(DT, g[1]);
        if (exact) {     // 贴上去之前的 0.1 秒：从弹簧位置平滑过渡到精确位置，之后完全贴住（出拳用加速曲线）
          const u = exact === true ? E.inOut((t - sw[h]) / 0.1) : E.in(clamp((t - sw[h]) / exact, 0, 1));
          hp[h] = u >= 1 ? g : [lerp(sx, g[0], u), lerp(sy, g[1], u)];
          if (u >= 1) { dyn[h + 'x'].snap(g[0]); dyn[h + 'y'].snap(g[1]); }
        } else hp[h] = [sx, sy];
      }
      R.hip.push(hip); R.lean.push(lean); R.head.push(head); R.hF.push(hp.F); R.hB.push(hp.B); R.fF.push(feet.F); R.fB.push(feet.B); R.obj.push(os);
    }
    this.N = N;
    // 脚步声：每次挪脚结束落地时（真实时间）
    for (const k of ['F', 'B']) for (const m of this.feet[k].m) if (m.sfx && m.t > -1e8 && m.dur > 0)
      cues.add(this.clock ? this.clock.real(m.t + m.dur) : m.t + m.dur, 'step', { v: 0.8 });
    return this;
  }
  stateAt(ta) {
    const R = this.rec, x = clamp(ta / DT, 0, this.N - 1.001), i = Math.floor(x), u = x - i;
    const L = (a, b) => (a === null || b === null ? a || b : Array.isArray(a) ? a.map((v, n) => lerp(v, b[n], u)) : lerp(a, b, u));
    const g = k => L(R[k][i], R[k][i + 1]);
    return { t: ta, hip: g('hip'), lean: g('lean'), head: g('head'), hF: g('hF'), hB: g('hB'), fF: g('fF'), fB: g('fB'), obj: g('obj') };
  }
  jointsAt(ta) { return body(this.stateAt(ta), this.H, this.dir); }
  // 画：先拖影（手脚快速移动时沿轨迹的带子），再画人
  draw(ctx, ta, o = {}) {
    const H = this.H;
    for (const k of ['aF', 'aB', 'lF', 'lB']) {
      const pts = []; for (let n = 7; n >= 0; n--) pts.push(this.jointsAt(ta - n / 160)[k][2]);
      const sp = Math.hypot(pts[7][0] - pts[0][0], pts[7][1] - pts[0][1]) / (7 / 160) / H;
      if (sp > 3.2) smear(ctx, pts, P.lw * H * 1.05, this.color, clamp((sp - 3.2) / 4, 0, 0.9));
    }
    paint(ctx, this.jointsAt(ta), o.color || this.color, H, this.headStyle);
  }
}

module.exports = { Actor2, Clock, DT };
