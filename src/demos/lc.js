'use strict';
// 恋爱风格片公共视觉语言：暖黑底、两颗光（人）、一根红线（依恋）、锋利切字、勾选清单
const K = require('../core');
const L = require('../lib');
const FX = require('../fx');
const { W, H, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, glowLine, rgba, mix } = K;

const P = {
  bg: [6, 5, 7], wine: [30, 10, 16],
  ivory: [238, 230, 220], dim: [128, 120, 122], faint: [70, 64, 68],
  red: [232, 56, 66], redHot: [255, 120, 110],
  ember: [255, 156, 112], ice: [140, 200, 236], gold: [238, 204, 146], white: [255, 250, 244], ghost: [180, 178, 190],
};

const DUST = (() => { const r = K.mulberry32(5), o = []; for (let i = 0; i < 260; i++) o.push({ x: r() * W, y: r() * H, s: r() < 0.07 ? 2 : 1.1, a: 0.03 + r() * r() * 0.26, ph: r() * 6.28, sp: 0.3 + r() * 1.4 }); return o; })();
function bg(ctx, t, o = {}) {
  const { lift = 1, cx = W / 2, cy = H * 0.55, tint = P.wine } = o;
  ctx.fillStyle = rgba(P.bg); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.9);
  g.addColorStop(0, rgba(tint, 0.9 * lift)); g.addColorStop(0.5, rgba(tint, 0.3 * lift)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const d of DUST) {
    ctx.fillStyle = rgba(P.ivory, d.a * (0.6 + 0.4 * Math.sin(t * d.sp + d.ph)));
    ctx.fillRect(d.x + Math.sin(t * 0.07 + d.ph) * 8, (d.y - t * 2.2 + H * 40) % H, d.s, d.s);
  }
}

// 红线：基线 A→B + 下垂 + 驻波 + 行进脉冲（from:1 = 从 B 往 A 走）
function ropePts(A, B, t, o) {
  const { sag = 0, modes = [], pulses = [], N = 180 } = o;
  const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, sgn = ny < 0 ? -1 : 1;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N; let d = sag * Math.sin(Math.PI * s);
    for (const [k, a, f, ph] of modes) d += a * Math.sin(k * Math.PI * s) * Math.sin(2 * Math.PI * f * t + ph);
    for (const p of pulses) {
      const c = (t - p.t0) * p.v; if (c < -0.2 || c > 1.25) continue;
      const cc = p.from ? 1 - c : c, env = Math.sin(Math.PI * s) ** 0.5;
      d += p.amp * Math.exp(-(((s - cc) / p.w) ** 2)) * env * (1 - 0.4 * clamp(c));
    }
    pts.push([A[0] + dx * s + nx * sgn * d, A[1] + dy * s + ny * sgn * d]);
  }
  return pts;
}
function rope(ctx, A, B, t, o = {}) {
  const { color = P.red, a = 1, w = 2.2, heat = 0 } = o;
  if (a <= 0.003) return ropePts(A, B, t, o);
  const pts = ropePts(A, B, t, o);
  glowLine(ctx, pts, color, a, w, 1.4 + heat);
  if (heat > 0) glowLine(ctx, pts, P.redHot, a * heat * 0.6, w * 0.6, 2.2);
  glowLine(ctx, pts, P.white, a * 0.22, w * 0.35, 0.4);
  return pts;
}
const along = (pts, s) => pts[Math.round(clamp(s) * (pts.length - 1))];
// 沿线跑的光珠
function bead(ctx, pts, s, c, a = 1, r = 30) {
  if (a <= 0.003 || s < 0 || s > 1) return;
  const p = along(pts, s); glow(ctx, p[0], p[1], r, c, 0.75 * a); glow(ctx, p[0], p[1], r * 0.28, P.white, 0.9 * a);
}

