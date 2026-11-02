// 蚁巢里的小工具：路径行走、气味线、刷子、迷你代码卡
'use strict';
const K = require('./core');
const { clamp, lerp, smooth, easeOut } = K;
const ANT = require('./ant');
const C = require('./card');

function mkPath(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, L, len: L[L.length - 1] };
}
function posAt(p, d) {
  d = clamp(d, 0, p.len);
  let i = 1; while (i < p.L.length - 1 && p.L[i] < d) i++;
  const u = (d - p.L[i - 1]) / ((p.L[i] - p.L[i - 1]) || 1);
  return [lerp(p.pts[i - 1][0], p.pts[i][0], u), lerp(p.pts[i - 1][1], p.pts[i][1], u)];
}
// 路径上 d 处的位置和朝向；back=true 表示倒着走（面朝路径起点）
function pose(p, d, back = false) {
  const a = posAt(p, d - 30), b = posAt(p, d + 30), [x, y] = posAt(p, d);
  let phi = Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (back) phi += Math.PI;
  return { x, y, ...ANT.orient(phi), phi };
}
const STRIDE = 60;   // 每走 60px 迈一轮腿
// 前进方向的“上”法线
function up(o) { const a = o.ang || 0; return [Math.sin(a), -Math.cos(a)]; }

// 气味线：一条扭动的纸带往上飘
function wisp(ctx, x, y, h, t, seed, a, grow = 1, col = '#8d9b42') {
  if (a <= 0.01 || grow <= 0.01) return;
  const pts = [];
  for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push([x + Math.sin(u * 7 + t * 2.2 + seed) * 22 * (0.4 + u), y - u * h]); }
  const q = K.partial(pts, grow);
  if (q.length < 2) return;
  ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(40,30,5,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = col; ctx.lineWidth = 13; ctx.stroke();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(230,240,180,0.45)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}
// 缠在蚂蚁身上的一圈圈气味线（螺旋）
function coil(ctx, o, t, a) {
  if (a <= 0.01) return;
  const pts = [];
  for (let k = 0; k <= 60; k++) { const u = k / 60; const lx = lerp(-5.6, 3.6, u), ly = -0.9 + Math.sin(u * Math.PI * 5 + t * 2.5) * 2.0; pts.push(ANT.pt(o, lx, ly)); }
  const q = K.partial(pts, a);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
  ctx.shadowColor = 'rgba(40,30,5,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = '#8d9b42'; ctx.lineWidth = 9; ctx.stroke();
  ctx.restore();
}
// 实验者的刷子（剪纸）：笔尖在 (x,y)
function brush(ctx, x, y, a, rot = 0.28) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(50,28,8,0.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#c08a4c'; ctx.beginPath(); ctx.roundRect(-17, -900, 34, 820, 14); ctx.fill();
  ctx.fillStyle = '#a9a59b'; ctx.beginPath(); ctx.roundRect(-24, -110, 48, 64, 6); ctx.fill();
  ctx.fillStyle = '#3a2b20'; ctx.beginPath(); ctx.moveTo(-24, -50); ctx.quadraticCurveTo(-30, -14, 0, 0); ctx.quadraticCurveTo(30, -14, 24, -50); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#8d9b42'; ctx.beginPath(); ctx.moveTo(-18, -22); ctx.quadraticCurveTo(-14, -4, 0, 0); ctx.quadraticCurveTo(14, -4, 18, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,210,0.3)'; ctx.fillRect(-10, -880, 6, 780);
  ctx.restore();
}
// 头顶的迷你代码卡（世界坐标，下边中点在 x,y）
const MINI = 'IF 气味 → 抬出';
function mini(ctx, x, y, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.font = C.CODE(62);
  const w = ctx.measureText(MINI).width + 56, h = 100;
  ctx.restore();
  C.card(ctx, x - w / 2, y - h, w, h, { alpha: clamp(a), scale: 0.6 + 0.4 * easeOut(a), seed: 3, blur: 10, dy: 5,
    inner: c => C.codeLine(c, MINI, 28, 72, { size: 62 }) });
}

module.exports = { mkPath, posAt, pose, up, STRIDE, wisp, coil, brush, mini };
