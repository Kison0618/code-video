'use strict';
// 《ESFJ》v3 代码效果层：在 egenv 的 3D 透视世界上，加「把知识点演出来」的效果。
//   核心比喻：ESFJ = 一个会往外送光的人。照顾 = 暖光流过去；在意评价 = 胸口那团光被别人的话改变。
//   flow     从 A 到 B 的光流（一串带拖尾的光点沿弧线流动，可以涨可以缩）
//   threads  从一个点向很多点牵出的光线（关系网），每根线有自己的亮度
//   layer    把一批东西画进离屏，再整层虚化 / 调色后贴回来（景深：前景、背景虚，焦点清楚）
//   wave     冲击波（圆环扩散 + 碎光）
//   heartLight 胸口的一团光：大小、颜色、稳定度随情绪变化
//   drift    漂浮在空间里的东西（抽象符号、记忆画框）按深度做视差
//   crowd    一大片人站在不同深度（远处融进雾，只剩剪影和一点光）
const K = require('../core');
const E = require('./egenv');
const MB = require('./mb');
const { W, H, clamp, lerp, mix, hash, glow, glowLine, rgba, smooth, prog, easeOut, easeInOut } = K;
const { WARM, CANDLE } = E;
const COLD = [120, 150, 210];

// ---------- 光流：A→B 的二次贝塞尔，n 颗光点，带拖尾。u 控制已经流到哪儿（0..1），rate 控制流速 ----------
function bez(A, B, C, u) { const v = 1 - u; return [v * v * A[0] + 2 * v * u * C[0] + u * u * B[0], v * v * A[1] + 2 * v * u * C[1] + u * u * B[1]]; }
function flow(ctx, A, B, t, o = {}) {
  const { lift = 0.3, n = 26, c = WARM, a = 1, reach = 1, rate = 0.55, r = 7, seed = 0, wobble = 14 } = o;
  if (a <= 0.01 || reach <= 0) return;
  const C = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - Math.hypot(B[0] - A[0], B[1] - A[1]) * lift];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // 一条很淡的光路
  const pts = []; for (let k = 0; k <= 30; k++) { const u = (k / 30) * reach; pts.push(bez(A, B, C, u)); }
  glowLine(ctx, pts, c, 0.18 * a, 2, 4);
  for (let i = 0; i < n; i++) {
    const ph = (i / n + t * rate + hash(seed + i) * 0.07) % 1; if (ph > reach) continue;
    const q = bez(A, B, C, ph), s = Math.sin(ph * Math.PI);
    const dx = Math.sin(t * 3 + i) * wobble * s, dy = Math.cos(t * 2.4 + i) * wobble * 0.5 * s;
    glow(ctx, q[0] + dx, q[1] + dy, r * (2.2 + hash(i + seed) * 1.5), c, 0.32 * a * (0.4 + 0.6 * s));
    // 拖尾
    const q2 = bez(A, B, C, Math.max(0, ph - 0.035)); glowLine(ctx, [[q2[0] + dx, q2[1] + dy], [q[0] + dx, q[1] + dy]], c, 0.5 * a * s, r * 0.5, r);
  }
  // 头部：流到的地方亮一点
  if (reach < 1) { const q = bez(A, B, C, reach); glow(ctx, q[0], q[1], r * 5, c, 0.45 * a); }
  ctx.restore();
}
// ---------- 光线网：从 O 牵到每个目标点，每根线 0..1 ----------
function threads(ctx, O, pts, t, o = {}) {
  const { c = WARM, a = 1, w = 1.6, pulse = true } = o;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  pts.forEach((P, i) => {
    const k = P[2] == null ? 1 : P[2]; if (k <= 0.01) return;
    const end = [lerp(O[0], P[0], k), lerp(O[1], P[1], k)];
    glowLine(ctx, [O, end], c, 0.35 * a, w, w * 4);
    if (pulse) { const u = (t * 0.6 + hash(i) ) % 1; if (u < k) glow(ctx, lerp(O[0], P[0], u), lerp(O[1], P[1], u), 10, c, 0.6 * a); }
    if (k >= 0.99) glow(ctx, P[0], P[1], 26, c, 0.35 * a);
  });
  ctx.restore();
}
// ---------- 景深：整层虚化 ----------
const LAY = new K.Canvas(W, H), LX = LAY.getContext('2d');
function layer(ctx, fn, o = {}) {
  const { blur = 0, a = 1, tint = null, tintA = 0 } = o;
  const M = ctx.getTransform();
  LX.setTransform(1, 0, 0, 1, 0, 0); LX.globalCompositeOperation = 'source-over'; LX.globalAlpha = 1; LX.filter = 'none'; LX.clearRect(0, 0, W, H);
  LX.setTransform(M); const res = fn(LX);
  if (tint && tintA > 0) { LX.setTransform(1, 0, 0, 1, 0, 0); LX.globalCompositeOperation = 'source-atop'; LX.fillStyle = rgba(tint, tintA); LX.fillRect(0, 0, W, H); LX.globalCompositeOperation = 'source-over'; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= a; if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`; ctx.drawImage(LAY, 0, 0); ctx.restore();
  return res;
}
// ---------- 冲击波 ----------
function wave(ctx, x, y, t, t0, o = {}) {
  const { c = CANDLE, R = 900, dur = 1.4, a = 1, rings = 3, sparks = 40 } = o;
  const u = (t - t0) / dur; if (u < 0 || u > 1.6) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < rings; k++) {
    const uu = u - k * 0.12; if (uu <= 0 || uu > 1) continue;
    const r = R * easeOut(uu), al = (1 - uu) * a;
    ctx.strokeStyle = rgba(c, 0.55 * al); ctx.lineWidth = 3 + 14 * (1 - uu); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = rgba([255, 250, 235], 0.4 * al); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  }
  for (let i = 0; i < sparks; i++) {
    const ang = hash(i * 3.3) * 6.283, sp = 0.5 + hash(i * 7.1) * 0.8, r = R * 0.9 * easeOut(clamp(u, 0, 1)) * sp, al = clamp(1 - u * 0.9, 0, 1) * a;
    glow(ctx, x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.85, 8 + hash(i) * 10, c, 0.5 * al);
  }
  glow(ctx, x, y, R * 0.35 * (1 - clamp(u, 0, 1)), [255, 245, 220], 0.5 * a * (1 - clamp(u, 0, 1)));
  ctx.restore();
}
// ---------- 胸口的光：size 0..2，hue 0 暖 1 冷灰，jit 抖动（不安），crack 裂纹（被批评） ----------
function heartLight(ctx, x, y, t, o = {}) {
  const { size = 1, cold = 0, jit = 0, crack = 0, a = 1, R = 120 } = o;
  if (a <= 0.01) return;
  const c = mix(WARM, [140, 150, 170], cold), j = jit * (Math.sin(t * 23) * 0.5 + Math.sin(t * 37) * 0.5);
  const r = R * size * (1 + j * 0.25);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r * 3.2, c, 0.18 * a); glow(ctx, x, y, r * 1.4, c, 0.42 * a); glow(ctx, x, y, r * 0.55, [255, 248, 230], 0.6 * a * (1 - cold * 0.6));
  // 慢慢绕着转的光粒
  for (let i = 0; i < 18; i++) { const ang = t * (0.6 + hash(i) * 0.8) + i * 0.35, rr = r * (0.9 + hash(i * 2) * 1.2); glow(ctx, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * 0.6, 6, c, 0.4 * a); }
  ctx.restore();
  if (crack > 0.01) { // 裂纹：从中心往外的暗线
    ctx.save(); ctx.strokeStyle = `rgba(20,16,24,${0.8 * crack * a})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { let px = x, py = y, ang = hash(i * 5.5) * 6.283; ctx.beginPath(); ctx.moveTo(px, py); for (let k = 0; k < 5; k++) { ang += (hash(i * 9 + k) - 0.5) * 1.2; const L = r * 0.45 * crack; px += Math.cos(ang) * L; py += Math.sin(ang) * L; ctx.lineTo(px, py); } ctx.stroke(); }
    ctx.restore();
  }
}
// ---------- 一大片人（不同深度，远处只剩剪影） ----------
const CROWD_KEYS = MB.ALL.filter(k => !/^esfj/.test(k));
function crowdPts(n, seed, o = {}) { const { x0 = -9, x1 = 9, z0 = 4, z1 = 40 } = o; return Array.from({ length: n }, (_, i) => ({ X: lerp(x0, x1, hash(seed + i * 1.7)), Z: lerp(z0, z1, Math.pow(hash(seed + i * 3.1), 0.8)), key: CROWD_KEYS[Math.floor(hash(seed + i * 5.3) * CROWD_KEYS.length)], ph: hash(seed + i * 7.9) * 6 })); }
function crowd(ctx, p, pts, t, o = {}) {
  const { warm = () => 0, m = 1.7, fog = [16, 12, 20], far = 40 } = o;
  const sorted = [...pts].sort((a, b) => b.Z - a.Z);
  const res = [];
  for (const q of sorted) {
    if (p.depth(q.Z) < 0.6) continue;
    const wv = warm(q), fd = clamp(p.depth(q.Z) / far, 0, 0.92);
    const r = E.folk3(ctx, p, q.key, q.X, q.Z, { m, flip: q.X > 0, gray: 0.8 * (1 - wv), dim: Math.max(fd * 0.9, 0.55 * (1 - wv)), shadow: 0.3, bob: wv * Math.abs(Math.sin(t * 3 + q.ph)) * p.px(q.Z, 0.02) });
    if (wv > 0.02) glow(ctx, r.chest[0], r.chest[1], p.px(q.Z, 0.7), WARM, 0.3 * wv * (1 - fd));
    res.push({ q, r });
  }
  return res;
}
// ---------- 漂浮在空间里的东西（按深度视差） ----------
function drift(ctx, p, items, t, fn) { const s = [...items].sort((a, b) => b.Z - a.Z); for (const it of s) { if (p.depth(it.Z) < 0.4) continue; const c = p(it.X + Math.sin(t * 0.3 + it.ph) * 0.15, it.Y + Math.sin(t * 0.5 + it.ph) * 0.1, it.Z); fn(ctx, it, c, p.px(it.Z, 1)); } }
// 一个抽象符号（公式/星图片段），冷色细线
function glyph(ctx, x, y, s, k, a, t) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgba(COLD, 0.9); ctx.lineWidth = Math.max(1, s * 0.012); ctx.globalCompositeOperation = 'lighter';
  const n = 3 + (k % 4); ctx.beginPath();
  for (let i = 0; i <= n; i++) { const ang = i / n * 6.283 + t * 0.2 + k; const rr = s * (0.12 + 0.1 * hash(k * 3 + i)); const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  for (let i = 0; i <= n; i++) { const ang = i / n * 6.283 + t * 0.2 + k, rr = s * (0.12 + 0.1 * hash(k * 3 + i)); glow(ctx, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, s * 0.03, COLD, 0.8); }
  ctx.font = `${Math.max(10, s * 0.12)}px SerifR`; ctx.fillStyle = rgba(COLD, 0.7); ctx.textAlign = 'center'; ctx.fillText(['∑', '∫', 'φ', 'λ', '∞', 'Ψ', '∂'][k % 7], x, y + s * 0.04);
  ctx.restore();
}
// 记忆画框：一张暖黄的老照片，里面是一桌人的剪影
function photo(ctx, x, y, s, a, warmth = 1, seed = 0) {
  if (a <= 0.01) return; const w = s * 0.7, h = s * 0.5;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate((hash(seed) - 0.5) * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-w / 2 + s * 0.02, -h / 2 + s * 0.03, w, h);
  ctx.fillStyle = rgba(mix([60, 52, 50], [238, 222, 190], warmth)); ctx.fillRect(-w / 2, -h / 2, w, h);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, rgba(mix([40, 40, 46], [210, 160, 100], warmth))); g.addColorStop(1, rgba(mix([30, 30, 36], [150, 96, 60], warmth)));
  ctx.fillStyle = g; ctx.fillRect(-w / 2 + s * 0.03, -h / 2 + s * 0.03, w - s * 0.06, h - s * 0.1);
  ctx.fillStyle = rgba(mix([20, 20, 24], [90, 54, 34], warmth));
  for (let i = 0; i < 5; i++) { const px = -w / 2 + s * 0.08 + i * (w - s * 0.16) / 4; ctx.beginPath(); ctx.arc(px, -h * 0.05, s * 0.035, 0, 7); ctx.fill(); ctx.fillRect(px - s * 0.035, -h * 0.02, s * 0.07, h * 0.25); }
  ctx.fillStyle = rgba(mix([30, 30, 30], [235, 220, 196], warmth)); ctx.fillRect(-w / 2 + s * 0.06, h * 0.18, w - s * 0.12, s * 0.03);
  ctx.restore();
  if (warmth > 0.3) glow(ctx, x, y, s * 0.5, WARM, 0.15 * warmth * a);
}
// 暗场地面：一片无限延伸的暗地板 + 远处地平线微光（给「一个人在空旷里」这类镜头）
function voidFloor(ctx, p, o = {}) {
  const { c = [22, 16, 22], horizon = [70, 50, 60], a = 1 } = o;
  // 先整屏铺地面色，再只在地平线以上画天空，俯拍时镜头底下也是地面
  const hy = p(0, 0, 400)[1];
  ctx.fillStyle = rgba(c); ctx.fillRect(0, 0, W, H);
  if (hy > 0) { const g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, 'rgb(8,6,10)'); g.addColorStop(1, rgba(horizon)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(H, hy)); }
  const fg = ctx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, rgba(mix(c, horizon, 0.5))); fg.addColorStop(0.25, rgba(c)); fg.addColorStop(1, rgba(mix(c, [0, 0, 0], 0.3)));
  ctx.fillStyle = fg; ctx.fillRect(0, Math.max(0, hy), W, H);
  for (let i = -20; i <= 20; i++) E.seg(ctx, p, [i * 2, 0, 0.6], [i * 2, 0, 120], [60, 44, 50], 0.18 * a, 1);
  for (let z = 2; z < 120; z *= 1.25) E.seg(ctx, p, [-60, 0, z], [60, 0, z], [60, 44, 50], 0.18 * a * clamp(1 - z / 120, 0, 1), 1);
}
module.exports = { COLD, flow, threads, layer, wave, heartLight, crowdPts, crowd, drift, glyph, photo, voidFloor, bez };
