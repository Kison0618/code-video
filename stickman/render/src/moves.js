// 成套动作：挨打的反应（后仰 / 击退 / 被打飞空翻 / 倒地 / 爬起来）、跑、跳
// 全部是 Actor2 底层意图（胯、前倾、脚、手、精确轨迹）的组合，require 之后直接挂在 Actor2 上：
//   a.flinch(t)                                    小后仰
//   a.knockback(t, { dist: 90 })                   被推着往后滑一段，站稳
//   const L = a.launch(t, { vx: -700, vy: -900, turns: 1, land: 'back' })   被打飞，空翻 turns 圈，仰面 / 脸朝下 / 双脚落地
//   a.getUp(L.t + 0.6, { from: 'back' })           爬起来，返回站稳的时间
//   const r = a.run(t, x1, { speed: 1100, stop: true })  跑到 x1（v0 接着上一段的速度跑；stop:false 不刹车）
//   const s = a.slide(t, { v0: r.v, dur: 0.5 })    滑铲（从线下面钻过去）
//   const w = a.walk(t, x1)                        走到 x1（胯的位置），返回到达时间
//   const k = a.kneel(t, { front: x })              单膝跪下（前脚踩在 x，后膝着地），a.rise(t) 站起来
//   a.jump(t, { to: x, h: 160, dur: 0.55 })        跳（running: true 跑着起跳不下蹲；skid: 落地后往前滑的距离）
// 时间都是动画时间；返回值里的时间也是。
'use strict';
const K = require('./core');
const { lerp, E, clamp } = K;
const { Actor2 } = require('./actor2');
const { G } = require('./phys');

const A = Actor2.prototype;
const cur = (a, t) => ({ hip: a.hipT.at(t), lean: a.leanT.at(t), head: a.headT.at(t), fF: a.feet.F.at(t), fB: a.feet.B.at(t) });

// 小后仰：被轻轻打到 / 吓一跳
A.flinch = function (t, o = {}) {
  const k = (o.amt ?? 1) * 1.4, D = this.dirAt(t), H = this.H, c = cur(this, t), back = o.hold ?? 0.22;
  this.hip(t, [c.hip[0] - D * 0.04 * H * k, c.hip[1] + 0.02 * H * k]).lean(t, c.lean - 16 * k).head(t, c.head - 22 * k);
  this.hand('F', t, 'local', [0.1, 0.1]).hand('B', t, 'local', [0.06, 0.12]);
  this.hip(t + back, c.hip, 0.2).lean(t + back, c.lean, 0.2).head(t + back + 0.05, c.head, 0.25);
  this.hand('F', t + back + 0.1, 'free', [0.05, 0.35]).hand('B', t + back + 0.1, 'free', [-0.04, 0.35]);
  return t + back + 0.3;
};

// 击退：整个人被推着往后滑（脚贴地滑，不抬脚），手往前甩，最后站稳
A.knockback = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t), d = o.dist ?? 90, dur = o.dur ?? 0.38;
  const x = c.hip[0] - D * d;
  this.hip(t, [x, -this.STAND + 0.07 * H], dur, 'out3').lean(t, -22).head(t, -20);
  this.foot('F', t, [c.fF[0] - D * d * 0.95, 0], dur, 0, 'out3', false).foot('B', t, [c.fB[0] - D * d * 1.05, 0], dur, 0, 'out3', false);
  this.hand('F', t, 'local', [0.24, -0.02]).hand('B', t, 'local', [0.2, 0.02]);
  if (o.sfx !== false) this.sfx(t + 0.02, 'recoil_slide', { dur });
  this.lean(t + dur * 0.8, 8).head(t + dur * 0.8, 6);
  this.hip(t + dur + 0.1, [x, -this.STAND + 0.02 * H], 0.3).lean(t + dur + 0.3, 2, 0.3).head(t + dur + 0.3, 0, 0.3);
  this.hand('F', t + dur, 'free', [0.05, 0.35]).hand('B', t + dur, 'free', [-0.04, 0.35]);
  return { t: t + dur + 0.4, x };
};

