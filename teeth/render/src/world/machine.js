// 咬合（副歌 2）：一台机器。齿轮的齿就是"牙"——每一下跺脚，整组齿轮咬进一齿（棘轮式地跳一格），
// 咬合处溅出火星；正中最大的齿轮，轴心是一颗心形的孔，透出品红色的光。背景是工程图纸的网格和标注
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, glow, text, mulberry32 } = K;
const A = require('../audio');

const MOD = 26;                                     // 模数：所有齿轮齿距相同才能啮合
const mk = (n, x, y, layer, col) => ({ n, r: n * MOD / (2 * Math.PI), x, y, layer, col });
// 主链：中心大齿轮 + 一圈啮合的齿轮
const G = [];
G.push(mk(64, W / 2, H / 2 + 20, 1, C.magenta));
function attach(parent, n, ang, col, layer = 1) {
  const r = n * MOD / (2 * Math.PI), d = parent.r + r;
  const g = mk(n, parent.x + Math.cos(ang) * d, parent.y + Math.sin(ang) * d, layer, col);
  g.parent = parent; g.ang = ang; G.push(g); return g;
}
const g1 = attach(G[0], 24, Math.PI * 1.05, C.cyan), g2 = attach(G[0], 18, -0.25, C.cyan), g3 = attach(G[0], 30, 0.75, C.violet);
attach(g1, 14, Math.PI * 0.62, C.steel); attach(g1, 20, Math.PI * 1.45, C.violet);
attach(g2, 36, -0.9, C.steel); attach(g3, 16, 0.3, C.cyan); attach(g2, 12, 0.6, C.pink);
// 后景的大齿轮（不啮合，只是慢慢转，增加纵深）
const BACK = [mk(90, 260, 160, 0, C.teal), mk(70, W - 200, H - 140, 0, C.violet), mk(110, W - 380, 40, 0, C.steel), mk(60, 120, H - 80, 0, C.teal)];

