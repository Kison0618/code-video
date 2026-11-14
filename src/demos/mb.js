'use strict';
// 16Personalities 官网 16 型角色（多边形数据，来自 05_16型角色/*.json）：缩小版配角
//   MB.person(ctx, 'enfp-female', x, y, s, { a, bob, lean, flip, slump, inner, innerC, gray, dim, shadow })
//   y = 脚底；s = 1 时身高约 240px，和 G.folk 同一尺度；返回 { head, chest, top }
const fs = require('fs');
const { Path2D } = require('skia-canvas');
const K = require('../core');
const { clamp, lerp, mix, glow } = K;
const DIR = process.env.INFP_DATA ? process.env.INFP_DATA + '/chars16/' : 'F:/AI/lianai/07_INFJ/素材_表情包/05_16型角色/';
const CACHE = {};
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
function load(key) {
  if (CACHE[key]) return CACHE[key];
  const raw = JSON.parse(fs.readFileSync(DIR + key + '.json', 'utf8'));
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const polys = raw.map(p => {
    const c = /^#/.test(p.fill || '') ? hex(p.fill) : [0, 0, 0];
    const o = { c, op: p.op == null ? 1 : p.op };
    if (p.pts) { o.pts = p.pts; for (const [x, y] of p.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    else if (p.d) { try { o.path = new Path2D(p.d); } catch (e) { return null; } }
    return o;
  }).filter(Boolean);
  return (CACHE[key] = { polys, x0, x1, y0, y1, cx: (x0 + x1) / 2, h: y1 - y0 });
}
const GRAY = [128, 130, 134];
function person(ctx, key, x, y, s, o = {}) {
  const { a = 1, bob = 0, lean = 0, flip = false, slump = 0, inner = 0, innerC = [255, 220, 150], gray = 0, dim = 0, shadow = 1, warm = 0 } = o;
  const M = load(key), k = s * 240 / M.h, hh = M.h * k * (1 - slump * 0.08);
  const out = { head: [x, y - bob - hh * 0.86], chest: [x, y - bob - hh * 0.55], top: [x, y - bob - hh] };
  if (a <= 0.003) return out;
  // 脚下的接触阴影
  if (shadow > 0) { ctx.save(); ctx.globalAlpha *= a * shadow * 0.55; const g = ctx.createRadialGradient(x, y, 2, x, y, 70 * s); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + 2, 70 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.save();
  ctx.translate(x, y - bob); ctx.rotate(lean + slump * 0.12);
  ctx.scale((flip ? -1 : 1) * k, k * (1 - slump * 0.08));
  ctx.translate(-M.cx, -M.y1);
  const base = ctx.globalAlpha * a;
  for (const p of M.polys) {
    let c = p.c;
    if (gray > 0) c = mix(c, GRAY, gray);
    if (warm > 0) c = mix(c, [255, 222, 170], warm * 0.35);
    if (dim > 0) c = mix(c, [14, 18, 26], dim);
    ctx.globalAlpha = base * p.op;
    ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    if (p.pts) { ctx.beginPath(); p.pts.forEach(([u, v], i) => i ? ctx.lineTo(u, v) : ctx.moveTo(u, v)); ctx.closePath(); ctx.fill(); }
    else ctx.fill(p.path);
  }
  ctx.restore();
  if (inner > 0.01) { glow(ctx, out.chest[0], out.chest[1], 160 * s * inner, innerC, 0.45 * inner * a); glow(ctx, out.chest[0], out.chest[1], 50 * s, [255, 250, 230], 0.35 * inner * a); }
  return out;
}
// 和 G.folk 同签名的包装：MB.as('enfp-female')(ctx, x, y, s, o)
const as = key => (ctx, x, y, s, o = {}) => person(ctx, key, x, y, s, o);
// 按位置固定挑一个类型（同一个位置每帧都是同一个人）
const pick = (x, list) => list[Math.abs(Math.round(x / 37)) % list.length];
const ALL = ['intj-male', 'intp-male', 'intp-female', 'entj-male', 'entj-female', 'entp-male', 'entp-female', 'infj-female', 'infp-male', 'infp-female', 'enfj-male', 'enfj-female',
  'enfp-male', 'enfp-female', 'istj-male', 'istj-female', 'isfj-male', 'isfj-female', 'estj-male', 'estj-female', 'esfj-male', 'esfj-female', 'istp-male', 'istp-female',
  'isfp-male', 'isfp-female', 'estp-male', 'estp-female', 'esfp-male', 'esfp-female'];
module.exports = { person, as, pick, load, ALL };