// 被打飞：胯走抛物线（和物理同一个重力），身体在空中转 turns 圈，按 land 落地
//   land: 'back' 仰面躺下（头朝飞的方向）/ 'front' 脸朝下趴着 / 'feet' 双脚落地蹲一下
//   from: 起点（默认当前胯的位置），用来做"从天上掉下来"
A.launch = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t);
  const [x0, y0] = o.from || c.hip, vx = o.vx ?? -D * 650, vy = o.vy ?? -900, land = o.land || 'back';
  const yL = land === 'feet' ? -this.STAND + 0.12 * H : -0.03 * H;
  // 落地时刻：y0 + vy τ + G τ²/2 = yL
  const tau = (-vy + Math.sqrt(vy * vy + 2 * G * (yL - y0))) / G, tL = t + tau, xL = x0 + vx * tau;
  const spin = Math.sign(vx) === -D ? -1 : 1;            // 往后飞就往后翻
  const l0 = o.lean0 ?? c.lean;
  const lEnd = (land === 'back' ? -90 : land === 'front' ? 90 : 10) + spin * 360 * (o.turns ?? 0);
  this.path('hip', t, tL, s => [x0 + vx * (s - t), y0 + vy * (s - t) + 0.5 * G * (s - t) * (s - t)]);
  this.path('lean', t, tL, s => lerp(l0, lEnd, 1 - Math.pow(1 - (s - t) / tau, 1.6)));
  // 空中：收腿、手乱甩
  if (land === 'front') this.footFree('F', t, [0.02, 0.4]).footFree('B', t, [-0.1, 0.38]);    // 脸朝下掉：腿拖在后面
  else this.footFree('F', t, [0.22, 0.2]).footFree('B', t, [0.04, 0.3]);                    // 收腿
  this.hand('F', t, 'local', s => [0.2 * Math.cos((s - t) * 13), -0.2 + 0.1 * Math.sin((s - t) * 13)]);
  this.hand('B', t, 'local', s => [-0.18 * Math.cos((s - t) * 11), -0.12 + 0.1 * Math.cos((s - t) * 11)]);
  if (land !== 'front') this.footFree('F', tL - 0.12, land === 'back' ? [0.32, 0.3] : [0.05, 0.42]).footFree('B', tL - 0.12, land === 'back' ? [0.12, 0.42] : [-0.05, 0.42]);
  const slide = land === 'feet' ? vx * 0.06 : vx * 0.14, xs = xL + slide;
  if (land === 'back') {         // 仰面：头朝 -D 躺着，腿在 +D 那边弯起来
    this.foot('F', tL, [xs + D * 0.34 * H, 0], 0.14, 0, 'out3', false).foot('B', tL, [xs + D * 0.26 * H, 0], 0.16, 0, 'out3', false);
    this.hand('F', tL, 'local', [-0.08, 0.3]).hand('B', tL, 'local', [0.02, 0.28]);
  } else if (land === 'front') { // 脸朝下：头朝 +D，腿伸直在身后
    this.foot('F', tL, [xs - D * 0.44 * H, 0], 0.1, 0, 'out3', false).foot('B', tL, [xs - D * 0.4 * H, 0], 0.12, 0, 'out3', false);
    this.hand('F', tL, 'local', [0.18, 0.12]).hand('B', tL, 'local', [0.1, 0.16]);
  } else {
    this.foot('F', tL, [xs + D * 0.1 * H, 0], 0.06, 0, 'out3', { v: 1 }).foot('B', tL, [xs - D * 0.1 * H, 0], 0.07, 0, 'out3', false);
    this.hand('F', tL, 'free', [0.14, 0.2]).hand('B', tL, 'free', [-0.12, 0.22]);
  }
  this.hip(tL, [xs, land === 'feet' ? -this.STAND + 0.16 * H : -0.026 * H], 0.25, 'out3').lean(tL, lEnd).head(tL, land === 'feet' ? 20 : 0);
  if (land === 'feet') this.hip(tL + 0.3, [xs, -this.STAND], 0.35).lean(tL + 0.3, 2, 0.3);
  if (land !== 'feet') this.sfx(tL, 'body', { v: Math.min(1, Math.hypot(vx, vy) / 1400) });
  return { t: tL, x: xs, lean: lEnd };
};

