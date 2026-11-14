'use strict';
// 《INFP》主角：16P 官网的 INFP 小姑娘（绿发、发带、绿裙、风车），直接用官网 SVG 多边形（同 INFJ 绿老头，老板 10-28 允许）
//   infp(ctx, x, y, s, o)：(x, y) 是脚底中点，s=1 时站高约 560px
//   o: a 透明度, nod 点头, tilt 歪头, eyes 'open'|'wide'|'closed'|'happy'|'sad', look [dx,dy], mouth 'smile'|'o'|'flat',
//      la / ra 左右臂相对默认的转角（弧度，正=往下转）, spin 风车转角, wind 风车有没有（false=收起）,
//      flies 蝴蝶只数 0-3（默认 1，老板：别弄太多蝴蝶）, flap 扇翅相位, dim 变暗 0-1, lean 整体倾斜, t
const fs = require('fs');
const K = require('../core');
const { clamp, mix, glow } = K;
const P = JSON.parse(fs.readFileSync((process.env.INFP_DATA || 'F:/AI/lianai/11_INFP') + '/tmp/infp16p.json', 'utf8'));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const cen = pts => [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];

const FLY = [[58, 59, 60, 61], [54, 55, 56, 57], [62, 63, 64, 65]];
const BLADE = new Set([68, 69, 70, 71, 72, 73, 74, 66, 75]), STICK = 67;
const RA = new Set([36, 37, 38, 67, ...BLADE]), LA = new Set([42, 43, 53]);
const BODY = new Set([0, 1, 14, 35, 39, 40, 44, 45, 46, 47, 48, 49, 50, 51, 52]);
const EYE = new Set(P.map((p, i) => p.pts && p.pts.length === 32 && /2b2b2b/i.test(p.fill) && p.op === 1 ? i : -1).filter(i => i >= 0));
const MOUTH = new Set([20, 21]);
const PART = P.map((p, i) => FLY.some(g => g.includes(i)) ? 'fly' : RA.has(i) ? 'ra' : LA.has(i) ? 'la' : BODY.has(i) ? 'body' : 'head');
const PIV = { head: [218, 132], ra: [232, 212], la: [146, 214] };
const FOOT = [196, 391], WHEEL = [305, 176];
const FLYC = FLY.map(g => cen(g.flatMap(i => P[i].pts)));

function infp(ctx, x, y, s, o = {}) {
  const { a = 1, nod = 0, tilt = 0, eyes = 'open', look = [0, 0], mouth = 'smile', la = 0, ra = 0, spin = 0, wind = true, flies = 1, flap = 0, dim = 0, lean = 0, t = 0 } = o;
  if (a <= 0.003) return {};
  const k = 1.43 * s;
  const rot = { head: nod * 0.16 + tilt * 0.12, ra, la, body: 0, fly: 0 };
  const W2 = (px, py) => { const X = (px - FOOT[0]) * k, Y = (py - FOOT[1]) * k; return [x + X * Math.cos(lean) - Y * Math.sin(lean), y + X * Math.sin(lean) + Y * Math.cos(lean)]; };
  const R = (p, c, r) => { const cs = Math.cos(r), sn = Math.sin(r); return [c[0] + (p[0] - c[0]) * cs - (p[1] - c[1]) * sn, c[1] + (p[0] - c[0]) * sn + (p[1] - c[1]) * cs]; };
  const tf = (part, p) => (part === 'body' || part === 'fly') ? W2(...p) : W2(...R(p, PIV[part], rot[part]));
  ctx.save(); ctx.globalAlpha *= a;
  P.forEach((p, i) => {
    if (!p.pts) return;
    const part = PART[i];
    if (!wind && (BLADE.has(i) || i === STICK)) return;
    let pts = p.pts;
    if (part === 'fly') {
      const g = FLY.findIndex(q => q.includes(i)); if (g >= flies) return;
      const c = FLYC[g], f = 0.55 + 0.45 * Math.abs(Math.cos(t * 9 + flap + g * 2)), dx = Math.sin(t * 0.9 + g * 2.1) * 10, dy = Math.cos(t * 1.3 + g) * 8;
      pts = pts.map(([u, v]) => [c[0] + (u - c[0]) * f + dx, v + dy]);
    }
    if (BLADE.has(i)) pts = pts.map(q => R(q, WHEEL, spin));
    if (EYE.has(i)) { if (eyes !== 'open' && eyes !== 'wide') return; const sc = eyes === 'wide' ? 1.5 : 1, c = cen(pts); pts = pts.map(([u, v]) => [c[0] + (u - c[0]) * sc + look[0] * 2.2, c[1] + (v - c[1]) * sc + look[1] * 2]); }
    if (MOUTH.has(i) && mouth !== 'smile') return;
    let c = hex(p.fill); if (dim > 0) c = mix(c, [40, 44, 52], dim * 0.75);
    ctx.globalAlpha = a * p.op; ctx.fillStyle = rgb(c); ctx.beginPath();
    pts.forEach((q, j) => { const [X, Y] = tf(part, q); j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill();
  });
  ctx.globalAlpha = a;
  const E = [...EYE].map(i => tf('head', cen(P[i].pts)));
  ctx.strokeStyle = rgb([43, 43, 43]); ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
  if (eyes === 'closed' || eyes === 'happy' || eyes === 'sad') for (const [ex, ey] of E) {
    ctx.beginPath(); if (eyes === 'happy') ctx.arc(ex, ey + 2 * k, 4 * k, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(ex, ey - 2 * k, 4 * k, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  }
  const M = tf('head', [252, 98]);
  if (mouth === 'o') { ctx.fillStyle = rgb([110, 60, 50]); ctx.beginPath(); ctx.ellipse(M[0], M[1], 3.4 * k, 4.2 * k, 0, 0, Math.PI * 2); ctx.fill(); }
  if (mouth === 'flat') { ctx.beginPath(); ctx.moveTo(M[0] - 7 * k, M[1]); ctx.lineTo(M[0] + 7 * k, M[1] - 2 * k); ctx.stroke(); }
  ctx.restore();
  return { head: tf('head', [240, 70]), eyes: tf('head', [245, 65]), mouth: M, chest: tf('body', [200, 210]), wheel: tf('ra', WHEEL), lh: tf('la', [125, 252]), rh: tf('ra', [290, 205]), top: tf('head', [220, 0]) };
}
module.exports = { infp, LIME: [217, 227, 84], GREEN: [80, 174, 132], DRESS: [63, 143, 111] };
