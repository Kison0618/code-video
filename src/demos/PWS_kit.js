'use strict';
// 《INFP》v3 整改：场景公用工具（只给 PWG*/PWS_* 用，不改 pwk/pwu）
//   bake      把一层静态画面预渲成位图（山、城市灯海、云……每帧只贴图）
//   cam       分层视差相机：cam(ctx, C, p) —— p=0 无穷远，p=1 主体平面，p>1 前景
//   lit       人物受光：画完以后按光源方向叠一层明暗（让低多边形人物融进场景）
//   neon      霓虹描线逐笔「长出来」（参考片《INFJ·提倡者》的手法，只在点题的地方用）
//   group     整组淡入淡出（离屏整体透明度，不会层层透底）
const K = require('../core');
const X = require('./pwk');
const { Image } = require('skia-canvas');
const { W, H, clamp, lerp, prog, smooth, easeOut, easeInOut, rgba, mix, mulberry32, hash } = K;
// 光晕：core.glow 的贴图是 Canvas（skia-canvas 每贴一次都要把指令重放一遍，一个小光点 0.3ms），这里换成位图贴图，快 20 倍；
//   颜色先量化（每通道 12 一档），渐变色不会每帧多出一张贴图
const qc = v => Math.min(255, Math.round(v / 12) * 12), GS = new Map();
function glow(ctx, x, y, r, c, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  const key = (qc(c[0]) << 16) | (qc(c[1]) << 8) | qc(c[2]); let img = GS.get(key);
  if (!img) { img = new Image(); img.src = K.glowSprite([qc(c[0]), qc(c[1]), qc(c[2])]).toBufferSync('png'); GS.set(key, img); }
  const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a) * ga; ctx.drawImage(img, x - r, y - r, 2 * r, 2 * r);
  ctx.globalCompositeOperation = op; ctx.globalAlpha = ga;
}

function bake(w, h, fn) {
  const c = new K.Canvas(w, h); fn(c.getContext('2d'));
  const img = new Image(); img.src = c.toBufferSync('png'); return img;
}
// 懒加载：第一次用到才渲（预览只渲几帧时不必把所有场景都预渲一遍）
const lazy = fn => { let v; return () => (v === undefined ? (v = fn()) : v); };

// ---------- 相机 ----------
// C = { x, y, z, ax, ay }：世界坐标 (x,y) 偏移、缩放 z、缩放锚点 (ax,ay)（屏幕坐标，默认画面中心偏下）
function cam(ctx, C, p = 1) {
  const z = Math.max(0.05, 1 + ((C.z || 1) - 1) * p), ax = C.ax == null ? W / 2 : C.ax, ay = C.ay == null ? 1000 : C.ay;
  ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-ax - (C.x || 0) * p, -ay - (C.y || 0) * p);
}
const w2s = (C, x, y, p = 1) => { const z = 1 + ((C.z || 1) - 1) * p, ax = C.ax == null ? W / 2 : C.ax, ay = C.ay == null ? 1000 : C.ay; return [ax + (x - ax - (C.x || 0) * p) * z, ay + (y - ay - (C.y || 0) * p) * z]; };
// 关键帧：keys = [[t, v], ...]（v 可以是数或数组），段内 easeInOut
function kf(t, keys, ease = easeInOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const u = (keys[i][2] || ease)((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])), a = keys[i - 1][1], b = keys[i][1];
    return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], u)) : lerp(a, b, u);
  }
  return keys[keys.length - 1][1];
}
const camKF = (t, keys) => { const v = kf(t, keys.map(k => [k[0], [k[1].x || 0, k[1].y || 0, k[1].z || 1], k[2]])); return { x: v[0], y: v[1], z: v[2], ax: keys[0][1].ax, ay: keys[0][1].ay }; };

