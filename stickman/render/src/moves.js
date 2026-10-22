// 成套动作：挨打的反应（后仰 / 击退 / 被打飞空翻 / 倒地 / 爬起来）、跑、跳
// 全部是 Actor2 底层意图（胯、前倾、脚、手、精确轨迹）的组合，require 之后直接挂在 Actor2 上：
//   a.flinch(t)                                    小后仰
//   a.knockback(t, { dist: 90 })                   被推着往后滑一段，站稳
//   const L = a.launch(t, { vx: -700, vy: -900, turns: 1, land: 'back' })   被打飞，空翻 turns 圈，仰面 / 脸朝下 / 双脚落地（roll: true 仰面落地后再往后滚一圈坐起来）
//   a.getUp(L.t + 0.6, { from: 'back' })           爬起来，返回站稳的时间
//   const r = a.run(t, x1, { speed: 1100, stop: true })  跑到 x1（v0 接着上一段的速度跑；stop:false 不刹车）
//   const s = a.slide(t, { v0: r.v, dur: 0.5 })    滑铲（从线下面钻过去）
//   const w = a.walk(t, x1, { arms: true })        走到 x1（胯的位置），返回到达时间（arms 摆臂；手上有东西时别开）
//   const k = a.kneel(t, { front: x })              单膝跪下（前脚踩在 x，后膝着地），a.rise(t) 站起来
//   a.jump(t, { to: x, h: 160, dur: 0.55 })        跳（running: true 跑着起跳不下蹲；skid: 落地后往前滑的距离；gy: 落在多高的台子上，往上是负）
//   a.bonk(t, { amt: 1 })                          被东西砸到头：头一缩、肩膀一沉，马上恢复（只改头和胯，不打断手上的动作）
//   a.reach('F', t, [x, y], { back })               伸手够东西：自动前倾 / 下蹲到够得着（不再隔空抓）
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

