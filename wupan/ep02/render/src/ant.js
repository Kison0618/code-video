// 剪纸蚂蚁（侧面，朝 +x）：头、胸、腰结、腹分节；触角有肘；每条腿三节（股节、胫节、跗节）用两段 IK 摆关节
// 坐标单位 u = 26·s 像素；原点在胸部中心，站立时脚底在 y = +2.8u
'use strict';
const K = require('./core');
const { clamp, lerp, smooth } = K;

const PAL = {
  A: { body: '#b8492f', hi: '#dc7b5c', dark: '#7a2b1c', leg: '#93391f', far: '#5f2216', stripe: '#8a301e' },
  B: { body: '#3d3532', hi: '#625754', dark: '#221c1a', leg: '#2f2826', far: '#1b1615', stripe: '#2a2321' },
  W: { body: '#7c4329', hi: '#a2633f', dark: '#4d2615', leg: '#60321b', far: '#3c1d0f', stripe: '#5a2e18' },
  W2: { body: '#8d5230', hi: '#b47448', dark: '#58301a', leg: '#6d3b20', far: '#432312', stripe: '#673719' },
  DEAD: { body: '#8d8278', hi: '#aba094', dark: '#5f554d', leg: '#72675e', far: '#51493f', stripe: '#6e645b' },
  INK: { body: '#2c241e', hi: '#2c241e', dark: '#2c241e', leg: '#2c241e', far: '#2c241e', stripe: '#2c241e' },
};

const HIPS = [[1.45, 0.1], [0.55, 0.25], [-0.35, 0.2]];
const REST = [[2.0, 2.45], [0.45, 2.6], [-1.95, 2.45]];
const TARS = [0.8, 0.35, -0.85];
const L1 = 1.85, L2 = 2.05;

