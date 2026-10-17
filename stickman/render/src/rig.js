// 火柴人骨骼与动画
// 姿势 = 一组角度（度）。四肢角度都相对躯干：0 = 顺着躯干往下，正 = 朝面向的方向转。
//   lean   躯干前倾（0 = 直立，90 = 脸朝下趴平，-90 = 仰面躺平）
//   head   头相对躯干的低头角（正 = 低头，负 = 抬头）
//   aF/aB  前臂/后臂 [肩角, 肘弯]   肘弯正 = 小臂往前上方折
//   lF/lB  前腿/后腿 [髋角, 膝弯]   膝弯正 = 小腿往后折
// 比例按站立身高 H，全部实测自原片：头直径 0.23H，线宽 0.052H，躯干 0.30H，腿 0.45H，臂 0.38H
'use strict';
const K = require('./core');
const { clamp, lerp, E, D2R, rgba, mix } = K;
const cues = require('./cues');

const P = {
  headR: 0.115, lw: 0.052, torso: 0.29, shoulderDrop: 0.035,
  upper: 0.19, fore: 0.185, thigh: 0.225, shin: 0.225,
};
const CH = ['lean', 'head', 'aF0', 'aF1', 'aB0', 'aB1', 'lF0', 'lF1', 'lB0', 'lB1'];

// 姿势对象 ↔ 平铺通道
function flat(p) {
  return {
    lean: p.lean ?? 0, head: p.head ?? 0,
    aF0: p.aF?.[0] ?? 12, aF1: p.aF?.[1] ?? 10, aB0: p.aB?.[0] ?? -12, aB1: p.aB?.[1] ?? 10,
    lF0: p.lF?.[0] ?? 10, lF1: p.lF?.[1] ?? 3, lB0: p.lB?.[0] ?? -10, lB1: p.lB?.[1] ?? 3,
  };
}
function lerpPose(a, b, u) { const o = {}; for (const k of CH) o[k] = lerp(a[k], b[k], u); return o; }

// 正向运动学：返回所有关节的世界坐标（y 向下）
function solve(f, hx, hy, dir, Hs) {
  const v = b => [dir * Math.sin(b * D2R), Math.cos(b * D2R)];
  const up = [dir * Math.sin(f.lean * D2R), -Math.cos(f.lean * D2R)];
  const hip = [hx, hy];
  const neck = [hx + up[0] * P.torso * Hs, hy + up[1] * P.torso * Hs];
  const sh = [neck[0] - up[0] * P.shoulderDrop * Hs, neck[1] - up[1] * P.shoulderDrop * Hs];
  const base = -f.lean;                        // "顺着躯干往下"的绝对角
  const limb = (o, a0, a1, L0, L1, knee) => {
    const b0 = base + a0, b1 = knee ? b0 - a1 : b0 + a1;
    const d0 = v(b0), d1 = v(b1);
    const m = [o[0] + d0[0] * L0 * Hs, o[1] + d0[1] * L0 * Hs];
    return [o, m, [m[0] + d1[0] * L1 * Hs, m[1] + d1[1] * L1 * Hs]];
  };
  // 头：沿躯干方向再按低头角转一下，下沿刚好压在脖子上
  const hb = base + 180 + f.head;
  const hd = v(hb);
  const head = [neck[0] + hd[0] * P.headR * 0.92 * Hs, neck[1] + hd[1] * P.headR * 0.92 * Hs];
  return {
    hip, neck, sh, head,
    aF: limb(sh, f.aF0, f.aF1, P.upper, P.fore, false),
    aB: limb(sh, f.aB0, f.aB1, P.upper, P.fore, false),
    lF: limb(hip, f.lF0, f.lF1, P.thigh, P.shin, true),
    lB: limb(hip, f.lB0, f.lB1, P.thigh, P.shin, true),
  };
}
// 最低点（含线宽、头半径）离胯的距离：用来把人"放"在地上
function lowest(j, Hs) {
  const r = P.lw * Hs / 2;
  let m = Math.max(j.hip[1], j.neck[1]) + r;
  for (const k of ['aF', 'aB', 'lF', 'lB']) for (const p of j[k]) m = Math.max(m, p[1] + r);
  m = Math.max(m, j.head[1] + P.headR * Hs);
  return m;
}