// 被砸到头：和吓一跳一样"1 帧到位 → 定住 → 回来"，只是方向相反——缩脖子、肩膀一沉、上身往前一弯，手马上捂到头上
//   o.hip === false：只缩头和弯腰（人正在做别的动作，比如抱头蹲着、被缠住），不碰胯和手
A.bonk = function (t, o = {}) {
  const k = o.amt ?? 1, H = this.H, T1 = t + 0.035, b = t + (o.hold ?? 0.16);
  const h0 = this.headT.at(t), h1 = this.headT.at(b + 0.2), l0 = this.leanT.at(t), l1 = this.leanT.at(b + 0.2);
  this.head(t, h0 + 40 * k).head(b, h1, 0.22);
  if (o.hip === false) { this.lean(t, l0 + 8 * k).lean(b, l1, 0.2); return b + 0.25; }
  const p0 = this.hipT.at(t), p1 = this.hipT.at(b + 0.2);
  this.path('lean', t, b, s => lerp(l0, l0 + 14 * k, Math.min(1, (s - t) / 0.035)));
  this.path('hip', t, b, s => [p0[0], p0[1] + 0.06 * H * k * Math.min(1, (s - t) / 0.035)]);
  this.lean(b, l1, 0.2).hip(b, p1, 0.22);
  if (o.hands !== false) {                                           // 双手捂头，揉两下
    this.hand('F', T1 + 0.05, 'local', s => [0.05 + 0.03 * Math.sin((s - T1) * 26), -0.26]).hand('B', T1 + 0.08, 'local', [0.0, -0.25]);
    this.hand('F', b + 0.55, 'free', [0.05, 0.35]).hand('B', b + 0.55, 'free', [-0.04, 0.35]);
  }
  return b + 0.6;
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
  this.hip(tL - 0.001, [xL, yL]);                           // 落地后的滑动从落地点开始（不然会从起飞前的旧目标插值过来，从高处被打飞时人会被拽回去）
  this.hip(tL, [xs, land === 'feet' ? -this.STAND + 0.16 * H : -0.026 * H], 0.25, 'out3').lean(tL, lEnd).head(tL, land === 'feet' ? 20 : 0);
  if (land === 'feet') this.hip(tL + 0.3, [xs, -this.STAND], 0.35).lean(tL + 0.3, 2, 0.3);
  if (land !== 'feet') this.sfx(tL, 'body', { v: Math.min(1, Math.hypot(vx, vy + G * tau) / 1400) });   // 落地时的速度
  if (land === 'back' && o.roll) {
    // 落地后顺着惯性往后滚（原片编程集 2:42 被线扫倒）：躺下 → 腿翻过头顶 → 摇回来坐起，手撑在身后
    const r0 = tL + 0.04, r1 = r0 + 0.2, r2 = r1 + 0.04, r3 = r2 + 0.3, dx = Math.sign(vx) * 0.32 * H;
    this.path('lean', r0, r3, s => s < r1 ? lerp(lEnd, lEnd - 60, E.out((s - r0) / (r1 - r0))) : s < r2 ? lEnd - 60 : lerp(lEnd - 60, lEnd + 76, E.inOut((s - r2) / (r3 - r2))));
    this.path('hip', r0, r3, s => [xs + dx * E.out(clamp((s - r0) / (r3 - r0))), s < r2 ? -0.05 * H : lerp(-0.05 * H, -0.12 * H, E.inOut((s - r2) / (r3 - r2)))]);
    this.footFree('F', r0, [0.24, 0.32]).footFree('B', r0 + 0.03, [0.1, 0.4]);
    const xe = xs + dx, Ds = -Math.sign(vx) || D;                    // 坐起来时脚朝滚来的方向
    this.foot('F', r3 - 0.12, [xe + Ds * 0.36 * H, 0], 0.14, 0, 'out3', false).foot('B', r3 - 0.1, [xe + Ds * 0.26 * H, 0], 0.14, 0, 'out3', false);
    this.hip(r3, [xe, -0.12 * H]).lean(r3, lEnd + 76).head(r3, 6);
    this.hand('F', r2, 'world', [xe - Ds * 0.14 * H, 0]).hand('B', r2 + 0.03, 'world', [xe - Ds * 0.08 * H, 0]);
    this.sfx(r1, 'rustle', { v: 0.8 }).sfx(r3, 'body', { v: 0.4 });
    return { t: r3, x: xe, lean: lEnd + 76, sit: true };
  }
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

// 跑：步态直接取自原片（analysis/ref_pose.py 从编程集 3:23 的近景逐帧提取骨架，见 拆解 第 3 节）
//   原片每步约 0.17 秒，四张姿势：蹬地（后脚在胯后下方、前腿提膝，停 2 帧）→ 腾空劈腿（后脚踢到身后膝盖高、前脚伸到前方）
//   → 前脚落地 → 两腿在身下交错。上身是往后仰的（平均约 -10°，腾空时到 -28°），胯很高，前拳举到下巴、后手垂在胯后。
//   下面的数都是原片测量值按我们的腿长（0.45H，原片约 0.5H）缩放过的；支撑期脚钉在地上不动。
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
  const v = o.speed ?? 5 * H, v0 = o.v0 ?? 0, ramp = o.ramp ?? 0.35, stop = o.stop ?? true, sg = Math.sign(x1 - x0) || D;
  const dist = Math.abs(x1 - x0), da = (v0 + v) / 2 * ramp, dd = stop ? v * ramp / 2 : 0;
  const cruise = Math.max(0, dist - da - dd), dur = ramp + cruise / v + (stop ? ramp : 0), t1 = t0 + dur;
  const vel = s => { const a = s - t0; if (a < ramp) return lerp(v0, v, a / ramp); if (stop && s > t1 - ramp) return v * Math.max(0, t1 - s) / ramp; return v; };
  const S = s => {
    const a = clamp(s - t0, 0, dur);
    let d = a < ramp ? v0 * a + (v - v0) * a * a / (2 * ramp) : da + v * (a - ramp);
    if (stop && s > t1 - ramp) { const b = Math.max(0, t1 - s); d = dist - v * b * b / (2 * ramp); }
    return d;
  };
  const X = s => x0 + sg * S(s);
  const T = clamp(0.167 * Math.sqrt(5.4 * H / v), 0.14, 0.3);  // 每一步（原片 5 帧 @30fps）
  const k = s => clamp(vel(s) / v, 0.3, 1);                    // 起跑 / 刹车时动作幅度小
  const first = (c.fF[0] - c.fB[0]) * sg < 0 ? 'F' : 'B';
  const plan = { F: [], B: [] };
  let side = first;
  for (let tc = t0 + 0.4 * T; tc < t1 - (stop ? 0.5 * T : 0); tc += T) { plan[side].push(tc); side = side === 'F' ? 'B' : 'F'; }
  const tcs = [...plan.F, ...plan.B].sort((a, b) => a - b);
  // 摆动期的脚（相对胯，单位 H，抬高量相对地面）：原片 B 后脚 → 交错 → A 提膝 → B 前脚伸出
  const SWX = [[0.2, -0.40], [0.43, -0.02], [0.64, 0.07], [0.86, 0.31]];
  const SWY = [[0.2, 0.27], [0.43, 0.18], [0.64, 0.16], [0.86, 0.17]];
  for (const f of ['F', 'B']) {
    const modeAt = this.footModes[f].filter(m => m.t <= t0).pop();
    const sx = modeAt && modeAt.mode !== 'ground' ? x0 + sg * (f === first ? -0.15 : 0.1) * H : c['f' + f][0];   // 从滑铲 / 跳接着跑：脚的旧目标早就过时了，按胯的位置起步
    const ev = [{ tc: t0 - 1, to: t0, x: sx }];
    if (f !== first) ev[0].to = Math.min(t0 + 0.9 * T, (plan[f][0] ?? t1) - 0.12);
    for (const tc of plan[f]) {
      const kk = k(tc), a = 0.2 * H * kk, x = X(tc) + sg * a;     // 落地踩在胯前 0.2H、蹬到胯后 0.2H 离地（蹬地时后腿正好伸直）
      let to = tc + 0.02; while (to < tc + 2 * T - 0.12 && (X(to) - x) * sg < a) to += 1 / 240;
      ev.push({ tc, to: Math.min(to, tc + 2 * T - 0.12), x, kk });
    }
    const fn = s => {
      let i = ev.length - 1; while (i > 0 && s < ev[i].tc) i--;
      const e = ev[i], nx = ev[i + 1];
      if (s <= e.to || !nx) return [e.x, 0];
      const u = clamp((s - e.to) / (nx.tc - e.to)), kk = nx.kk;
      const r0 = e.x - X(e.to), r1 = nx.x - X(nx.tc);
      const rx = catmull([[0, r0], ...SWX.map(([q, x]) => [q, sg * x * H * kk]), [1, r1]], u);
      const lift = Math.max(0, H * kk * catmull([[0, 0], ...SWY, [1, 0]], u));
      return [X(s) + rx, -lift];
    };
    this.footPath(f, t0, fn);
  }
  for (const tc of tcs) this.sfx(tc, 'step', { run: 1, v: 0.45 + 0.4 * k(tc) });
  // 一步之内（从落地算）：胯的高度、上身前后仰（负 = 往后仰）
  const ph = s => { let i = tcs.length - 1; while (i > 0 && s < tcs[i]) i--; return clamp((s - (tcs[i] ?? t0)) / T, 0, 1); };
  const HIP = [[0, 0.39], [0.25, 0.4], [0.55, 0.405], [0.8, 0.44], [1, 0.39]];
  const LEAN = [[0, -15], [0.2, -3], [0.5, -4], [0.8, -24], [1, -15]];
  const yRun = s => -H * lerp(this.STAND / H, catmull(HIP, ph(s)), k(s));
  this.path('hip', t0, t1, s => [X(s), lerp(c.hip[1], yRun(s), E.out(clamp((s - t0) / 0.2)))]);
  const l0 = c.lean, lw = 360 * Math.round(l0 / 360);       // 翻滚过的整圈不倒转回去（被打飞空翻之后接着跑）
  this.path('lean', t0, t1, s => lerp(l0, lw + catmull(LEAN, ph(s)) * k(s) * (o.leanScale ?? 0.7), E.out(clamp((s - t0) / 0.2))));
  this.lean(t1, 2).head(t0, 6);
  // 手（相对肩，世界坐标方向）：前拳举到下巴、后手垂到胯后，和对侧腿同步
  const tF = plan.F[0] ?? t0;
  const HF = [0.14, -0.12], HM = [0.17, 0.03], HB = [-0.2, 0.16];
  const arm = (q, kk) => {                                    // q = 0 在后，1 在前
    const p = q < 0.5 ? [lerp(HB[0], HM[0], q * 2), lerp(HB[1], HM[1], q * 2)] : [lerp(HM[0], HF[0], q * 2 - 1), lerp(HM[1], HF[1], q * 2 - 1)];
    return [lerp(0.04, p[0], kk), lerp(0.33, p[1], kk)];
  };
  const swing = s => (1 - Math.cos(Math.PI * (s - tF) / T)) / 2;
  this.hand('F', t0, 'pose', s => arm(swing(s), k(s)));
  this.hand('B', t0, 'pose', s => arm(1 - swing(s), k(s)));
  if (!stop) this.hip(t1, [x1, yRun(t1)]);
  else {
    const last = tcs[tcs.length - 1] ?? t0, lf = plan.F.includes(last) ? 'B' : 'F';
    this.foot(lf, Math.max(last + 0.04, t1 - 0.18), [x1 + sg * 0.09 * H, 0], 0.16, 10, 'inOut', { run: 1, v: 0.8 });
    this.foot(lf === 'F' ? 'B' : 'F', t1 + 0.04, [x1 - sg * 0.07 * H, 0], 0.16, 10);
    this.hip(t1, [x1, -this.STAND + 0.05 * H]).lean(t1, 6).hip(t1 + 0.25, [x1, -this.STAND], 0.25).lean(t1 + 0.25, 2, 0.25).head(t1, 0);
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
  this.footPath('F', t, s => [X(s) + sg * 0.36 * H, 0], 0.2).footPath('B', t, s => [X(s) - sg * 0.1 * H, 0], 0.2);
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
    this.hip(t - 0.14, [x0, y0 + 0.1 * H]).lean(t - 0.14, 14 * sg * D);           // 在哪儿起跳就在哪儿下蹲（台阶上也一样）
    this.hand('F', t - 0.14, 'local', [-0.16, 0.22]).hand('B', t - 0.14, 'local', [-0.2, 0.2]);
  }
  const gy = o.gy ?? 0, yE = -this.STAND + 0.1 * H + gy;
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
  this.foot('F', tl, [to + sg * 0.08 * H, gy], 0.08, 0, 'out3', { v: 1 }).foot('B', tl, [to - sg * 0.08 * H, gy], 0.09, 0, 'out3', false);
  this.hip(tl, [to, -this.STAND + 0.13 * H + gy]).lean(tl, 12 * sg * D).hand('F', tl, 'free', [0.12, 0.22]).hand('B', tl, 'free', [-0.06, 0.24]);
  if (o.skid) {                                                 // 跑着跳：落地后带着速度往前滑一段再停
    const d = sg * o.skid;
    this.hip(tl, [to + d, -this.STAND + 0.13 * H], 0.32, 'out3').lean(tl, -6 * sg * D);
    this.foot('F', tl + 0.08, [to + sg * 0.08 * H + d, 0], 0.3, 0, 'out3', false).foot('B', tl + 0.09, [to - sg * 0.08 * H + d * 0.9, 0], 0.3, 0, 'out3', false);
    this.sfx(tl + 0.08, 'recoil_slide', { dur: 0.3 });
    this.hip(tl + 0.45, [to + d, -this.STAND], 0.3).lean(tl + 0.45, 2, 0.3).hand('F', tl + 0.45, 'free', [0.05, 0.35]).hand('B', tl + 0.45, 'free', [-0.04, 0.35]);
    return { t: tl, x: to + d };
  }
  if (!o.keep) this.hip(tl + 0.22, [to, -this.STAND + gy], 0.3).lean(tl + 0.22, 2, 0.3).hand('F', tl + 0.3, 'free', [0.05, 0.35]).hand('B', tl + 0.3, 'free', [-0.04, 0.35]);
  return { t: tl, x: to };
};

