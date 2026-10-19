// 动作质量体检：同一套量法比较 v1（样片 scene.js）和 v2（动作验证片 scene_motion.js）
// 用法：node src/tools/motion_check.js
// 指标（每段动作分别算，H = 身高）：
//   脚滑   脚在地上（离地 < 3 px）时的水平滑动速度，越接近 0 越好
//   死停   所有关节一帧内位移都 < 0.05 px 的帧占比（注意：第 5 轮逐帧量过，原片动作期间每帧都变，但情绪点上的定格是完全不动的 0.5–1.1 秒，
//          所以死停不是越少越好，要看它是不是落在该定格的地方。见 研究/动作逐帧_四集.md 规律 3）
//   突变   某个关节的速度在相邻两帧（60 帧）之间突然变化超过 0.6 H/s 的次数（卡顿、跳帧感）
'use strict';
const FPS = 60;
const v1 = require('../scene');
process.env.SCENE = 'motion';
const v2 = require('../scene_motion');
const H = 300, PARTS = ['head', 'neck', 'hip'], LIMBS = ['aF', 'aB', 'lF', 'lB'];
function pts(j) {
  const o = PARTS.map(k => j[k]);
  for (const k of LIMBS) o.push(j[k][1], j[k][2]);
  return o;
}
function check(get, t0, t1) {
  const fr = []; for (let t = t0; t <= t1; t += 1 / FPS) fr.push(get(t));
  let slide = 0, contact = 0, dead = 0, pops = 0;
  for (let i = 1; i < fr.length; i++) {
    const a = pts(fr[i - 1]), b = pts(fr[i]);
    let mx = 0; for (let k = 0; k < a.length; k++) mx = Math.max(mx, Math.hypot(b[k][0] - a[k][0], b[k][1] - a[k][1]));
    if (mx < 0.05) dead++;
    for (const f of ['lF', 'lB']) {
      const gy = fr[i][f][2][1] > -H * 0.04 ? Math.round(fr[i][f][2][1]) : 999;   // v1 的脚端停在地面上方半个线宽，v2 正好在 0
      const p = fr[i - 1][f][2], q = fr[i][f][2];
      if (Math.abs(p[1] - gy) < 1 && Math.abs(q[1] - gy) < 1) { slide += Math.abs(q[0] - p[0]); contact += 1 / FPS; }   // 脚贴地（±1 px）才算
    }
    if (i >= 2) {
      const z = pts(fr[i - 2]);
      for (let k = 0; k < a.length; k++) {
        const v0 = [(a[k][0] - z[k][0]) * FPS, (a[k][1] - z[k][1]) * FPS], v1_ = [(b[k][0] - a[k][0]) * FPS, (b[k][1] - a[k][1]) * FPS];
        if (Math.hypot(v1_[0] - v0[0], v1_[1] - v0[1]) / H > 0.6 * 60 / FPS * 10) pops++;
      }
    }
  }
  return { '脚滑 px/s': contact ? +(slide / contact).toFixed(1) : null, '死停 %': +(100 * dead / (fr.length - 1)).toFixed(1), '突变 次': pops, '时长 s': +(t1 - t0).toFixed(1) };
}
const segs = [
  ['捡电脑', [6.0, 8.6], [0.0, 3.6]],
  ['敲键盘', [12.6, 15.2], [3.6, 8.2]],
  ['踢', [15.9, 17.8], [8.2, 12.4]],
];
const rows = [];
for (const [name, a, b] of segs) {
  rows.push({ 动作: name, 版本: 'v1', ...check(t => v1.hero.joints(t), ...a) });
  rows.push({ 动作: name, 版本: 'v2', ...check(t => v2.jointsAt(t), ...b) });
}
console.table(rows);