// 爬起来：仰面 → 坐起 → 手撑地前倾 → 站起；脸朝下 → 手撑起上身 → 跪 → 站起。返回站稳的时间
A.getUp = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t), from = o.from || 'back', s = o.speed ?? 1;
  const x = c.hip[0], T = k => t + k / s;
  // 角度先归一到 -180..180 附近，免得弹簧把空翻过的圈数倒转回去
  const l0 = c.lean, base = Math.round(l0 / 360) * 360;
  if (from === 'back') {         // 头在 -D 那边，脚在 +D 那边
    this.hand('B', T(0), 'world', [x - D * 0.1 * H, 0]).hand('F', T(0.05), 'world', [x - D * 0.04 * H, 0]);
    this.lean(T(0.05), base - 25).head(T(0.05), 20).hip(T(0.05), [x, -0.06 * H]);
    this.foot('F', T(0.15), [x + D * 0.22 * H, 0], 0.2, 8, 'inOut', false).foot('B', T(0.25), [x + D * 0.12 * H, 0], 0.2, 8, 'inOut', false);
    this.hip(T(0.5), [x + D * 0.14 * H, -0.18 * H], 0.25).lean(T(0.5), base + 40).head(T(0.5), 10);
    this.hand('F', T(0.5), 'local', [0.12, 0.18]).hand('B', T(0.55), 'local', [0.05, 0.22]);
    const xs = x + D * 0.16 * H;
    this.hip(T(0.85), [xs, -this.STAND], 0.35).lean(T(0.85), base + 4, 0.35).head(T(0.9), -4, 0.3);
    this.foot('B', T(0.95), [xs - D * 0.08 * H, 0], 0.2, 12);
    this.hand('F', T(1.0), 'free', [0.05, 0.35]).hand('B', T(1.0), 'free', [-0.04, 0.35]);
    return { t: T(1.3), x: xs };
  }
  // 脸朝下：头在 +D 那边
  const sh = x + D * 0.27 * H;
  this.hand('F', T(0), 'world', [sh + D * 0.02 * H, 0]).hand('B', T(0.05), 'world', [sh - D * 0.04 * H, 0]);
  this.lean(T(0.1), base + 62).head(T(0.1), -30).hip(T(0.1), [x, -0.05 * H], 0.25);               // 撑起上身
  this.foot('F', T(0.35), [x + D * 0.02 * H, 0], 0.22, 10, 'inOut', false);                         // 收腿成跪
  this.hip(T(0.35), [x + D * 0.04 * H, -0.2 * H], 0.25).lean(T(0.35), base + 48);
  const xs = x + D * 0.12 * H;
  this.foot('B', T(0.6), [xs - D * 0.07 * H, 0], 0.2, 10).foot('F', T(0.65), [xs + D * 0.08 * H, 0], 0.18, 8);
  this.hip(T(0.65), [xs, -this.STAND], 0.4).lean(T(0.65), base + 4, 0.4).head(T(0.7), 0, 0.3);
  this.hand('F', T(0.7), 'free', [0.05, 0.35]).hand('B', T(0.7), 'free', [-0.04, 0.35]);
  return { t: T(1.15), x: xs };
};