// 走：脚轮流踩点，胯平滑地移过去；最后两步把脚收成站姿
A.walk = function (t, x1, o = {}) {
  // 原片实测（编程集 0:18 赌气走开）：触地时两脚前后分开约 0.5H，两腿成倒 V（和竖直方向约 30°），胯只比站直低一点；
  // 两只脚轮流迈，一只在空中时另一只踩稳不动，触地的姿势停得比"两脚交错"那一下久。
  // 我们的腿比原片短（0.45H 对 0.5H），按腿的角度换算成步幅 0.4H。
  const D = this.dirAt(t), H = this.H, c = cur(this, t), x0 = c.hip[0], sg = Math.sign(x1 - x0) || D;
  const dist = Math.abs(x1 - x0), sd = o.stepDur ?? 0.3, stride = o.stride ?? 0.4 * H, n = Math.max(1, Math.ceil(dist / stride));
  const P = sd * 0.8, sw = P * (o.swing ?? 0.6);                 // 一步的周期；脚在空中的时间（其余时间踩稳）
  const dur = n * P + sd * 0.5;
  // 胯走精确路径：只在第一步加速、最后一步减速，中间匀速（整段缓入缓出会让长距离走路一直在加速，弹簧再一滞后，胯落在脚后面人就蹲下去了）
  const ta = Math.min(P * 0.9, dur / 2), vmax = dist / (dur - ta);
  const prof = a => a <= 0 ? 0 : a < ta ? 0.5 * vmax * a * a / ta : a < dur - ta ? 0.5 * vmax * ta + vmax * (a - ta) : dist - 0.5 * vmax * Math.pow(Math.max(0, dur - a), 2) / ta;
  const hipAt = s => x0 + sg * Math.min(dist, prof(s - t));
  const tl0 = t + sw;                                            // 第一次触地；之后每 P 秒一次。触地时胯最低
  const y0 = c.hip[1], ys = -this.STAND;
  this.path('hip', t, t + dur, s => [hipAt(s), lerp(y0, ys, clamp((s - t) / 0.2)) + 0.025 * H * Math.max(0, Math.cos(2 * Math.PI * (s - tl0) / P)) * clamp((s - t) / P) * clamp((t + dur - s) / P)]);
  const fin = { F: x1 + D * 0.07 * H, B: x1 - D * 0.07 * H };
  this.hip(t, [x1, -this.STAND + 0.012 * H], dur, 'inOut').hip(t + dur, [x1, -this.STAND], 0.2);
  let side = (c.fF[0] - c.fB[0]) * sg < 0 ? 'F' : 'B';          // 后面那只脚先迈
  const half = Math.min(stride, dist / n) * 0.5;
  for (let k = 0; k <= n; k++) {
    const tk = t + k * P, last = k >= n - 1;
    this.foot(side, tk, [last ? fin[side] : hipAt(tk + sw) + sg * half, 0], last ? Math.max(sw, sd * 0.7) : sw, o.lift ?? 0.06 * H);
    side = side === 'F' ? 'B' : 'F';
  }
  if (o.arms) {                                                  // 摆臂：和对侧腿同步，肘微弯（手上拿着东西时不要开）
    const sgn = side === 'F' ? 1 : -1;
    this.hand('F', t, 'pose', s => { const ph = Math.sin(Math.PI * (s - t) / P) * sgn * clamp((t + dur - s) / 0.3); return [0.05 + 0.12 * ph, 0.33 - 0.03 * Math.abs(ph)]; });
    this.hand('B', t, 'pose', s => { const ph = -Math.sin(Math.PI * (s - t) / P) * sgn * clamp((t + dur - s) / 0.3); return [-0.03 + 0.12 * ph, 0.33 - 0.03 * Math.abs(ph)]; });
    this.hand('F', t + dur + 0.05, 'free', [0.05, 0.35]).hand('B', t + dur + 0.05, 'free', [-0.04, 0.35]);
  }
  return { t: t + n * P + sd, x: x1 };
};

