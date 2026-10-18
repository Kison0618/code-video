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
  target(t) { let i = 0; while (i < this.m.length - 1 && this.m[i + 1].t <= t) i++; return this.m[i].to; }   // 这一步的最终落脚点
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
    this.noise = o.noise ?? 0.5;                   // "活"的停顿强度（原片静止段几乎不动：快动作 + 长停顿，晃多了像站不稳）
    this.feel = { ...FEEL, ...(o.feel || {}) };
    this.paths = { hip: [], lean: [] };            // 精确轨迹（抛飞、空翻、跑步）：这段时间内不走弹簧
    this.footModes = { F: [{ t: -1e9, mode: 'ground' }], B: [{ t: -1e9, mode: 'ground' }] };
    this.sfxList = [];
    this.dirs = [{ t: -1e9, d: this.dir }];         // 朝向（转身是瞬间的，和原片一样 1 帧翻过去，弹簧负责之后的动作）
  }
  hip(t, v, dur = 0, ease = 'inOut') { this.hipT.set(t, v, dur, ease); return this; }
  lean(t, v, dur = 0, ease = 'inOut') {         // 空翻过的整圈不算：新目标就近取（-356° 之后写 8° 就是往前 12°，而不是倒转一圈）
    const p = this.leanT.at(t); this.leanT.set(t, v + 360 * Math.round((p - v) / 360), dur, ease); return this;
  }
  head(t, v, dur = 0, ease = 'inOut') { this.headT.set(t, v, dur, ease); return this; }
  foot(f, t, to, dur, lift = 16, ease = 'inOut', sfx = true) {
    this.feet[f].move(t, to, dur, lift, ease, sfx);
    this.footModes[f].push({ t, mode: 'ground', dur }); this.footModes[f].sort((a, b) => a.t - b.t);
    return this;
  }
  // 脚离地，跟着身体走（腾空收腿、躺着蹬腿）：arg = [沿身体朝前, 沿身体朝下]（单位 H，相对胯），可以是 t 的函数
  // 脚按给定的世界坐标轨迹走（跑步的步态）：fn(t) → [x, y]，切进来时从脚的实际位置过渡 0.08 秒
  footPath(f, t, fn, blend = 0.08) { this.footModes[f].push({ t, mode: 'path', fn, blend }); this.footModes[f].sort((a, b) => a.t - b.t); return this; }
  footFree(f, t, arg) { this.footModes[f].push({ t, mode: 'free', arg }); this.footModes[f].sort((a, b) => a.t - b.t); return this; }
  // 精确轨迹：t0–t1 之间 ch（'hip' 或 'lean'）完全按 fn(t) 走；结束时把速度交还给弹簧，落地会自然压一下
  path(ch, t0, t1, fn) { this.paths[ch].push({ t0, t1, fn }); return this; }
  // 和动作绑定的音效（按动画时间写，simulate 时换算成真实时间）
  sfx(t, type, o = {}) { this.sfxList.push({ t, type, o }); return this; }
  turn(t, d) { this.dirs.push({ t, d }); this.dirs.sort((a, b) => a.t - b.t); return this; }
  dirAt(t) { let d = this.dirs[0].d; for (const x of this.dirs) if (x.t <= t) d = x.d; return d; }
  hand(h, t, mode, arg) { this.hands[h].push({ t, mode, arg }); this.hands[h].sort((a, b) => a.t - b.t); return this; }
  obj(t, mode, arg) { this.objModes.push({ t, mode, arg }); this.objModes.sort((a, b) => a.t - b.t); return this; }

  simulate(dur, opt = {}) {
    const H = this.H, f = this.feel, N = Math.ceil(dur / DT) + 2;
    const at = (list, t) => { let m = list[0]; for (const x of list) if (x.t <= t) m = x; return m; };
    const h0 = this.hipT.at(0);
    const dyn = {
      hx: new Dyn(...f.hip, h0[0]), hy: new Dyn(...f.hip, h0[1]), lean: new Dyn(...f.lean, this.leanT.at(0)), head: new Dyn(...f.head, this.headT.at(0)),
      Fx: new Dyn(...f.hand, 0), Fy: new Dyn(...f.hand, 0), Bx: new Dyn(...f.hand, 0), By: new Dyn(...f.hand, 0),
      fFx: new Dyn(...f.foot, 0), fFy: new Dyn(...f.foot, 0), fBx: new Dyn(...f.foot, 0), fBy: new Dyn(...f.foot, 0),
      ox: new Dyn(...f.obj, 0), oy: new Dyn(...f.obj, 0), or: new Dyn(...f.obj, 0),
    };
    const R = this.rec = { hip: [], lean: [], head: [], hF: [], hB: [], fF: [], fB: [], obj: [], dir: [] };
    let D = this.dir;
    const sw = { F: -9, B: -9 }, prev = { F: null, B: null };
    const fprev = { F: null, B: null }, fblend = { F: null, B: null }, pblend = { F: null, B: null }, lastFoot = { F: null, B: null };
    const pathAt = (ch, t) => { const L = this.paths[ch]; for (let n = L.length - 1; n >= 0; n--) if (t >= L[n].t0 && t < L[n].t1) return L[n]; return null; };
    const follow = (d, p, v, tg) => { d.y = p; d.yd = v; d.xp = tg; };
    let objInit = false;
    const LEG = (P.thigh + P.shin) * H * 0.97, nz = this.noise;
    for (let i = 0; i < N; i++) {
      const t = i * DT;
      D = this.dirAt(t);
      const ht = this.hipT.at(t);
      // 脚的模式：ground 按弧线踩点；free 跟着身体（弹簧）；free → ground 时在这次挪脚的时间里从实际位置过渡过去
      const fm = {};
      for (const k of ['F', 'B']) {
        const m = at(this.footModes[k], t);
        if (fprev[k] !== m) {
          const off = fprev[k] && fprev[k].mode !== 'ground';
          fblend[k] = off && m.mode === 'ground' ? { t0: t, dur: Math.max(m.dur || 0, 0.06) } : null;
          pblend[k] = m.mode === 'path' && lastFoot[k] ? { t0: t, dur: m.blend || 0.08, from: lastFoot[k] } : null;
          fprev[k] = m;
        }
        fm[k] = m;
      }
      const ground = { F: this.feet.F.at(t), B: this.feet.B.at(t) };
      // 胯的目标 + "活"的停顿；够得着约束加在目标上（脚踩地够不到时胯往下沉、膝盖弯，而不是脚被拖着滑）
      const tg = [ht[0] + 4.5 * nz * noise1(t * 0.9, 1), ht[1] + 2.4 * nz * noise1(t * 1.1, 2)];
      for (const k of ['F', 'B']) {
        const p = ground[k];
        if (fm[k].mode !== 'ground' || fblend[k] || p[1] < -4) continue;
        const dx = p[0] - tg[0];
        if (Math.abs(dx) < LEG) tg[1] = Math.max(tg[1], p[1] - Math.sqrt(LEG * LEG - dx * dx));
      }
      let hip;
      const hp0 = pathAt('hip', t);
      if (hp0) {
        const a = hp0.fn(t), b = hp0.fn(Math.min(t + DT, hp0.t1 - 1e-6));
        hip = a; follow(dyn.hx, a[0], (b[0] - a[0]) / DT, tg[0]); follow(dyn.hy, a[1], (b[1] - a[1]) / DT, tg[1]);
      } else hip = [dyn.hx.step(DT, tg[0]), dyn.hy.step(DT, tg[1])];
      let lean;
      const lp0 = pathAt('lean', t), lt = this.leanT.at(t);
      if (lp0) { const a = lp0.fn(t), b = lp0.fn(Math.min(t + DT, lp0.t1 - 1e-6)); lean = a; follow(dyn.lean, a, (b - a) / DT, lt); }
      else lean = dyn.lean.step(DT, lt + 360 * Math.round((dyn.lean.y - lt) / 360) + 1.8 * nz * noise1(t * 0.8, 3));   // 空翻过的整圈不倒转回去
      const head = dyn.head.step(DT, this.headT.at(t) + 3.5 * nz * noise1(t * 1.0, 4));
      const upv = [D * Math.sin(lean * Math.PI / 180), -Math.cos(lean * Math.PI / 180)], fwv = [-upv[1] * D, upv[0] * D];
      const local = (o, a) => [o[0] + (fwv[0] * a[0] - upv[0] * a[1]) * H, o[1] + (fwv[1] * a[0] - upv[1] * a[1]) * H];
      const feet = {};
      for (const k of ['F', 'B']) {
        const dx = dyn['f' + k + 'x'], dy = dyn['f' + k + 'y'];
        // 离地的脚用"相对胯"的弹簧：整个人飞得再快，脚也不会被甩在后面
        if (fm[k].mode === 'path') {
          let g = fm[k].fn(t);
          if (pblend[k]) { const u = E.inOut((t - pblend[k].t0) / pblend[k].dur); g = [lerp(pblend[k].from[0], g[0], u), lerp(pblend[k].from[1], g[1], u)]; if (u >= 1) pblend[k] = null; }
          feet[k] = g; dx.snap(g[0] - hip[0]); dy.snap(g[1] - hip[1]);
        } else if (fm[k].mode === 'free') {
          const g = local([0, 0], typeof fm[k].arg === 'function' ? fm[k].arg(t) : fm[k].arg);
          if (i === 0) { dx.snap(g[0]); dy.snap(g[1]); }
          feet[k] = [hip[0] + dx.step(DT, g[0]), Math.min(hip[1] + dy.step(DT, g[1]), 0)];
        } else if (fblend[k]) {
          const g = this.feet[k].target(t), u = E.inOut((t - fblend[k].t0) / fblend[k].dur), sp = [hip[0] + dx.step(DT, g[0] - hip[0]), hip[1] + dy.step(DT, g[1] - hip[1])];   // 从实际位置直接过渡到这一步的落脚点（旧的起点早就过时了）
          feet[k] = [lerp(sp[0], g[0], u), Math.min(lerp(sp[1], g[1], u), 0)];
          if (u >= 1) { fblend[k] = null; dx.snap(g[0] - hip[0]); dy.snap(g[1] - hip[1]); }
        } else { feet[k] = ground[k]; dx.snap(ground[k][0] - hip[0]); dy.snap(ground[k][1] - hip[1]); }
      }
      lastFoot.F = feet.F; lastFoot.B = feet.B;
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
        if (m.mode === 'free') { const q = typeof m.arg === 'function' ? m.arg(t) : m.arg; g = [b0.sh[0] + D * q[0] * H, b0.sh[1] + q[1] * H]; }
        else if (m.mode === 'world') g = typeof m.arg === 'function' ? m.arg(t) : m.arg;
        else if (m.mode === 'pose') { const q = typeof m.arg === 'function' ? m.arg(t) : m.arg; g = [b0.sh[0] + D * q[0] * H, b0.sh[1] + q[1] * H]; exact = true; }   // 同 free，但不走弹簧（跑步摆臂这种快速循环）
        else if (m.mode === 'local') g = local(b0.sh, typeof m.arg === 'function' ? m.arg(t) : m.arg);   // 跟着身体转（空翻、躺着、跑步摆臂）
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
      R.hip.push(hip); R.lean.push(lean); R.head.push(head); R.hF.push(hp.F); R.hB.push(hp.B); R.fF.push(feet.F); R.fB.push(feet.B); R.obj.push(os); R.dir.push(D);
    }
    this.N = N;
    if (opt.sfx === false) return this;              // 预演（只为了算出某个时刻的位置）：不登记音效
    // 脚步声：每次挪脚结束落地时（真实时间）
    for (const k of ['F', 'B']) for (const m of this.feet[k].m) if (m.sfx && m.t > -1e8 && m.dur > 0)
      cues.add(this.real(m.t + m.dur), 'step', { v: 0.8, ...(typeof m.sfx === 'object' ? m.sfx : {}) });
    for (const e of this.sfxList) cues.add(this.real(e.t), e.type, e.o);
    return this;
  }
  real(ta) { return this.clock ? this.clock.real(ta) : ta; }
  stateAt(ta) {
    const R = this.rec, x = clamp(ta / DT, 0, this.N - 1.001), i = Math.floor(x), u = x - i;
    const L = (a, b) => (a === null || b === null ? a || b : Array.isArray(a) ? a.map((v, n) => lerp(v, b[n], u)) : lerp(a, b, u));
    const g = k => L(R[k][i], R[k][i + 1]);
    return { t: ta, hip: g('hip'), lean: g('lean'), head: g('head'), hF: g('hF'), hB: g('hB'), fF: g('fF'), fB: g('fB'), obj: g('obj'), dir: R.dir[u < 0.5 ? i : i + 1] };
  }
  jointsAt(ta) { const s = this.stateAt(ta); return body(s, this.H, s.dir); }
  // 画：先拖影（手脚快速移动时沿轨迹的带子），再画人
  draw(ctx, ta, o = {}) {
    const H = this.H;
    for (const k of ['aF', 'aB', 'lF', 'lB']) {
      // 拖影只看手脚相对身体的挥动（整个人在飞、在掉的时候不画）
      const hip = this.stateAt(ta).hip, pts = [];
      for (let n = 7; n >= 0; n--) { const j = this.jointsAt(ta - n / 160), e = j[k][2]; pts.push([e[0] - j.hip[0] + hip[0], e[1] - j.hip[1] + hip[1]]); }
      const sp = Math.hypot(pts[7][0] - pts[0][0], pts[7][1] - pts[0][1]) / (7 / 160) / H;
      if (sp > 3.2) smear(ctx, pts, P.lw * H * 1.05, this.color, clamp((sp - 3.2) / 4, 0, 0.9));
    }
    paint(ctx, this.jointsAt(ta), o.color || this.color, H, this.headStyle);
  }
}

module.exports = { Actor2, Clock, DT };