function ell(ctx, cx, cy, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); }
function knee(H, A) {
  let dx = A[0] - H[0], dy = A[1] - H[1], d = Math.hypot(dx, dy);
  const dm = L1 + L2 - 0.02;
  if (d > dm) { A = [H[0] + dx / d * dm, H[1] + dy / d * dm]; dx = A[0] - H[0]; dy = A[1] - H[1]; d = dm; }
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const px = H[0] + a * dx / d, py = H[1] + a * dy / d;
  const k1 = [px - h * dy / d, py + h * dx / d], k2 = [px + h * dy / d, py - h * dx / d];
  return [k1[1] < k2[1] ? k1 : k2, A];
}
function seg(ctx, p, q, w0, w1) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p[0] + nx * w0 / 2, p[1] + ny * w0 / 2); ctx.lineTo(q[0] + nx * w1 / 2, q[1] + ny * w1 / 2);
  ctx.arc(q[0], q[1], w1 / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
  ctx.lineTo(p[0] - nx * w0 / 2, p[1] - ny * w0 / 2);
  ctx.arc(p[0], p[1], w0 / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI);
  ctx.closePath(); ctx.fill();
}
// 一条腿的关节位置（髋 H、膝 Kn、踝 A、爪尖 T）
function legPose(i, far, o, t) {
  const H = [HIPS[i][0] + (far ? 0.2 : 0), HIPS[i][1] - (far ? 0.15 : 0)];
  const side = i === 0 ? 1 : i === 2 ? -1 : 0.3;
  if (o.curl != null) {             // 死蚂蚁：腿蜷起来
    const a1 = Math.PI / 2 - side * 0.9 + (far ? 0.25 : 0), kn = [H[0] + Math.cos(a1) * L1 * 0.8, H[1] + Math.sin(a1) * L1 * 0.8];
    const a2 = a1 - side * 2.2 - 0.3 + Math.sin(t * 2 + i) * 0.05 * o.curl, A = [kn[0] + Math.cos(a2) * L2 * 0.75, kn[1] + Math.sin(a2) * L2 * 0.75];
    return { H, Kn: kn, A, T: [A[0] + Math.cos(a2 + 0.6 * side) * 0.6, A[1] + Math.sin(a2 + 0.6 * side) * 0.6] };
  }
  if (o.flail != null) {            // 乱蹬
    const f = o.flail, k = i * 1.7 + (far ? 2.1 : 0);
    const a1 = -Math.PI / 2 + side * 0.9 + (far ? 0.3 : 0) + Math.sin(t * 15 + k) * 0.55 * f + Math.PI;  // 朝下 → 抬起来乱踢
    const kn = [H[0] + Math.cos(a1) * L1, H[1] + Math.sin(a1) * L1];
    const a2 = a1 + side * 0.9 + Math.sin(t * 19 + k * 1.3) * 0.8 * f;
    const A = [kn[0] + Math.cos(a2) * L2, kn[1] + Math.sin(a2) * L2];
    return { H, Kn: kn, A, T: [A[0] + Math.cos(a2) * 0.7, A[1] + Math.sin(a2) * 0.7] };
  }
  let A = [REST[i][0] + (far ? 0.25 : 0), REST[i][1] - (far ? 0.12 : 0)], lift = 0;
  if (o.walk != null) {
    const off = ((i + (far ? 1 : 0)) % 2) * Math.PI;
    let c = ((o.walk + off) / (Math.PI * 2)) % 1; if (c < 0) c += 1;
    const S = 0.75;
    if (c < 0.62) A[0] += S * (1 - 2 * c / 0.62);
    else { const v = (c - 0.62) / 0.38; A[0] += -S + 2 * S * smooth(v); lift = Math.sin(Math.PI * v) * 0.75; A[1] -= lift; }
  }
  let r = knee(H, A); let Kn = r[0]; A = r[1];
  let T = [A[0] + TARS[i], REST[i][1] + 0.35 - lift];
  if (o.wave && i === 0 && !far) {   // 打招呼：前腿抬起来挥
    const w = o.wave, sw = Math.sin(t * 10) * 0.45;
    const kn2 = [H[0] + Math.cos(-0.7) * L1, H[1] + Math.sin(-0.7) * L1];
    const a2 = -1.75 + sw, A2 = [kn2[0] + Math.cos(a2) * L2, kn2[1] + Math.sin(a2) * L2];
    const T2 = [A2[0] + Math.cos(a2 + 0.4) * 0.7, A2[1] + Math.sin(a2 + 0.4) * 0.7];
    Kn = [lerp(Kn[0], kn2[0], w), lerp(Kn[1], kn2[1], w)]; A = [lerp(A[0], A2[0], w), lerp(A[1], A2[1], w)]; T = [lerp(T[0], T2[0], w), lerp(T[1], T2[1], w)];
  }
  return { H, Kn, A, T };
}
function drawLeg(ctx, p, col, ink) {
  ctx.fillStyle = col;
  seg(ctx, p.H, p.Kn, 0.46, 0.34);
  seg(ctx, p.Kn, p.A, 0.32, 0.2);
  const m = [lerp(p.A[0], p.T[0], 0.55), lerp(p.A[1], p.T[1], 0.55)];
  seg(ctx, p.A, m, 0.2, 0.16); seg(ctx, m, p.T, 0.16, 0.1);
  if (!ink) { ctx.fillStyle = 'rgba(255,240,220,0.18)'; ell(ctx, p.Kn[0], p.Kn[1], 0.2, 0.2); ctx.fill(); }
}
function drawAntenna(ctx, o, t, far, col) {
  const b = [3.35 + (far ? -0.25 : 0), -2.0 + (far ? 0.1 : 0)];
  const wig = o.still ? 0 : Math.sin(t * 3.1 + (far ? 1.4 : 0) + (o.seed || 0)) * 0.12 + (o.sniff || 0) * Math.sin(t * 13 + (far ? 1 : 0)) * 0.25;
  const droop = o.droop || 0;
  const aS = -1.25 + (far ? -0.15 : 0) + wig * 0.5 + droop * 0.6, e = [b[0] + Math.cos(aS) * 1.8, b[1] + Math.sin(aS) * 1.8];
  const aF = -0.15 + (far ? -0.2 : 0) + wig + droop * 1.0, tip = [e[0] + Math.cos(aF) * 2.3, e[1] + Math.sin(aF) * 2.3];
  ctx.fillStyle = col;
  seg(ctx, b, e, 0.24, 0.2);
  seg(ctx, e, tip, 0.18, 0.18);
  ell(ctx, tip[0] + Math.cos(aF) * 0.15, tip[1] + Math.sin(aF) * 0.15, 0.32, 0.22, aF); ctx.fill();
}