// 跑：按经典跑步周期生成（接触 → 下压 → 蹬地 → 腾空），不是"走得快一点"
//   胯按精确轨迹（起跑加速 / 可从 v0 接着跑 / 可刹车），高度随步子一起一伏；
//   每只脚：落地时踩在胯前 0.27H（前腿几乎伸直、胯压到最低），支撑期钉在地上不动，蹬到胯后 0.25H 离地；
//   摆动期：蹬完的腿先在身后伸直停一下 → 迅速折起（脚跟踢向屁股）→ 提膝往前送 → 伸出去落地。
//   手肘弯成直角，和对侧腿同步前后摆。参数按原片近景逐帧实测：上身几乎直立（前倾不到 10°）、
//   两腿前后劈得很开、每步只有 3–4 帧（约 0.15 秒）、步幅约 0.7H。
const catmull = (pts, u) => {          // pts: [[knot, value]...]，knot 递增；u 在 0..1
  let i = 0; while (i < pts.length - 2 && u > pts[i + 1][0]) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const h = p2[0] - p1[0] || 1e-6, w = clamp((u - p1[0]) / h);
  const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0] || 1e-6) * h, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0] || 1e-6) * h;
  const w2 = w * w, w3 = w2 * w;
  return (2 * w3 - 3 * w2 + 1) * p1[1] + (w3 - 2 * w2 + w) * m1 + (-2 * w3 + 3 * w2) * p2[1] + (w3 - w2) * m2;
};
A.run = function (t0, x1, o = {}) {
  const D = this.dirAt(t0), H = this.H, c = cur(this, t0), x0 = c.hip[0];
  const v = o.speed ?? 4.5 * H, v0 = o.v0 ?? 0, ramp = o.ramp ?? 0.35, stop = o.stop ?? true, sg = Math.sign(x1 - x0) || D;
  const dist = Math.abs(x1 - x0), da = (v0 + v) / 2 * ramp, dd = stop ? v * ramp / 2 : 0;
  const cruise = Math.max(0, dist - da - dd), dur = ramp + cruise / v + (stop ? ramp : 0), t1 = t0 + dur;
  const vel = s => { const a = s - t0; if (a < ramp) return lerp(v0, v, a / ramp); if (stop && s > t1 - ramp) return v * Math.max(0, t1 - s) / ramp; return v; };
  const S = s => {                                             // 跑过的距离
    const a = clamp(s - t0, 0, dur);
    let d = a < ramp ? v0 * a + (v - v0) * a * a / (2 * ramp) : da + v * (a - ramp);
    if (stop && s > t1 - ramp) { const b = Math.max(0, t1 - s); d = dist - v * b * b / (2 * ramp); }
    return d;
  };
  const X = s => x0 + sg * S(s);
  const T = clamp(0.15 * Math.sqrt(4.5 * H / v), 0.12, 0.3);  // 每一步的时间
  const k = s => clamp(vel(s) / v, 0.3, 1);                    // 速度系数：起跑和刹车时步子小
  const h0 = this.STAND - 0.095 * H;
  // 落地时刻：两只脚轮流，第一步 0.4T 之后
  const first = (c.fF[0] - c.fB[0]) * sg < 0 ? 'F' : 'B';     // 后面那只脚先迈
  const plan = { F: [], B: [] };
  let side = first;
  for (let tc = t0 + 0.4 * T; tc < t1 - (stop ? 0.5 * T : 0); tc += T) { plan[side].push(tc); side = side === 'F' ? 'B' : 'F'; }
  const tcs = [...plan.F, ...plan.B].sort((a, b) => a - b);
  for (const f of ['F', 'B']) {
    const ev = [{ tc: t0 - 1, to: t0, x: c['f' + f][0] }];     // 起跑前：脚在原地
    if (f !== first) ev[0].to = Math.min(t0 + 0.4 * T + 0.5 * T, (plan[f][0] ?? t1) - 0.12);
    for (const tc of plan[f]) {
      const kk = k(tc), x = X(tc) + sg * 0.27 * H * kk;
      let to = tc + 0.02; while (to < tc + 2 * T - 0.12 && (X(to) - x) * sg < 0.25 * H * kk) to += 1 / 240;
      ev.push({ tc, to: Math.min(to, tc + 2 * T - 0.12), x, kk });
    }
    const fn = s => {
      let i = ev.length - 1; while (i > 0 && s < ev[i].tc) i--;
      const e = ev[i], nx = ev[i + 1];
      if (s <= e.to || !nx) return [e.x, 0];                    // 支撑：钉在地上
      const u = clamp((s - e.to) / (nx.tc - e.to)), kk = nx.kk;
      const r0 = e.x - X(e.to), r1 = nx.x - X(nx.tc);            // 相对胯：离地时在后面，落地时在前面
      const rx = catmull([[0, r0], [0.25, r0 - sg * 0.07 * H * kk], [0.5, -sg * 0.04 * H * kk], [0.78, r1 + sg * 0.05 * H * kk], [1, r1]], u);
      const lift = Math.max(0, H * kk * catmull([[0, 0], [0.25, 0.1], [0.5, 0.27], [0.78, 0.12], [1, 0]], u));
      return [X(s) + rx, -lift];
    };
    this.footPath(f, t0, fn);
  }
  for (const tc of tcs) this.sfx(tc, 'step', { run: 1, v: 0.45 + 0.4 * k(tc) });
  // 胯：落地后压到最低、腾空时最高
  const tc0 = tcs[0] ?? t0;
  const yRun = s => -h0 + 0.035 * H * k(s) * Math.cos(2 * Math.PI * (s - tc0) / T);   // 落地那一刻最低（前腿伸出去够地）
  this.path('hip', t0, t1, s => [X(s), lerp(c.hip[1], yRun(s), E.out(clamp((s - t0) / 0.2)))]);
  this.lean(t0, (o.lean ?? 8) * sg * D).head(t0, -4);
  // 手：直角摆臂；F 脚在前时 B 手在前
  const tF = plan.F[0] ?? t0;
  const front = [0.14, 0.1], back = [-0.1, 0.2];
  const arm = (ph, amp) => [lerp(back[0], front[0], ph) * amp + 0.02 * (1 - amp), lerp(back[1], front[1], ph) * amp + 0.3 * (1 - amp)];
  this.hand('F', t0, 'local', s => arm((1 - Math.cos(Math.PI * (s - tF) / T)) / 2, k(s)));
  this.hand('B', t0, 'local', s => arm((1 + Math.cos(Math.PI * (s - tF) / T)) / 2, k(s)));
  if (!stop) this.hip(t1, [x1, yRun(t1)]);                     // 不刹车：之后的动作（起跳、滑铲）从这里接
  else {                                                        // 刹住：脚收到身子下面
    const last = tcs[tcs.length - 1] ?? t0, lf = plan.F.includes(last) ? 'B' : 'F';
    this.foot(lf, Math.max(last + 0.04, t1 - 0.18), [x1 + sg * 0.09 * H, 0], 0.16, 10, 'inOut', { run: 1, v: 0.8 });
    this.foot(lf === 'F' ? 'B' : 'F', t1 + 0.04, [x1 - sg * 0.07 * H, 0], 0.16, 10);
    this.hip(t1, [x1, -this.STAND + 0.05 * H]).lean(t1, -6 * sg * D).hip(t1 + 0.25, [x1, -this.STAND], 0.25).lean(t1 + 0.25, 2, 0.25).head(t1, 0);
    this.hand('F', t1, 'free', [0.08, 0.3]).hand('B', t1, 'free', [-0.02, 0.33]);
  }
  return { t: t1, x: x1, v: sg * v, X };
};