// 一个人：光核 + 心跳（咚-咚两下各放一圈细环）
function person(ctx, x, y, t, o = {}) {
  const { c = P.ember, r = 16, bpm = 66, ph = 0, a = 1, rings = 1, ringR = 160 } = o;
  if (a <= 0.003) return;
  const per = 60 / bpm, u = ((t - ph) % per + per) % per;
  const beat = Math.exp(-u * 14) + (u > 0.2 ? 0.6 * Math.exp(-(u - 0.2) * 16) : 0);
  glow(ctx, x, y, r * 9, c, 0.22 * a * (1 + beat * 0.6));
  glow(ctx, x, y, r * 3, c, 0.85 * a);
  glow(ctx, x, y, r * (1.05 + 0.35 * beat), P.white, a);
  if (rings > 0.01) {
    const n0 = Math.floor((t - ph) / per);
    for (let n = n0 - 3; n <= n0; n++) for (const [off, k] of [[0, 1], [0.2, 0.55]]) {
      L.shock(ctx, x, y, t, ph + n * per + off, { r0: r * 1.4, r1: ringR * (k === 1 ? 1 : 0.75), dur: 1.5, c, a: 0.55 * a * k * rings, w: 1.1 });
    }
  }
}

// 锋利大字：红发丝横切，上下两半错位合上
function cut(ctx, str, x, y, t, t0, t1, o = {}) {
  const { size = 92, keys = [], keyColor = P.red, weight = 500, spacing = 0.1 } = o;
  if (t < t0 || t > t1 + 0.6) return;
  const w = K.measure(ctx, str, { size, weight, spacing }), x0 = x - w / 2, x1 = x + w / 2;
  const u = prog(t, t0, t0 + 0.42), m = easeOutExpo(prog(t, t0 + 0.12, t0 + 0.75));
  const out = smooth(prog(t, t1, t1 + 0.6)), a = smooth(prog(t, t0 + 0.1, t0 + 0.35)) * (1 - out);
  const midY = y - size * 0.36, off = (1 - m) * 70;
  const hx = lerp(x0 - 140, x1 + 140, easeOut(u));
  if (u < 1) { glowLine(ctx, [[x0 - 140, midY], [hx, midY]], P.red, 0.9 * (1 - out), 1.2, 1); glow(ctx, hx, midY, 60, P.redHot, 0.8); }
  glowLine(ctx, [[x0 - 140, midY], [x1 + 140, midY]], P.red, 0.35 * (1 - smooth(prog(t, t0 + 0.4, t0 + 1.4))) * (1 - out), 0.8, 0.6);
  for (const [top, dx] of [[1, off], [0, -off]]) {
    ctx.save(); ctx.beginPath();
    if (top) ctx.rect(0, 0, W, midY); else ctx.rect(0, midY, W, H);
    ctx.clip();
    L.rich(ctx, str, x + dx, y, { size, weight, spacing, color: P.ivory, keys, keyColor, alpha: a, glowKey: 0.55 });
    ctx.restore();
  }
}
// 两行大字（第二行晚半拍切入）
function cut2(ctx, l1, l2, t, t0, t1, o = {}) {
  const { y = 250, gap = 118 } = o;
  cut(ctx, l1, W / 2, y, t, t0, t1, { ...o, keys: o.keys1 || o.keys || [], keyColor: o.kc1 || o.keyColor });
  cut(ctx, l2, W / 2, y + gap, t, t0 + 0.55, t1, { ...o, keys: o.keys2 || o.keys || [], keyColor: o.kc2 || o.keyColor });
}