// ---------- 整组透明 / 离屏层 ----------
const POOL = []; let used = 0;
function layer() { if (used >= POOL.length) POOL.push(new K.Canvas(W, H)); const c = POOL[used++].getContext('2d'); c.reset(); return c; }
function freeLayers() { used = 0; }
function group(ctx, al, fn) {
  if (al >= 0.999) { fn(ctx); return; }
  if (al <= 0.003) return;
  const c = layer(); fn(c);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = al; ctx.drawImage(c.canvas, 0, 0); ctx.restore();
}
// 画到离屏层再整体贴回（可带滤镜 / 合成方式）；fn 里用与外面相同的变换
function comp(ctx, fn, o = {}) {
  const c = layer(); c.setTransform(ctx.getTransform()); fn(c);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.filter) ctx.filter = o.filter; if (o.alpha != null) ctx.globalAlpha *= o.alpha; if (o.op) ctx.globalCompositeOperation = o.op;
  ctx.drawImage(c.canvas, 0, 0); ctx.restore();
}
// 人物受光：draw(c) 画人物；之后只在人物像素上叠明暗
//   o.light [x,y] 光源屏幕外的世界坐标、o.at [x,y] 人物中心、o.r 人物半径、o.warm 亮面颜色、o.cool 暗面颜色、o.k 强度、o.tint 整体染色 [c, a]
function lit(ctx, draw, o = {}) {
  const { light = [900, 200], at = [540, 1000], r = 320, warm = [255, 236, 200], cool = [16, 22, 60], k = 1, tint = null, alpha = 1 } = o;
  const c = layer(); c.setTransform(ctx.getTransform());
  const ret = draw(c);
  c.globalCompositeOperation = 'source-atop';
  const dx = light[0] - at[0], dy = light[1] - at[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const g = c.createLinearGradient(at[0] + ux * r, at[1] + uy * r, at[0] - ux * r, at[1] - uy * r);
  g.addColorStop(0, rgba(warm, 0.30 * k)); g.addColorStop(0.42, rgba(warm, 0)); g.addColorStop(0.58, rgba(cool, 0.1 * k)); g.addColorStop(1, rgba(cool, 0.62 * k));
  c.fillStyle = g; c.fillRect(at[0] - r * 3, at[1] - r * 3, r * 6, r * 6);
  if (tint) { c.fillStyle = rgba(tint[0], tint[1]); c.fillRect(at[0] - r * 3, at[1] - r * 3, r * 6, r * 6); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha; ctx.drawImage(c.canvas, 0, 0); ctx.restore();
  return ret;
}

// ---------- 画面元素 ----------
function vgrad(ctx, stops, y0, y1, x0 = -600, x1 = W + 600) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, c, a]) => g.addColorStop(p, rgba(c, a == null ? 1 : a)));
  ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