// —— 循环动作：走、跑 ——
// 返回姿势；phase 以弧度计，一步 = π
function cyclePose(kind, ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  const swingF = Math.max(0, c), swingB = Math.max(0, -c);
  if (kind === 'run') {
    return flat({
      lean: 16, head: -6,
      lF: [38 * s + 18, 20 + 95 * Math.pow(swingF, 1.2)], lB: [-38 * s + 18, 20 + 95 * Math.pow(swingB, 1.2)],
      aF: [-50 * s + 10, 95], aB: [50 * s + 10, 95],
    });
  }
  if (kind === 'sneak') {
    return flat({
      lean: 20, head: -10,
      lF: [22 * s + 25, 45 + 30 * swingF], lB: [-22 * s + 25, 45 + 30 * swingB],
      aF: [30, 110], aB: [-10, 90],
    });
  }
  return flat({
    lean: 4, head: 0,
    lF: [24 * s + 3, 6 + 42 * Math.pow(swingF, 1.5)], lB: [-24 * s + 3, 6 + 42 * Math.pow(swingB, 1.5)],
    aF: [-20 * s, 18 + 12 * swingB], aB: [20 * s, 18 + 12 * swingF],
  });
}
const CYCLE = {   // 每步前进的距离（单位 H）；跑步有腾空起伏
  walk: { stride: 0.36, bob: 0 }, run: { stride: 0.62, bob: 0.06 }, sneak: { stride: 0.26, bob: 0 },
};

// —— 角色 ——
class Actor {
  constructor(o = {}) {
    this.H = o.H || 300;
    this.color = o.color || K.C.yellow;
    this.headStyle = o.head || 'fill';      // 'fill' 实心（编程集）| 'ring' 空心（数学集）
    this.keys = [];
    this.cycles = [];
    this.holds = [];
    this.visible = o.visible || null;      // [t0, t1]
    this.ghost = o.ghost ?? true;
  }
  // 关键帧：pose 可以只写部分通道，其余沿用上一帧
  // o: { x, y(只在 free 时用), dir, lift, ease, free }
  key(t, pose = {}, o = {}) {
    const prev = this.keys[this.keys.length - 1];
    const base = prev ? { ...prev.f } : flat({});
    const f = { ...base };
    const add = flat(pose);
    for (const k of CH) {
      const [nm, idx] = k.length > 2 && /\d$/.test(k) ? [k.slice(0, 2), +k[2]] : [k, null];
      const given = idx === null ? pose[nm] !== undefined : pose[nm] !== undefined;
      if (given) f[k] = add[k];
    }
    this.keys.push({
      t, f, ease: o.ease || 'inOut',
      x: o.x ?? prev?.x ?? 0, y: o.y ?? prev?.y ?? 0, dir: o.dir ?? prev?.dir ?? 1,
      lift: o.lift ?? (o.keepLift ? prev?.lift : 0) ?? 0, free: o.free ?? false,
    });
    this.keys.sort((a, b) => a.t - b.t);
    return this;
  }
  // 循环动作：在 [t0, t1] 内从 x0 走/跑到 x1，前后各 blend 秒和关键帧姿势过渡
  // 每一步脚落地时自动登记脚步声（原片：58 Hz 的超低频闷点，走路约每秒 6 步）
  cycle(t0, t1, kind, x0, x1, blend = 0.18, steps = true) {
    const c = { t0, t1, kind, x0, x1, blend };
    this.cycles.push(c);
    if (steps) {
      let last = null;
      for (let t = t0; t <= t1; t += 1 / 240) {
        const ph = this.cyclePhase(c, t), k = Math.floor((ph - Math.PI / 2) / Math.PI);
        if (last !== null && k > last) cues.add(t, 'step', { run: kind === 'run', v: kind === 'sneak' ? 0.5 : 1 });
        last = k;
      }
    }
    return this;
  }
  cyclePhase(c, t) {
    const cfg = CYCLE[c.kind], tt = clamp(t, c.t0, c.t1), span = c.t1 - c.t0, acc = Math.min(0.25, span / 3);
    const vmax = 1 / (span - acc), s = tt - c.t0;
    const k = s < acc ? 0.5 * vmax * s * s / acc : s > span - acc ? 1 - 0.5 * vmax * (span - s) ** 2 / acc : vmax * (s - acc / 2);
    return Math.abs(lerp(c.x0, c.x1, k) - c.x0) / (cfg.stride * this.H) * Math.PI;
  }
  // 手里拿东西：draw(ctx, pt, ang, actor) 画在手的位置
  hold(t0, t1, hand, draw) { this.holds.push({ t0, t1, hand, draw }); return this; }