// —— 粒子聚字：采样笔画像素 → 粒子从四周（或指定光点）沿弧线飞来落进笔画 → 真字接管；退场时字再散成光尘上飘 ——
const tgtCache = new Map();
function strokeTargets(str, x, y, o) {
  const { size, keys = [], keyColor = P.red, weight = 500, spacing = 0.1 } = o;
  const key = [str, x, y, size, weight].join('|');
  if (tgtCache.has(key)) return tgtCache.get(key);
  const cv = new K.Canvas(W, H), c = cv.getContext('2d');
  L.rich(c, str, x, y, { size, weight, spacing, color: P.ivory, keys, keyColor, glowKey: 0 });
  const y0 = Math.max(0, Math.floor(y - size * 1.05)), y1 = Math.min(H, Math.ceil(y + size * 0.35));
  const d = c.getImageData(0, y0, W, y1 - y0).data, pts = [], st = size > 80 ? 3 : 2;
  for (let yy = 0; yy < y1 - y0; yy += st) for (let xx = 0; xx < W; xx += st) { const k = (yy * W + xx) * 4; if (d[k + 3] > 150) pts.push([xx, yy + y0, [d[k], d[k + 1], d[k + 2]]]); }
  const r = K.mulberry32(str.length * 131 + Math.round(y)), n = Math.min(2200, pts.length), out = [];
  for (let i = 0; i < n; i++) out.push(pts.splice(Math.floor(r() * pts.length), 1)[0]);
  const res = out.map(([px, py, col]) => {
    const a = r() * 6.283, R = 500 + r() * 900;
    return { x: px, y: py, col, sx: x + Math.cos(a) * R, sy: y + Math.sin(a) * R * 0.55, ph: r() * 6.28, dl: (px - (x - 700)) / 1400 * 0.35 + r() * 0.3, cu: (r() - 0.5) * 2, up: 40 + r() * 160 };
  });
  tgtCache.set(key, res); return res;
}
function gather(ctx, str, x, y, t, t0, t1, o = {}) {
  const { size = 92, keys = [], keyColor = P.red, weight = 500, spacing = 0.1, from = null } = o;
  if (t < t0 || t > t1 + 1.2) return;
  const age = t - t0, outU = prog(t, t1, t1 + 1.1);
  const Q = strokeTargets(str, x, y, { size, keys, keyColor, weight, spacing });
  const real = smooth(prog(age, 1.05, 1.6)) * (1 - smooth(prog(t, t1, t1 + 0.35)));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const q of Q) {
    const f = easeInOut(prog(age, q.dl, q.dl + 1.0));
    let sx = q.sx, sy = q.sy;
    if (from) { const b = easeOut(prog(age, 0, 0.4)); sx = lerp(from[0], q.sx, b * 0.45); sy = lerp(from[1], q.sy, b * 0.45); }
    const curl = Math.sin(f * Math.PI) * 120 * q.cu;
    let px = lerp(sx, q.x, f) + curl, py = lerp(sy, q.y, f) - curl * 0.35;
    let a = (0.35 + 0.65 * f) * (1 - smooth(prog(age, 1.5, 2.3)) * 0.88);
    if (outU > 0) { const e = easeOut(outU); px = q.x + Math.sin(q.ph + t) * 30 * e + q.cu * 60 * e; py = q.y - q.up * e; a = 0.9 * (1 - smooth(outU)) * smooth(prog(outU, 0, 0.15)); }
    if (a <= 0.01) continue;
    const col = f > 0.75 ? q.col : mix(P.ember, q.col, f);
    const tw = 0.75 + 0.25 * Math.sin(t * 11 + q.ph);
    glow(ctx, px, py, f > 0.95 && outU <= 0 ? 3 : 4.5, col, a * tw);
  }
  // 落定那一下：沿字面一道柔光掠过
  const fl = Math.exp(-Math.max(0, age - 1.15) * 5) * (age > 1.0 ? 1 : 0);
  if (fl > 0.02) { const w = K.measure(ctx, str, { size, weight, spacing }); glow(ctx, x, y - size * 0.35, w * 0.6, mix(P.gold, P.white, 0.4), 0.18 * fl); }
  ctx.restore();
  L.rich(ctx, str, x, y, { size, weight, spacing, color: P.ivory, keys, keyColor, alpha: real, glowKey: 0.55 });
}
// 光扫显影：一道竖光从左往右扫，扫过处字由虚到实，光边抖落细尘
function sweep(ctx, str, x, y, t, t0, t1, o = {}) {
  const { size = 92, keys = [], keyColor = P.gold, weight = 500, spacing = 0.1, dur = 1.6 } = o;
  if (t < t0 || t > t1 + 0.8) return;
  const w = K.measure(ctx, str, { size, weight, spacing }), x0 = x - w / 2 - 20, x1 = x + w / 2 + 20;
  const u = easeInOut(prog(t, t0, t0 + dur)), ex = lerp(x0, x1, u), out = 1 - smooth(prog(t, t1, t1 + 0.7));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, ex, H); ctx.clip();
  L.rich(ctx, str, x, y, { size, weight, spacing, color: P.ivory, keys, keyColor, alpha: out, glowKey: 0.55 });
  ctx.restore();
  if (u > 0 && u < 1) {
    const ey = y - size * 0.36;
    for (let k = -4; k <= 4; k++) glow(ctx, ex, ey + k * size * 0.2, size * 0.42, mix(P.gold, P.white, 0.3), 0.22 * (1 - Math.abs(k) / 5));
    glow(ctx, ex, ey, size * 1.3, P.gold, 0.3);
    for (let k = 0; k < 26; k++) { const h = K.hash(k * 7.3 + Math.floor(t * 30)), g = K.hash(k * 3.1); glow(ctx, ex - h * 90, ey + (g - 0.5) * size * 1.4 - h * 30, 3.2, P.gold, 0.8 * (1 - h)); }
  }
}
// 两行大字按 mode 分派：gather（默认）/ sweep / cut
function big2(ctx, l1, l2, t, t0, t1, o = {}) {
  const { y = 250, gap = 118, mode = 'gather' } = o;
  const fn = mode === 'cut' ? (s, yy, ta, oo) => cut(ctx, s, W / 2, yy, t, ta, t1, oo) : mode === 'sweep' ? (s, yy, ta, oo) => sweep(ctx, s, W / 2, yy, t, ta, t1, oo) : (s, yy, ta, oo) => gather(ctx, s, W / 2, yy, t, ta, t1, oo);
  fn(l1, y, t0, { ...o, keys: o.keys1 || [], keyColor: o.kc1 || o.keyColor || P.red });
  fn(l2, y + gap, t0 + (mode === 'sweep' ? 0.7 : 0.55), { ...o, keys: o.keys2 || [], keyColor: o.kc2 || o.keyColor || P.red });
}