// o: {x,y,s,ang,dir,pal,ink,walk,wave,flail,curl,eye,sniff,droop,stain,alpha,shadow,seed}
function draw(ctx, t, o) {
  const u = 26 * (o.s || 1), ink = !!o.ink, pal = ink ? PAL.INK : typeof o.pal === 'string' ? PAL[o.pal] : (o.pal || PAL.W);
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.ang || 0);
  const fy = (o.flip ? -1 : 1) * (o.sy == null ? 1 : (Math.abs(o.sy) < 0.06 ? Math.sign(o.sy || 1) * 0.06 : o.sy));
  ctx.scale((o.dir || 1) * u, fy * u);
  ctx.globalAlpha = a;
  if (o.shadow !== false && !ink) {
    ctx.shadowColor = 'rgba(45,22,6,0.42)'; ctx.shadowBlur = 7 * (o.s || 1); ctx.shadowOffsetY = 4 * (o.s || 1); ctx.shadowOffsetX = 2 * (o.s || 1);
  }
  // 远侧：腿和触角
  for (let i = 0; i < 3; i++) drawLeg(ctx, legPose(i, true, o, t), pal.far, ink);
  drawAntenna(ctx, o, t, true, pal.far);
  // 腹（分节）
  ctx.fillStyle = pal.body; ell(ctx, -3.4, -0.65, 2.2, 1.6, -0.32); ctx.fill();
  const sh = ctx.shadowColor; ctx.shadowColor = 'transparent';
  ctx.save(); ell(ctx, -3.4, -0.65, 2.2, 1.6, -0.32); ctx.clip();
  if (!ink) { ctx.fillStyle = pal.hi; ell(ctx, -3.1, -1.25, 1.6, 0.75, -0.32); ctx.globalAlpha = a * 0.55; ctx.fill(); ctx.globalAlpha = a; }
  ctx.strokeStyle = ink ? 'rgba(239,226,200,0.55)' : pal.stripe; ctx.lineWidth = ink ? 0.09 : 0.2;
  for (const k of [-0.9, 0.0, 0.85]) { ctx.beginPath(); ctx.ellipse(-3.4 + k - 1.7, -0.65 + k * 0.32, 1.9, 1.9, 0, -0.75, 0.75); ctx.stroke(); }
  if (o.stain) { ctx.fillStyle = `rgba(138,154,62,${0.85 * o.stain})`; ell(ctx, -3.6, -0.9, 1.3 * o.stain + 0.2, 0.9 * o.stain + 0.1, -0.3); ctx.fill(); }
  ctx.restore();
  ctx.shadowColor = sh;
  // 腰结
  ctx.fillStyle = pal.dark; ell(ctx, -1.05, -0.35, 0.45, 0.58, 0.2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.35, -0.6); ctx.lineTo(-1.0, -1.25); ctx.lineTo(-0.75, -0.55); ctx.closePath(); ctx.fill();
  // 胸
  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.moveTo(-0.65, -0.3); ctx.bezierCurveTo(-0.7, -1.2, 0.2, -1.55, 1.0, -1.45);
  ctx.bezierCurveTo(1.8, -1.35, 2.25, -1.1, 2.15, -0.55); ctx.bezierCurveTo(2.05, 0.2, 0.9, 0.35, 0.2, 0.3);
  ctx.bezierCurveTo(-0.3, 0.25, -0.6, 0.1, -0.65, -0.3); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (!ink) { ctx.fillStyle = pal.hi; ctx.globalAlpha = a * 0.5; ell(ctx, 0.75, -1.05, 1.0, 0.28, -0.08); ctx.fill(); ctx.globalAlpha = a; }
  else { ctx.strokeStyle = 'rgba(239,226,200,0.55)'; ctx.lineWidth = 0.09; for (const k of [0, 0.3, 0.6]) { ctx.beginPath(); ctx.moveTo(-0.2 + k, -0.9 + k * 0.3); ctx.lineTo(1.6 + k * 0.3, -1.0 + k * 0.3); ctx.stroke(); } }
  ctx.shadowColor = sh;
  // 头
  const hr = o.headTilt || 0;
  ctx.save(); ctx.translate(2.2, -0.9); ctx.rotate(hr); ctx.translate(-2.2, 0.9);
  ctx.fillStyle = pal.body; ell(ctx, 3.05, -1.25, 1.25, 1.08, 0.35); ctx.fill();
  ctx.fillStyle = pal.dark;                               // 上颚
  ctx.beginPath(); ctx.moveTo(3.85, -0.55); ctx.quadraticCurveTo(4.75, -0.6, 4.55, 0.05); ctx.lineTo(4.25, -0.15); ctx.quadraticCurveTo(4.3, -0.4, 3.75, -0.3); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (!ink) { ctx.fillStyle = pal.hi; ctx.globalAlpha = a * 0.5; ell(ctx, 2.85, -1.85, 0.75, 0.3, 0.2); ctx.fill(); ctx.globalAlpha = a; }
  // 眼
  const ex = 3.35, ey = -1.4, eye = o.eye || 'open';
  if (ink) { ctx.fillStyle = '#efe2c8'; ell(ctx, ex, ey, 0.32, 0.32); ctx.fill(); ctx.fillStyle = '#2c241e'; ell(ctx, ex + 0.08, ey, 0.16, 0.16); ctx.fill(); }
  else if (eye === 'x') {
    ctx.strokeStyle = '#2a201a'; ctx.lineWidth = 0.17; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - 0.3, ey - 0.3); ctx.lineTo(ex + 0.3, ey + 0.3); ctx.moveTo(ex + 0.3, ey - 0.3); ctx.lineTo(ex - 0.3, ey + 0.3); ctx.stroke();
  } else {
    const er = eye === 'shock' ? 0.58 : 0.46;
    ctx.fillStyle = '#fbf5e8'; ell(ctx, ex, ey, er, er * 1.05); ctx.fill();
    ctx.strokeStyle = pal.dark; ctx.lineWidth = 0.08; ctx.stroke();
    const pr = eye === 'shock' ? 0.13 : 0.24, lk = o.lookX == null ? 0.12 : o.lookX;
    ctx.fillStyle = '#1e1714'; ell(ctx, ex + lk, ey + 0.04, pr, pr * 1.1); ctx.fill();
    if (eye !== 'flat') { ctx.fillStyle = '#ffffff'; ell(ctx, ex + lk - 0.08, ey - 0.08, pr * 0.35, pr * 0.35); ctx.fill(); }
    if (eye === 'flat') {                                 // 面无表情：上眼皮压一半，一条平线
      ctx.fillStyle = pal.body;
      ctx.beginPath(); ctx.rect(ex - 0.6, ey - 0.65, 1.2, 0.62); ctx.fill();
      ctx.strokeStyle = '#1e1714'; ctx.lineWidth = 0.12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - 0.5, ey - 0.03); ctx.lineTo(ex + 0.5, ey - 0.03); ctx.stroke();
    }
  }
  ctx.shadowColor = sh;
  ctx.restore();
  // 近侧：腿和触角
  for (let i = 0; i < 3; i++) drawLeg(ctx, legPose(i, false, o, t), pal.leg, ink);
  drawAntenna(ctx, o, t, false, pal.leg);
  ctx.restore();
}
// 本地坐标 → 世界坐标（给气泡、气味线找位置）
function pt(o, lx, ly) {
  const u = 26 * (o.s || 1), d = o.dir || 1, f = (o.flip ? -1 : 1) * (o.sy == null ? 1 : o.sy), c = Math.cos(o.ang || 0), s = Math.sin(o.ang || 0);
  const x = lx * u * d, y = ly * u * f;
  return [o.x + x * c - y * s, o.y + x * s + y * c];
}
// 沿运动方向摆放：返回 {ang, dir}，向左走时水平翻转而不是倒立
function orient(phi) {
  if (Math.cos(phi) < 0) return { ang: phi - Math.PI, dir: -1 };
  return { ang: phi, dir: 1 };
}
module.exports = { draw, pt, orient, PAL, FOOT: 2.8 };