// 滑铲：带着跑步的速度往前滑（越滑越慢），身子后仰贴地，前腿伸直、后腿折在身下；结束时接着跑
A.slide = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t), sg = Math.sign(o.v0) || D;
  const v0 = Math.abs(o.v0 ?? 3.6 * H), v1 = v0 * (o.keep ?? 0.6), dur = o.dur ?? 0.5, x0 = c.hip[0];
  const X = s => { const a = clamp(s - t, 0, dur); return x0 + sg * (v0 * a - (v0 - v1) * a * a / (2 * dur)); };
  const yLow = -0.15 * H;
  const Y = s => { const a = s - t; return a < 0.12 ? lerp(c.hip[1], yLow, E.out(a / 0.12)) : a > dur - 0.08 ? lerp(yLow, -0.3 * H, E.in((a - dur + 0.08) / 0.08)) : yLow; };
  this.path('hip', t, t + dur, s => [X(s), Y(s)]);
  this.lean(t, -38 * sg * D).head(t, 18);
  this.footPath('F', t, s => [X(s) + sg * 0.36 * H, 0]).footPath('B', t, s => [X(s) - sg * 0.1 * H, 0]);
  this.hand('F', t, 'local', [-0.18, -0.06]).hand('B', t + 0.03, 'local', [0.12, 0.24]);
  this.sfx(t + 0.06, 'recoil_slide', { dur: dur - 0.1 });
  this.hip(t + dur, [X(t + dur), -0.3 * H]).lean(t + dur - 0.1, 14 * sg * D);
  return { t: t + dur, x: X(t + dur), v: sg * v1 };
};

