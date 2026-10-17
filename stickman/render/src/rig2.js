// 火柴人骨骼 v2：目标驱动 + 弹簧动力学 + 反向运动学（IK）
//
// v1 的问题：关键帧之间按同一条缓动插值所有关节角度 → 全身一起动、一起停，像机器人；手脚只是"大概在那儿"。
// v2 的做法（发挥代码的长处）：
//   1. 只描述"意图"：胯在哪、身体前倾多少、头朝哪、左右手要碰到哪个点、两只脚踩在哪。
//   2. 每个意图通道用二阶弹簧动力学去追目标（频率 f、阻尼 ζ、起始响应 r）：
//      躯干硬而快、手慢半拍还会过冲、头最软会晃一下 → 跟随、过冲、回稳自动长出来。
//      参数按原片实测定：大姿势变化 2–4 帧（80–170 ms）完成，带一点过冲（见 拆解 第 3 节）。
//   3. 手脚用两段 IK 求肘、膝：手真的放在电脑上，脚真的钉在地上不滑。
//   4. 停顿不死：呼吸、重心漂移、细小噪声叠在所有通道上。
//   5. 快速挥动时沿手脚的轨迹画拖影带（原片那种），代替 v1 的整身残影。
// 所有东西在加载时从 t=0 以固定 240 Hz 步长模拟一遍并缓存，渲染按时间取样 → 多进程分块完全一致。
'use strict';
const K = require('./core');
const { clamp, lerp, E, rgba, mix, noise1 } = K;
const { P } = require('./rig');            // 和 v1 同一套比例（头 0.23H、线宽 0.052H……）

// —— 二阶动力学（"procedural animation" 常用的 f/ζ/r 参数化）——
// f：固有频率（Hz，越大越快）；z：阻尼（<1 会过冲，越小晃得越多）；r：起始响应（>1 先冲过头，<0 先往反方向预备）
class Dyn {
  constructor(f, z, r, x0) {
    this.k1 = z / (Math.PI * f); this.k2 = 1 / ((2 * Math.PI * f) ** 2); this.k3 = r * z / (2 * Math.PI * f);
    this.y = x0; this.yd = 0; this.xp = x0;
  }
  step(dt, x) {
    const xd = (x - this.xp) / dt; this.xp = x;
    const k2 = Math.max(this.k2, dt * dt / 2 + dt * this.k1 / 2, dt * this.k1);   // 保证数值稳定
    this.y += dt * this.yd;
    this.yd += dt * (x + this.k3 * xd - this.y - this.k1 * this.yd) / k2;
    return this.y;
  }
  snap(x) { this.y = x; this.yd = 0; this.xp = x; }
}

// —— 两段 IK：根 → 中间关节 → 末端。bend = ±1 决定肘/膝往哪边弯 ——
function ik2(root, target, L1, L2, bend) {
  let dx = target[0] - root[0], dy = target[1] - root[1];
  let d = Math.hypot(dx, dy) || 1e-6;
  const dmax = (L1 + L2) * 0.999, dmin = Math.abs(L1 - L2) + 1e-3;
  const dc = clamp(d, dmin, dmax);
  const a = Math.atan2(dy, dx);
  const A = Math.acos(clamp((L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc), -1, 1));
  const a1 = a + bend * A;
  const mid = [root[0] + L1 * Math.cos(a1), root[1] + L1 * Math.sin(a1)];
  const end = [root[0] + dc * Math.cos(a), root[1] + dc * Math.sin(a)];
  return [root, mid, end];
}

// 弹簧手感预设（按原片节奏调的）
const FEEL = {
  hip:  [4.2, 0.72, 0],     // 胯：2–4 帧完成大位移，略过冲（蹲下时会"压一下"）
  lean: [3.6, 0.62, 0],
  head: [2.6, 0.42, 0],     // 头最软：身体停了它还晃一下
  hand: [4.6, 0.58, 0],     // 手：比躯干慢一点，到位时过冲回弹
  obj:  [4.0, 0.55, 0],     // 拿在手里的东西
  foot: [5.0, 0.6, 0],      // 离地的脚（腾空收腿）
};

