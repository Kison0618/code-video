// 第四幕 流动：物质流过漩涡，形状留下（222–271 秒）
'use strict';
const K = require('../core');
const { W, H, C, clamp, lerp, prog, smooth, easeInOut, easeOut, vis, glow, glowLine, line, text, fmt, mulberry32, rgba, mix } = K;
const UI = require('../ui');

const events = [];
const VX = 960, VY = 500;
const U = 150;                        // 远处流速 px/s
const RS = 230;                       // 驻点半径
const GAM = 2 * Math.PI * RS * U;     // 环量
const CORE = 70;
function vel(x, y) {
  const dx = x - VX, dy = y - VY, r2 = dx * dx + dy * dy, r = Math.sqrt(r2) + 1e-6;
  const vt = r < CORE ? GAM / (2 * Math.PI) * r / (CORE * CORE) : GAM / (2 * Math.PI * r);
  // 逆时针旋转（屏幕坐标里 y 向下）
  return [U + (-dy / r) * vt, (dx / r) * vt];
}
// RK4 积分一条流线，记录时间戳
function integrate(x, y, maxT, stop) {
  const dt = 1 / 120, pts = [[x, y]];
  for (let k = 0; k < maxT / dt; k++) {
    const [ax, ay] = vel(x, y);
    const [bx, by] = vel(x + ax * dt / 2, y + ay * dt / 2);
    const [cx, cy] = vel(x + bx * dt / 2, y + by * dt / 2);
    const [ex, ey] = vel(x + cx * dt, y + cy * dt);
    x += dt / 6 * (ax + 2 * bx + 2 * cx + ex); y += dt / 6 * (ay + 2 * by + 2 * cy + ey);
    pts.push([x, y]);
    if (stop(x, y, pts)) break;
  }
  return { pts, dt, T: (pts.length - 1) * dt };
}
const OPEN = [], CLOSED = [];
{
  for (let y = -160; y <= H + 160; y += 11) {
    const s = integrate(-120, y, 60, x => x > W + 120);
    if (s.pts[s.pts.length - 1][0] > W) OPEN.push(s);
  }
  for (let r = 22; r <= RS - 14; r += 4) {
    let ang = 0, prevA = Math.atan2(-r, 0);
    const s = integrate(VX, VY - r, 30, (x, y) => {
      const a = Math.atan2(y - VY, x - VX); let d = a - prevA;
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      ang += d; prevA = a; return Math.abs(ang) >= 2 * Math.PI;
    });
    CLOSED.push(s);
  }
}
function at(s, tau, wrap = true) {
  let u = tau / s.dt;
  if (wrap) { const n = s.pts.length - 1; u = ((u % n) + n) % n; }
  const i = Math.floor(u), f = u - i;
  const p = s.pts[Math.min(i, s.pts.length - 1)], q = s.pts[Math.min(i + 1, s.pts.length - 1)];
  return [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
}
// 粒子：流过的（象牙/青）与在漩涡里停留一阵后离开的（金）
const PARTS = [];
{
  const r = mulberry32(31);
  for (const s of OPEN) for (let k = 0; k < 30; k++) PARTS.push({ s, ph: r() * s.T, open: true, tone: r() });
  for (const s of CLOSED) for (let k = 0; k < 30; k++) PARTS.push({ s, ph: r() * s.T, open: false, life: 3 + r() * 3, lph: r() * 6, tone: r() });
}

function drawFlow(ctx, t) {
  if (t < 221.5 || t > 272) return;
  const a = smooth(prog(t, 222.0, 226.4)) * (1 - smooth(prog(t, 267.0, 270.5)));
  const quoteDim = 1 - 0.62 * vis(t, 257.6, 266.4, 1.0, 1.0);
  const A = a * quoteDim;
  if (A <= 0) return;
  const tt = t - 200; // 流动时间
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  // 按颜色分桶批量描绘
  const buckets = new Map();
  const add = (key, col, alpha, w, x0, y0, x1, y1) => {
    const k = key;
    if (!buckets.has(k)) buckets.set(k, { col, alpha, w, segs: [] });
    buckets.get(k).segs.push(x0, y0, x1, y1);
  };
  for (const p of PARTS) {
    const tau = tt + p.ph;
    const [x1, y1] = at(p.s, tau), [x0, y0] = at(p.s, tau - 0.15);
    if (Math.hypot(x1 - x0, y1 - y0) > 140) continue; // 回绕处
    if (p.open) {
      if (x1 < -20 || x1 > W + 20) continue;
      const near = Math.exp(-Math.pow(Math.hypot(x1 - VX, y1 - VY) / 520, 2));
      const lvl = Math.min(3, Math.floor(near * 4));
      add('o' + lvl, mix(C.cyan, C.ivory, 0.3 + 0.2 * lvl), 0.22 + 0.16 * lvl, 1.4, x0, y0, x1, y1);
    } else {
      // 每粒金色粒子只在漩涡里待一段时间：淡入、转几圈、淡出，再换一粒
      const ph = ((t + p.lph) % p.life) / p.life;
      const life = Math.sin(Math.PI * ph);
      const lvl = Math.min(3, Math.floor(life * 4));
      if (lvl === 0) continue;
      add('c' + lvl, mix(C.gold, C.ivory, p.tone * 0.4), 0.2 * lvl, 1.7, x0, y0, x1, y1);
    }
  }
  for (const b of buckets.values()) {
    ctx.strokeStyle = rgba(b.col, clamp(b.alpha * A));
    ctx.lineWidth = b.w;
    ctx.beginPath();
    for (let i = 0; i < b.segs.length; i += 4) { ctx.moveTo(b.segs[i], b.segs[i + 1]); ctx.lineTo(b.segs[i + 2], b.segs[i + 3]); }
    ctx.stroke();
  }
  ctx.restore();
  glow(ctx, VX, VY, 320, C.amber, 0.16 * A);
  glow(ctx, VX, VY, 60, C.gold, 0.35 * A);

  // 标注：物质流过 / 形状留下
  const la = vis(t, 251.6, 258.0, 0.8, 0.8) * a;
  if (la > 0) {
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = rgba(C.gold, 0.5 * la); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(VX, VY, RS + 12, 0, 6.283); ctx.stroke();
    ctx.restore();
    text(ctx, '形状 · 留下', VX + RS + 60, VY - 8, { size: 26, weight: 300, align: 'left', alpha: 0.95 * la, color: C.gold, spacing: 0.2 });
    text(ctx, 'THE SHAPE REMAINS', VX + RS + 62, VY + 22, { size: 12, family: 'Mono', align: 'left', alpha: 0.5 * la, spacing: 0.35 });
    const lb = la * smooth(prog(t, 251.6, 252.6));
    text(ctx, '物质 · 流过', 210, 236, { size: 26, weight: 300, align: 'left', alpha: 0.95 * lb, spacing: 0.2 });
    text(ctx, 'MATTER FLOWS THROUGH', 212, 266, { size: 12, family: 'Mono', align: 'left', alpha: 0.5 * lb, spacing: 0.35 });
    line(ctx, [[212, 290], [420, 290]], C.ivory, 0.5 * lb, 1);
    line(ctx, [[420, 290], [408, 284]], C.ivory, 0.5 * lb, 1);
    line(ctx, [[420, 290], [408, 296]], C.ivory, 0.5 * lb, 1);
  }
  // HUD：更换的细胞
  const h1 = vis(t, 232.6, 239.3, 0.5, 0.4);
  const n = 3.8e6 * Math.max(0, t - 232.8);
  UI.hud(ctx, h1, { label: '你的身体更换的细胞', en: 'CELLS REPLACED SINCE THIS LINE', value: `${fmt(n)} 个`, valueEn: '≈ 3,800,000 PER SECOND' });
  UI.hud(ctx, vis(t, 239.6, 244.4, 0.4, 0.6), { label: '你的身体更换的细胞', en: 'CELLS REPLACED', value: '≈ 330,000,000,000 个 / 天', valueEn: 'PER DAY' });
}

function draw(ctx, t) { drawFlow(ctx, t); }
module.exports = { start: 221.5, end: 272, draw, events, VX, VY };