function rgrad(ctx, x, y, r, stops, sy = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); stops.forEach(([p, c, a]) => g.addColorStop(p, rgba(c, a == null ? 1 : a)));
  ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
}
const add = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
function poly(ctx, pts, fill) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
// 柔边粗环（心跳、涟漪）：有宽度有衰减，不是细线圈
function ring(ctx, x, y, r, w, c, a, sy = 1) {
  if (a <= 0.003 || r <= 1) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, sy);
  const r0 = Math.max(0, r - w), r1 = r + w, g = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
  g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r1, 0, 6.2832); ctx.arc(0, 0, r0, 0, 6.2832, true); ctx.fill(); ctx.restore();
}
// 月亮：大而柔的主光源，缓慢呼吸（周期 9 秒，幅度很小）
function moon(ctx, x, y, r, t, c = [246, 240, 222], a = 1) {
  const br = 1 + 0.04 * Math.sin(t * 0.7);
  add(ctx, () => { glow(ctx, x, y, r * 9 * br, mix(c, [120, 140, 255], 0.5), 0.2 * a); glow(ctx, x, y, r * 4.2 * br, c, 0.3 * a); glow(ctx, x, y, r * 2.1, c, 0.45 * a); });
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.7))); g.addColorStop(0.75, rgba(c)); g.addColorStop(1, rgba(mix(c, [150, 150, 190], 0.45)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  ctx.fillStyle = rgba(mix(c, [120, 120, 160], 0.6), 0.22);
  for (const [dx, dy, rr] of [[-0.3, -0.1, 0.22], [0.25, 0.3, 0.3], [0.1, -0.45, 0.14], [-0.45, 0.4, 0.12]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}
// 山脊线：返回点列（低多边形的折线山）
function ridge(seed, x0, x1, base, amp, step = 90, rough = 1) {
  const r = mulberry32(seed), pts = [];
  for (let x = x0; x <= x1 + step; x += step * (0.6 + r() * 0.8)) {
    const n = K.noise1(x * 0.0021 * rough, seed) * 0.7 + K.noise1(x * 0.0063 * rough, seed + 9) * 0.3;
    pts.push([x, base - amp * (0.5 + 0.5 * n) - r() * amp * 0.12]);
  }
  return pts;
}
// 低多边形山体：山脊折线 + 每段向下的明暗切面（受光面/背光面）
function mountain(ctx, pts, bottom, cLight, cDark, o = {}) {
  const { lightDir = 1, facet = 0.5 } = o;
  poly(ctx, [...pts, [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]], rgba(mix(cLight, cDark, 0.5)));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], up = (b[1] < a[1] ? 1 : -1) * lightDir, mx = (a[0] + b[0]) / 2, h = bottom - Math.min(a[1], b[1]);
    const g = ctx.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.min(a[1], b[1]) + h * 0.8);
    const c = up > 0 ? cLight : cDark;
    g.addColorStop(0, rgba(c, facet)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(mx + (hash(i * 3.3 + a[0]) - 0.5) * 160, bottom); ctx.closePath(); ctx.fill();
  }
}
// 云带：一组压扁的柔光团（预渲时调用）
function clouds(ctx, seed, box, n, c, a, rr = [160, 420]) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), R = rr[0] + r() * (rr[1] - rr[0]);
    for (let k = 0; k < 5; k++) rgrad(ctx, x + (r() - 0.5) * R * 1.6, y + (r() - 0.5) * R * 0.2, R * (0.5 + r() * 0.5), [[0, c, a * (0.5 + r() * 0.5)], [1, c, 0]], 0.22 + r() * 0.12);
  }
}
// 星空（预渲）：稀疏、大小不一，不闪
function stars(ctx, seed, box, n, a = 1) {
  const r = mulberry32(seed);
  add(ctx, () => { for (let i = 0; i < n; i++) { const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * r() * (box[3] - box[1]), s = r(); glow(ctx, x, y, 2 + s * s * 9, s > 0.8 ? [255, 236, 210] : [210, 222, 255], a * (0.25 + 0.6 * r())); } });
}
// 霓虹描线：pts 画到 f（0-1），外圈柔光 + 亮芯；w 是亮芯宽度（主体用 ≥5）
function neon(ctx, pts, f, c, a = 1, w = 5, close = false, white = 0.55) {
  if (a <= 0.003 || f <= 0.001) return null;
  const P = f >= 1 ? pts : K.partial(pts, f); if (P.length < 2) return null;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close && f >= 1) ctx.closePath();
  for (const [lw, la] of [[w * 7, 0.05], [w * 3.2, 0.12], [w * 1.6, 0.34], [w * 0.8, 0.95]]) { ctx.strokeStyle = rgba(la > 0.9 ? mix(c, [255, 255, 255], white) : c, clamp(la * a)); ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
  const e = P[P.length - 1];
  if (f < 1) add(ctx, () => { glow(ctx, e[0], e[1], w * 9, c, 0.7 * a); glow(ctx, e[0], e[1], w * 3, [255, 255, 255], 0.9 * a); });
  return e;
}
// 带宽度的光绸（直觉的线、风、极光边）：中心线 pts，宽度按 wf(s) 变化
function ribbon(ctx, pts, wf, c, a, f = 1) {
  if (a <= 0.003 || pts.length < 3) return;
  const n = Math.max(2, Math.floor(pts.length * clamp(f))), L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    let tx = q[0] - o[0], ty = q[1] - o[1]; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    const w = wf(i / (pts.length - 1)) / 2; L.push([p[0] - ty * w, p[1] + tx * w]); R.push([p[0] + ty * w, p[1] - tx * w]);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  poly(ctx, [...L, ...R.reverse()]);
  ctx.filter = 'blur(14px)'; ctx.fillStyle = rgba(c, 0.5 * a); ctx.fill(); ctx.filter = 'blur(3px)'; ctx.fillStyle = rgba(mix(c, [255, 255, 255], 0.5), 0.75 * a); ctx.fill(); ctx.filter = 'none';
  ctx.restore();
}
// 风里的叶子/花瓣：确定性（位置只由 t 决定），有大小有翻转，不是光点
function petals(ctx, t, o = {}) {
  const { n = 26, seed = 1, box = [-100, 200, W + 100, 1500], dir = [1, 0.25], speed = 260, c = [255, 190, 200], c2 = [255, 232, 220], a = 1, size = 16, gust = 1 } = o;
  if (a <= 0.003) return;
  const bw = box[2] - box[0], bh = box[3] - box[1];
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 7.13 + seed), h2 = hash(i * 3.77 + seed * 2.1), h3 = hash(i * 9.31 + seed);
    const sp = speed * (0.6 + h3 * 0.8) * gust, tt = t * sp;
    const x = box[0] + ((h1 * bw + tt * dir[0]) % bw + bw) % bw, y = box[1] + ((h2 * bh + tt * dir[1] + Math.sin(t * 1.3 + i) * 40) % bh + bh) % bh;
    const edge = Math.min(1, Math.min(x - box[0], box[2] - x) / 120), s = size * (0.5 + h3 * 1.1), rot = t * (1 + h1 * 3) + i, flip = Math.cos(t * (2 + h2 * 3) + i * 2);
    ctx.globalAlpha = a * edge * (0.5 + 0.5 * h2);
    ctx.fillStyle = rgba(mix(c, c2, h1));
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.25 + 0.75 * Math.abs(flip));
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.8, s, 0); ctx.quadraticCurveTo(0, s * 0.8, -s, 0); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
// 雨：斜雨丝（按远近三层，粗细不同，不用滤镜）
function rain(ctx, t, o = {}) {
  const { box = [-100, -100, W + 100, H], a = 1, c = [190, 205, 240], n = 90, slant = -0.22, seed = 0 } = o;
  if (a <= 0.003) return;
  const bw = box[2] - box[0], bh = box[3] - box[1];
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let L = 0; L < 3; L++) {
    ctx.beginPath(); const len = 46 + L * 34, sp = 1500 + L * 700;
    for (let i = 0; i < n / 3; i++) {
      const h1 = hash(i * 5.1 + L * 31 + seed), h2 = hash(i * 8.7 + L * 17 + seed);
      const y = box[1] + ((h2 * bh + t * sp * (0.8 + h1 * 0.4)) % bh), x = box[0] + ((h1 * bw + (y - box[1]) * slant) % bw + bw) % bw;
      ctx.moveTo(x, y); ctx.lineTo(x + len * slant, y + len);
    }
    ctx.strokeStyle = rgba(c, a * (0.10 + L * 0.07)); ctx.lineWidth = 1.6 + L * 1.3; ctx.stroke();
  }
  ctx.restore();
}
// 大字：厚重的衬线字 + 柔光（点题的词用，一屏最多一处）
function title(ctx, str, x, y, o = {}) {
  const { size = 120, c = X.GOLD, a = 1, weight = 500, spacing = 0.12, family = 'Serif', glowA = 0.5 } = o;
  if (a <= 0.003) return;
  ctx.save(); ctx.shadowColor = rgba(c, glowA * a); ctx.shadowBlur = size * 0.45;
  K.text(ctx, str, x, y, { size, weight, spacing, color: mix(c, [255, 255, 255], 0.35), alpha: a, family });
  ctx.restore();
}
// 关掉 pwk.front 的满屏随机光斑（老板：不要满屏随机光点）：只在登记过的时段里不画，别的组不受影响
const MUTE = [];
if (!X.front.__pws) { const f0 = X.front; X.front = (ctx, t, a) => { for (const [a0, b0] of MUTE) if (t >= a0 && t <= b0) return; f0(ctx, t, a); }; X.front.__pws = true; }
const muteFront = (a, b) => MUTE.push([a, b]);

// 一组里的分幕：list = [{ a, fi, draw(ctx, t) }]，后一幕按 fi 秒淡入盖住前一幕
function seq(ctx, t, list) {
  let st = null;
  for (let i = 0; i < list.length; i++) {
    const s = list[i], nx = list[i + 1];
    if (t < s.a || (nx && t > nx.a + (nx.fi || 0.4))) continue;
    group(ctx, s.fi ? smooth(prog(t, s.a, s.a + s.fi)) : 1, c => { st = s.draw(c, t) || st; });
  }
  return st;
}
module.exports = { glow, seq, bake, lazy, cam, w2s, kf, camKF, layer, freeLayers, group, comp, lit, vgrad, rgrad, add, poly, ring, moon, ridge, mountain, clouds, stars, neon, ribbon, petals, rain, title, muteFront };