// 单膝跪：前脚踩在 front，胯在前脚后面 0.2H、高度正好让后膝着地（小腿平放在地上）
A.kneel = function (t, o = {}) {
  const D = this.dirAt(t), H = this.H, front = o.front, hx = front - D * 0.2 * H;
  const md = o.dur ?? 0;                                       // 离得远时（跪着挪过去）给一个移动时长，不然弹簧会甩过去
  this.foot('F', t + md * 0.3, [front, 0], 0.2 + md * 0.5, 12);
  this.hip(t + 0.05, [hx, -0.235 * H], md, 'inOut').lean(t + 0.05, o.lean ?? 24, md * 0.5).head(t + 0.05, o.head ?? 30);
  this.foot('B', t + 0.08 + md * 0.6, [hx - D * 0.23 * H, 0], 0.18 + md * 0.3, 8, 'inOut', false);
  this.sfx(t + 0.26 + md, 'body', { v: 0.6 });
  this._kneel = { front, hx, D };
  return { t: t + 0.3 + md, x: hx };
};
// 伸手去够一个点（地上的东西、半空中的光标、身边的电脑）：手按世界坐标走，身体自动弯到够得着——
//   先只前倾（最多 o.maxLean，默认 80°）；还不够就往下蹲（胯降低，最多 o.maxDrop，默认 0.22H）；坐着 / 跪着时只前倾
//   原片里手从来不"隔空抓"：手到东西上的那一刻，肩膀离它不超过一条胳膊（体检第 9 项查这个）
//   target：[x, y] 或 t 的函数（移动的东西按 t + dur 时的位置算身体）；o.dur 弯下去的时间；o.back：这个时间点（绝对时间）身体回到原来的姿势
//   返回 this（可以接着写 .hand / .lean）；算出来的姿势在 a.lastReach = { t: 够到的时间, lean, hip }
A.reach = function (h, t, target, o = {}) {
  const H = this.H, D = this.dirAt(t), dur = o.dur ?? 0.12, T1 = t + dur;
  const g = o.at ?? (typeof target === 'function' ? target(T1) : target);   // o.at：目标是函数、但这时还算不出来（依赖后面才定的东西）时，给一个估计位置
  const hip0 = this.hipT.at(t), lean0 = this.leanT.at(t), R = 0.375 * H * (o.k ?? 0.92), S = 0.255 * H;
  const sitting = hip0[1] > -0.3 * H, maxDrop = sitting ? 0 : (o.maxDrop ?? 0.22) * H, maxLean = o.maxLean ?? 80;
  const fits = (hy, l) => { const a = l * Math.PI / 180; return Math.hypot(hip0[0] + D * Math.sin(a) * S - g[0], hy - Math.cos(a) * S - g[1]) <= R; };
  const leans = []; for (let l = -30; l <= maxLean; l += 2) leans.push(l); leans.sort((a, b) => Math.abs(a - lean0) - Math.abs(b - lean0));
  let best = null;
  for (let dy = 0; dy <= maxDrop + 1e-6 && !best; dy += 0.01 * H) for (const l of leans) if (fits(hip0[1] + dy, l)) { best = { dy, l }; break; }
  if (!best) best = { dy: maxDrop, l: maxLean };                  // 怎么弯都够不着：弯到最大（体检会报出来，该让人走近一点）
  const hip = [hip0[0], hip0[1] + best.dy];
  if (best.dy > 0) this.hip(t, hip, dur, 'out');
  if (Math.abs(best.l - lean0) > 1) this.lean(t, best.l, dur, 'out');
  this.hand(h, t, 'world', target, o.blend);
  if (o.back !== undefined) { if (best.dy > 0) this.hip(o.back, hip0, 0.15); this.lean(o.back, lean0, 0.15); }
  this.lastReach = { t: T1, lean: best.l, hip };
  return this;
};
A.rise = function (t, o = {}) {
  const { front, D } = this._kneel, H = this.H, x = front - D * 0.07 * H;
  this.hip(t, [x, -this.STAND]).lean(t, o.lean ?? 3).head(t, o.head ?? 20);
  this.foot('B', t + 0.02, [front - D * 0.15 * H, 0], 0.16, 12);
  this.sfx(t, 'rustle', { v: 0.6 });
  return { t: t + 0.3, x };
};

module.exports = { Actor2 };