  state(t) {
    const ks = this.keys;
    let i = 0;
    while (i < ks.length - 1 && ks[i + 1].t <= t) i++;
    const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
    const u = b === a ? 0 : clamp((t - a.t) / (b.t - a.t));
    const eu = (E[b.ease] || E.inOut)(u);
    let f = b === a ? a.f : lerpPose(a.f, b.f, eu);
    let x = lerp(a.x, b.x, eu), y = lerp(a.y, b.y, eu), lift = lerp(a.lift, b.lift, eu);
    const dir = u >= 1 ? b.dir : a.dir;
    const free = u >= 1 ? b.free : a.free;
    for (const c of this.cycles) {
      if (t < c.t0 - c.blend || t > c.t1 + c.blend) continue;
      const w = Math.min(E.smooth((t - (c.t0 - c.blend)) / c.blend), E.smooth((c.t1 + c.blend - t) / c.blend));
      const cfg = CYCLE[c.kind];
      // 起步和停步时速度渐变，脚不打滑
      const tt = clamp(t, c.t0, c.t1);
      const span = c.t1 - c.t0, acc = Math.min(0.25, span / 3);
      const g = s => { // 距离积分（梯形速度曲线）
        const vmax = 1 / (span - acc);
        if (s < acc) return 0.5 * vmax * s * s / acc;
        if (s > span - acc) { const r = span - s; return 1 - 0.5 * vmax * r * r / acc; }
        return vmax * (s - acc / 2);
      };
      const k = g(tt - c.t0);
      const cx = lerp(c.x0, c.x1, k);
      const dist = Math.abs(cx - c.x0);
      const ph = dist / (cfg.stride * this.H) * Math.PI;
      f = lerpPose(f, cyclePose(c.kind, ph), w);
      x = lerp(x, cx, w);
      lift += w * cfg.bob * this.H * Math.abs(Math.sin(ph)) * (t > c.t0 && t < c.t1 ? 1 : 0);
    }
    return { f, x, y, lift, dir, free };
  }
  joints(t) {
    const s = this.state(t), Hs = this.H;
    let j = solve(s.f, 0, 0, s.dir, Hs);
    const hy = s.free ? s.y : -lowest(j, Hs) - s.lift;
    j = solve(s.f, s.x, hy, s.dir, Hs);
    j.dir = s.dir; j.s = s;
    return j;
  }
  // 手的位置（给道具、特效用）
  hand(t, which = 'aF') { return this.joints(t)[which][2]; }
  // 某个姿势"放在地上"时胯的 y：从自由飞行（free）落地接回地面时用
  restHip(pose, dir = 1) { return -lowest(solve(flat(pose), 0, 0, dir, this.H), this.H); }

  draw(ctx, t) {
    if (this.visible && (t < this.visible[0] || t > this.visible[1])) return;
    const j = this.joints(t);
    // 运动残影：快速动作时，把前几毫秒的姿势用暗一点的颜色先画上（黑底上等效半透明）
    if (this.ghost) {
      const dt = 1 / 90;
      const jp = this.joints(t - dt);
      let sp = 0;
      for (const k of ['aF', 'aB', 'lF', 'lB']) sp = Math.max(sp, Math.hypot(j[k][2][0] - jp[k][2][0], j[k][2][1] - jp[k][2][1]));
      sp = Math.max(sp, Math.hypot(j.head[0] - jp.head[0], j.head[1] - jp.head[1]));
      const speed = sp / dt / this.H;          // 每秒多少个身高
      if (speed > 5) {
        const n = 3, a = clamp((speed - 5) / 8, 0, 0.45);
        for (let g = n; g >= 1; g--) this.paint(ctx, this.joints(t - dt * g * 0.8), mix(K.C.bg, this.color, a * (1 - g / (n + 1))));
      }
    }
    for (const h of this.holds) if (t >= h.t0 && t <= h.t1 && h.behind) h.draw(ctx, j, t, this);
    this.paint(ctx, j, this.color);
    for (const h of this.holds) if (t >= h.t0 && t <= h.t1 && !h.behind) h.draw(ctx, j, t, this);
  }
  paint(ctx, j, col) {
    const Hs = this.H, lw = P.lw * Hs;
    ctx.save();
    ctx.strokeStyle = rgba(col); ctx.fillStyle = rgba(col);
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    const poly = pts => { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    poly(j.aB); poly(j.lB);
    poly([j.hip, j.neck]);
    poly(j.lF); poly(j.aF);
    ctx.stroke();
    const r = P.headR * Hs;
    ctx.beginPath();
    if (this.headStyle === 'ring') {
      ctx.arc(j.head[0], j.head[1], r - lw / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.arc(j.head[0], j.head[1], r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

module.exports = { Actor, solve, flat, lowest, cyclePose, P };