// 对号入座清单：逐条亮起，当前条亮、之前的变灰；每条前一个小圈，亮起时打上勾
function checklist(ctx, items, t, t0, step, tEnd, o = {}) {
  const { x = 150, y = 300, dy = 92, size = 50, c = P.ember, past = P.dim, pastA = 0.75 } = o;
  const out = smooth(prog(t, tEnd, tEnd + 0.6));
  if (t < t0 - 0.3 || out >= 1) return;
  items.forEach((s, i) => {
    const ta = t0 + i * step, a = smooth(prog(t, ta, ta + 0.35)) * (1 - out);
    if (a <= 0.003) return;
    const cur = t < ta + step || i === items.length - 1 && t < tEnd;
    const yy = y + i * dy, dx = (1 - easeOut(prog(t, ta, ta + 0.5))) * 30;
    // 圈
    L.ellipse(ctx, x + 14, yy - size * 0.34, 14, 14, cur ? c : past, a * (cur ? 0.95 : 0.6 * pastA / 0.75), 1.4);
    const ck = easeOut(prog(t, ta + 0.15, ta + 0.5));
    if (ck > 0) glowLine(ctx, K.partial([[x + 6, yy - size * 0.34], [x + 12, yy - size * 0.34 + 7], [x + 24, yy - size * 0.34 - 9]], ck), cur ? c : past, a, 1.6, 0.6);
    L.rich(ctx, s, x + 50 + dx, yy, { size, weight: cur ? 500 : 400, align: 'left', color: cur ? P.ivory : past, alpha: a * (cur ? 1 : pastA), spacing: 0.04 });
  });
}
// 类型标签（左上角）
function tag(ctx, zh, en, c, a) { L.label(ctx, 80, 92, zh, en, { alpha: a, color: c, enColor: c, size: 34 }); }

module.exports = { K, L, FX, P, bg, rope, ropePts, along, bead, person, cut, cut2, big2, gather, sweep, checklist, tag };