// 时间轴上的"目标"：值在 t 之前保持，t 起在 dur 秒内按 ease 过渡到新值（dur=0 就是瞬间换目标，交给弹簧去追）
class Track {
  constructor(v0) { this.k = [{ t: -1e9, v: v0, dur: 0, ease: 'linear' }]; }
  set(t, v, dur = 0, ease = 'inOut') { this.k.push({ t, v, dur, ease }); this.k.sort((a, b) => a.t - b.t); return this; }
  at(t) {
    let i = 0; while (i < this.k.length - 1 && this.k[i + 1].t <= t) i++;
    const cur = this.k[i], prev = this.k[Math.max(0, i - 1)];
    if (i === 0 || cur.dur <= 0 || t >= cur.t + cur.dur) return cur.v;
    const u = (E[cur.ease] || E.inOut)((t - cur.t) / cur.dur);
    const pv = i > 0 ? prev.v : cur.v;
    return Array.isArray(cur.v) ? cur.v.map((x, n) => lerp(pv[n], x, u)) : lerp(pv, cur.v, u);
  }
}

// 根据"状态"（胯、前倾、头、手脚位置）求出全身关节，格式和 v1 相同，可以直接用 v1 的画法
function body(s, H, dir) {
  const up = [dir * Math.sin(s.lean * Math.PI / 180), -Math.cos(s.lean * Math.PI / 180)];
  const breathe = 1 + 0.012 * Math.sin(s.t * 2 * Math.PI / 3.2);
  const hip = s.hip;
  const neck = [hip[0] + up[0] * P.torso * H * breathe, hip[1] + up[1] * P.torso * H * breathe];
  const sh = [neck[0] - up[0] * P.shoulderDrop * H, neck[1] - up[1] * P.shoulderDrop * H];
  const ha = (s.lean + s.head) * Math.PI / 180;
  const head = [neck[0] + dir * Math.sin(ha) * P.headR * 0.92 * H, neck[1] - Math.cos(ha) * P.headR * 0.92 * H];
  const L = n => P[n] * H;
  return {
    hip, neck, sh, head, dir,
    aF: ik2(sh, s.hF, L('upper'), L('fore'), dir), aB: ik2(sh, s.hB, L('upper'), L('fore'), dir),      // 肘往后下方弯
    lF: ik2(hip, s.fF, L('thigh'), L('shin'), -dir), lB: ik2(hip, s.fB, L('thigh'), L('shin'), -dir),  // 膝往前弯
  };
}

function paint(ctx, j, col, H, headStyle = 'fill') {
  const lw = P.lw * H;
  ctx.save();
  ctx.strokeStyle = rgba(col); ctx.fillStyle = rgba(col);
  ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const poly = pts => { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
  poly(j.aB); poly(j.lB); poly([j.hip, j.neck]); poly(j.lF); poly(j.aF);
  ctx.stroke();
  const r = P.headR * H;
  ctx.beginPath();
  if (headStyle === 'ring') { ctx.arc(j.head[0], j.head[1], r - lw / 2, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.arc(j.head[0], j.head[1], r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// 拖影带：沿末端（手、脚）最近一小段轨迹画一条由细到粗的实心带子（原片快速挥动时的那种弧形拖影）
// pts: 从旧到新的位置序列
function smear(ctx, pts, w, col, alpha = 1) {
  if (pts.length < 3) return;
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (len < w * 1.2) return;
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    const ww = w / 2 * Math.pow(i / (pts.length - 1), 1.3);
    L.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]); R.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
  }
  ctx.save();
  ctx.fillStyle = rgba(col, alpha);
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

module.exports = { Dyn, Track, ik2, body, paint, smear, FEEL };