// 跳：预备下蹲（running 时跳过）→ 抛物线 → 落地蹲一下 → 站起
A.jump = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t), [x0, y0] = c.hip, dur = o.dur ?? 0.55, h = o.h ?? 150;
  const to = o.to ?? x0 + D * 120, sg = Math.sign(to - x0) || D;
  if (!o.running) {
    this.hip(t - 0.14, [x0, -this.STAND + 0.1 * H]).lean(t - 0.14, 14 * sg * D);
    this.hand('F', t - 0.14, 'local', [-0.16, 0.22]).hand('B', t - 0.14, 'local', [-0.2, 0.2]);
  }
  const yE = -this.STAND + 0.1 * H;
  // 过 (0,y0)、(dur,yE)、顶点比两端高 h 的抛物线
  const ya = y0, yb = yE, top = Math.min(ya, yb) - h;
  const fn = s => { const u = (s - t) / dur; return [lerp(x0, to, u), (1 - u) * (1 - u) * ya + 2 * u * (1 - u) * (2 * top - (ya + yb) / 2) + u * u * yb]; };
  this.path('hip', t, t + dur, fn);
  if (o.running) {                                              // 跨跳：前腿提膝、后腿蹬直，一手前一手后
    this.footFree('F', t, [0.22, 0.2]).footFree('B', t + 0.02, [-0.24, 0.34]);
    this.hand('F', t, 'local', [0.22, -0.04]).hand('B', t, 'local', [-0.2, 0.12]);
    this.lean(t, 16 * sg * D);
    this.footFree('B', t + dur * 0.6, [-0.02, 0.36]);
  } else {                                                      // 原地跳：收腿
    this.footFree('F', t, [0.14, 0.26]).footFree('B', t + 0.02, [-0.06, 0.3]);
    this.hand('F', t, 'local', [0.18, -0.12]).hand('B', t, 'local', [0.1, -0.08]);
    this.lean(t, 6 * sg * D);
  }
  const tl = t + dur;
  if (o.land === 'run') { this.hip(tl, [to, yE]); this.sfx(tl, 'step', { run: 1, v: 1 }); return { t: tl, x: to }; }   // 落地接着跑（脚交给下一段 run）
  this.foot('F', tl, [to + sg * 0.08 * H, 0], 0.08, 0, 'out3', { v: 1 }).foot('B', tl, [to - sg * 0.08 * H, 0], 0.09, 0, 'out3', false);
  this.hip(tl, [to, -this.STAND + 0.13 * H]).lean(tl, 12 * sg * D).hand('F', tl, 'free', [0.12, 0.22]).hand('B', tl, 'free', [-0.06, 0.24]);
  if (o.skid) {                                                 // 跑着跳：落地后带着速度往前滑一段再停
    const d = sg * o.skid;
    this.hip(tl, [to + d, -this.STAND + 0.13 * H], 0.32, 'out3').lean(tl, -6 * sg * D);
    this.foot('F', tl + 0.08, [to + sg * 0.08 * H + d, 0], 0.3, 0, 'out3', false).foot('B', tl + 0.09, [to - sg * 0.08 * H + d * 0.9, 0], 0.3, 0, 'out3', false);
    this.sfx(tl + 0.08, 'recoil_slide', { dur: 0.3 });
    this.hip(tl + 0.45, [to + d, -this.STAND], 0.3).lean(tl + 0.45, 2, 0.3).hand('F', tl + 0.45, 'free', [0.05, 0.35]).hand('B', tl + 0.45, 'free', [-0.04, 0.35]);
    return { t: tl, x: to + d };
  }
  if (!o.keep) this.hip(tl + 0.22, [to, -this.STAND], 0.3).lean(tl + 0.22, 2, 0.3).hand('F', tl + 0.3, 'free', [0.05, 0.35]).hand('B', tl + 0.3, 'free', [-0.04, 0.35]);
  return { t: tl, x: to };
};

