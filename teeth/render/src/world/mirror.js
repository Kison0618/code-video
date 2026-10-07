// 镜子（桥段）：一面镜子里映着那颗两色的心。每一下跺脚，镜面从中心多裂开一圈；
// 两次掐断时画面冻住、变暗；掐断结束，镜子碎开，碎片在空中慢慢漂浮旋转，每一片里都是心的一角，
// 第二次比第一次碎得更开
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, mulberry32 } = K;
const A = require('../audio');
const FX = require('../fx');
const HEART = require('./heart');

const SRC = new Canvas(W, H), SRCF = new Canvas(W, H);
const T0 = A.beatT(304), C1 = A.beatT(338), C1e = A.beatT(342), C2 = A.beatT(346), C2e = A.beatT(350), T1 = A.beatT(368);
// Voronoi 碎片：种子点集中在撞击点附近
const IMP = [W * 0.5, H * 0.45];
const CELLS = (() => {
  const r = mulberry32(99), seeds = [];
  for (let i = 0; i < 90; i++) {
    const a = r() * 6.2832, d = Math.pow(r(), 0.75) * 1150;
    seeds.push([IMP[0] + Math.cos(a) * d, IMP[1] + Math.sin(a) * d * 0.75]);
  }
  seeds.sort((a, b) => Math.hypot(a[0] - IMP[0], a[1] - IMP[1]) - Math.hypot(b[0] - IMP[0], b[1] - IMP[1]));
  const clip = (poly, p, q) => {          // 保留离 p 比离 q 近的一侧
    const out = [], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = q[0] - p[0], ny = q[1] - p[1];
    const side = v => (v[0] - mx) * nx + (v[1] - my) * ny;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
      if (sa <= 0) out.push(a);
      if ((sa < 0) !== (sb < 0)) { const u = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
    }
    return out;
  };
  return seeds.map((s, i) => {
    let poly = [[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]];
    seeds.forEach((q, j) => { if (j !== i && poly.length) poly = clip(poly, s, q); });
    const cx = poly.reduce((a, v) => a + v[0], 0) / poly.length, cy = poly.reduce((a, v) => a + v[1], 0) / poly.length;
    const dx = cx - IMP[0], dy = cy - IMP[1], L = Math.hypot(dx, dy) || 1;
    return { poly, cx, cy, dir: [dx / L, dy / L], dist: L, spin: (r() - 0.5) * 1.2, lift: r(), tilt: r() };
  });
})();

function draw(ctx, t, S) {
  // 掐断时画面冻住
  const frozen = t >= C1 && t < C1e ? C1 : t >= C2 && t < C2e ? C2 : t;
  const sx = SRC.getContext('2d'); sx.reset();
  HEART.draw(sx, frozen, { name: 'chorus', t0: T0, t1: T1, calm: true });
  FX.flatten(SRC, SRCF);

  // 裂纹：到目前为止的鼓点数，决定裂到第几片
  const cracked = Math.min(CELLS.length, Math.floor(Math.max(0, A.beatF(Math.min(t, C1)) - 306) * 2.7));
  // 碎开：两次
  const b1 = easeOut(prog(t, C1e, C1e + 1.6)), b2 = easeOut(prog(t, C2e, C2e + 2.5));
  const burst = 0.35 * b1 + 0.65 * b2 + 0.25 * smooth(prog(t, C2e, T1));
  const dim = (t >= C1 && t < C1e) || (t >= C2 && t < C2e) ? 0.45 : 1;

  ctx.fillStyle = 'rgb(4,4,9)'; ctx.fillRect(0, 0, W, H);
  if (burst < 0.001) {
    ctx.drawImage(SRCF, 0, 0);
  }
  CELLS.forEach((c, i) => {
    const isCracked = i < cracked || burst > 0;
    let ox = 0, oy = 0, rot = 0, sc = 1;
    if (burst > 0) {
      const d = burst * (60 + c.dist * 0.35) * (0.6 + 0.8 * c.lift);
      ox = c.dir[0] * d; oy = c.dir[1] * d - burst * 40 * c.lift;
      rot = c.spin * burst + 0.05 * Math.sin(t * 0.8 + i) * burst;
      sc = 1 - 0.12 * burst * c.tilt;
    }
    if (burst > 0) {
      ctx.save();
      ctx.translate(c.cx + ox, c.cy + oy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-c.cx, -c.cy);
      ctx.beginPath(); c.poly.forEach((v, k) => (k ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]))); ctx.closePath();
      ctx.save(); ctx.clip();
      // 碎片的镜面：映像略微错开，像每一片的角度都不一样
      ctx.drawImage(SRCF, (c.tilt - 0.5) * 40 * burst, (c.lift - 0.5) * 30 * burst);
      ctx.fillStyle = c.tilt > 0.5 ? rgba(C.ice, 0.02 + 0.06 * Math.pow(Math.max(0, Math.sin(t * 1.3 + i)), 4)) : 'rgba(0,0,0,0.15)';
      ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(i % 2 ? C.cyan : C.pink, 0.55); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      ctx.restore();
    } else if (isCracked) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); c.poly.forEach((v, k) => (k ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]))); ctx.closePath();
      const age = clamp((t - A.beatT(304)) / 2);
      ctx.strokeStyle = rgba(C.white, 0.5 * age); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = rgba(i % 2 ? C.cyan : C.pink, 0.12); ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
  });
  // 撞击点
  if (burst < 0.001 && cracked > 0) glow(ctx, IMP[0], IMP[1], 60 + cracked * 2, C.white, 0.25 + 0.4 * A.hit(t, 8));
  if (dim < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - dim})`; ctx.fillRect(0, 0, W, H); }
}
const lyricStyle = () => ({ y: H - 120, size: 46, accent: C.pink });
module.exports = { draw, lyricStyle };