// 每个齿轮的转角：驱动轮按"咬了几下"跳齿；被动轮按齿数比反向转，并对齐齿位
function angles(t) {
  const { k, s } = A.sinceBeat(t);
  const n = A.bitesAt(t), fr = A.isHit(k) ? easeOut(clamp(s / 0.12)) : 1;
  const steps = n - (A.isHit(k) ? 1 : 0) + fr;
  const base = steps * (2 * Math.PI / G[0].n) + t * 0.01;
  const out = new Map();
  out.set(G[0], base);
  for (const g of G.slice(1)) {
    const p = g.parent, ap = out.get(p);
    out.set(g, -(p.n / g.n) * (ap - g.ang) + g.ang + Math.PI + Math.PI / g.n);
  }
  return out;
}
function heartPath(ctx, s) {
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const u = i / 80 * 6.2832;
    const x = 16 * Math.pow(Math.sin(u), 3), y = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
    i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s);
  }
  ctx.closePath();
}
function gear(ctx, g, ang, alpha, heart, hit) {
  const { n, r } = g, ro = r + MOD * 0.42, ri = r - MOD * 0.55;
  ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(ang);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = i / n * 6.2832, da = 6.2832 / n;
    ctx.lineTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    ctx.lineTo(Math.cos(a0 + da * 0.18) * ro, Math.sin(a0 + da * 0.18) * ro);
    ctx.lineTo(Math.cos(a0 + da * 0.48) * ro, Math.sin(a0 + da * 0.48) * ro);
    ctx.lineTo(Math.cos(a0 + da * 0.66) * ri, Math.sin(a0 + da * 0.66) * ri);
  }
  ctx.closePath();
  // 镂空：轮辐之间的孔
  const holes = Math.max(3, Math.min(6, Math.floor(n / 8)));
  if (r > 70) for (let i = 0; i < holes; i++) {
    const a0 = i / holes * 6.2832 + 0.3, a1 = a0 + 6.2832 / holes * 0.62;
    ctx.moveTo(Math.cos(a0) * r * 0.72, Math.sin(a0) * r * 0.72);
    ctx.arc(0, 0, r * 0.72, a0, a1); ctx.arc(0, 0, r * 0.38, a1, a0, true); ctx.closePath();
  }
  const mg = ctx.createLinearGradient(-ro, -ro, ro, ro);
  mg.addColorStop(0, rgba(mix([40, 48, 64], g.col, 0.12), alpha)); mg.addColorStop(0.5, rgba([18, 20, 30], alpha)); mg.addColorStop(1, rgba(mix([34, 40, 56], g.col, 0.18), alpha));
  ctx.fillStyle = mg; ctx.fill('evenodd');
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(g.col, (0.45 + 0.35 * hit) * alpha); ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
  // 轮毂和刻度
  ctx.strokeStyle = rgba(g.col, 0.35 * alpha); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 6.2832); ctx.stroke();
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * (i % 6 ? 0.83 : 0.87), Math.sin(a) * r * (i % 6 ? 0.83 : 0.87)); ctx.stroke(); }
  if (heart) {
    ctx.rotate(-ang);
    heartPath(ctx, r * 0.016);
    ctx.fillStyle = rgba([30, 4, 24], alpha); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(C.magenta, (0.7 + 0.3 * hit) * alpha); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = rgba([10, 12, 18], alpha); ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

function draw(ctx, t, S) {
  const hit = A.hit(t, 8), mid = A.env('mid', t);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, 'rgb(16,20,34)'); bg.addColorStop(1, 'rgb(4,5,10)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // 图纸网格
  ctx.strokeStyle = 'rgba(110,200,230,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= W; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 48) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  const cam = 0.035 * Math.sin(t * 0.2);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(cam); ctx.scale(1.04 + 0.03 * Math.sin(t * 0.13), 1.04 + 0.03 * Math.sin(t * 0.13)); ctx.translate(-W / 2, -H / 2);
  for (const b of BACK) gear(ctx, b, t * 0.05 * (b.x < W / 2 ? 1 : -1), 0.35, false, 0);
  const ang = angles(t);
  glow(ctx, G[0].x, G[0].y, 380, C.magenta, 0.12 + 0.18 * hit);
  for (const g of G) gear(ctx, g, ang.get(g), 1, g === G[0], hit);
  // 尺寸标注（齿数、齿距）
  for (const g of G) text(ctx, `Z${g.n}`, g.x + g.r * 0.5, g.y - g.r * 0.5, { family: 'Mono', size: 11, alpha: 0.4, color: C.ice, align: 'left' });
  // 火星：每一下跺脚从每一处咬合点溅出
  const { k } = A.sinceBeat(t);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let j = k; j > k - 3; j--) {
    if (!A.isHit(j)) continue;
    const age = t - A.beatT(j); if (age < 0 || age > 1.1) continue;
    for (const g of G.slice(1)) {
      const p = g.parent, mx = lerp(p.x, g.x, p.r / (p.r + g.r)), my = lerp(p.y, g.y, p.r / (p.r + g.r));
      const r = mulberry32(j * 97 + g.n);
      for (let q = 0; q < 16; q++) {
        const a = r() * 6.2832, v = 200 + r() * 420;
        const x = mx + Math.cos(a) * v * age, y = my + Math.sin(a) * v * age + 500 * age * age;
        const x0 = mx + Math.cos(a) * v * Math.max(0, age - 0.04), y0 = my + Math.sin(a) * v * Math.max(0, age - 0.04) + 500 * Math.pow(Math.max(0, age - 0.04), 2);
        const life = 1 - age / 1.1;
        ctx.strokeStyle = rgba(r() < 0.3 ? C.white : C.amber, life * A.hitAt(j)); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
      }
      glow(ctx, mx, my, 50, C.amber, 0.6 * Math.exp(-age * 8) * A.hitAt(j));
    }
  }
  ctx.restore();
  ctx.restore();
}
const lyricStyle = () => ({ y: H - 110, size: 46, accent: C.cyan });
module.exports = { draw, lyricStyle };