// 走：脚轮流踩点，胯平滑地移过去；最后两步把脚收成站姿
A.walk = function (t, x1, o = {}) {
  const D = this.dirAt(t), H = this.H, c = cur(this, t), x0 = c.hip[0], sg = Math.sign(x1 - x0) || D;
  const dist = Math.abs(x1 - x0), sd = o.stepDur ?? 0.3, n = Math.max(1, Math.ceil(dist / (o.stride ?? 0.3 * H)));
  const dur = n * sd * 0.8 + sd * 0.5;
  const hipAt = s => x0 + (x1 - x0) * E.inOut(clamp((s - t) / dur));
  const fin = { F: x1 + D * 0.07 * H, B: x1 - D * 0.07 * H };
  this.hip(t, [x1, -this.STAND + 0.012 * H], dur, 'inOut').hip(t + dur, [x1, -this.STAND], 0.2);
  let side = (c.fF[0] - c.fB[0]) * sg < 0 ? 'F' : 'B';          // 后面那只脚先迈
  for (let k = 0; k <= n; k++) {
    const tk = t + k * sd * 0.8, last = k >= n - 1;
    this.foot(side, tk, [last ? fin[side] : hipAt(tk + sd) + sg * 0.1 * H, 0], sd, o.lift ?? 14);
    side = side === 'F' ? 'B' : 'F';
  }
  return { t: t + n * sd * 0.8 + sd, x: x1 };
};

// 单膝跪：前脚踩在 front，胯在前脚后面 0.2H、高度正好让后膝着地（小腿平放在地上）
A.kneel = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, front = o.front, hx = front - D * 0.2 * H;
  this.foot('F', t, [front, 0], 0.2, 12);
  this.hip(t + 0.05, [hx, -0.235 * H]).lean(t + 0.05, o.lean ?? 24).head(t + 0.05, o.head ?? 30);
  this.foot('B', t + 0.08, [hx - D * 0.23 * H, 0], 0.18, 8, 'inOut', false);
  this.sfx(t + 0.26, 'body', { v: 0.6 });
  this._kneel = { front, hx, D };
  return { t: t + 0.3, x: hx };
};
A.rise = function (t, o = {}) {
  const { front, D } = this._kneel, H = this.H, x = front - D * 0.07 * H;
  this.hip(t, [x, -this.STAND]).lean(t, o.lean ?? 3).head(t, o.head ?? 20);
  this.foot('B', t + 0.02, [front - D * 0.15 * H, 0], 0.16, 12);
  this.sfx(t, 'rustle', { v: 0.6 });
  return { t: t + 0.3, x };
};

module.exports = { Actor2 };
