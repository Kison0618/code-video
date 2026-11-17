'use strict';
// 《ESFJ》霓虹线稿（参考片《INFJ·提倡者》《INFP·调停者》的手法：暗底上发光的线一笔笔长出来）
//   只用在「想出来的东西」上 —— 片名、心里的状态、关系、图纸 —— 和写实场景穿插，让全片有变化。
//   wire     把低多边形人物（ES.hero / MB.person）变成发光线稿：每块面只描边，内部用深色填（遮住背后的线，干净），可「描出来」
//   line     折线/曲线按长度逐渐长出来（带辉光）
//   orbit    轨道环：主环描出来 + 刻度 + 慢慢转
//   rays     放射光束（打起精神、点亮）
//   floor    地平线 + 倒影光带
//   icon     线稿小图标：杯子（带热气）、碗、外套、房子、心、人、山、手机
//   tags     「E 外向 · S 实感 · F 情感 · J 判断」小牌
const K = require('../core');
const S = require('./ESS_kit');
const { W, H, clamp, lerp, smooth, easeOut, easeInOut, rgba, mix } = K;
const TY = require('./ESS_type');
const glow = S.glow;
const TEAL = [110, 236, 214], GOLD = [255, 204, 120], ROSE = [255, 120, 130], ICE = [150, 190, 255];

// ---------- 底 ----------
function bg(ctx, t, o = {}) {
  const { c0 = [4, 14, 20], c1 = [10, 30, 40], a = 1, haze = TEAL } = o;
  ctx.save(); ctx.globalAlpha *= a; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, rgba(c1)); g.addColorStop(1, rgba(c0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 两团缓慢漂移的雾光（不是光点）
  S.add(ctx, () => { glow(ctx, W * 0.3 + Math.sin(t * 0.13) * 120, H * 0.35, 700, haze, 0.06); glow(ctx, W * 0.75 + Math.cos(t * 0.11) * 120, H * 0.62, 760, haze, 0.05); });
  // 淡淡的透视网格地面
  ctx.strokeStyle = rgba(haze, 0.07); ctx.lineWidth = 2;
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 40, 1250); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
  for (let k = 0; k < 6; k++) { const y = 1250 + Math.pow(k / 6, 1.7) * 700; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}
function floor(ctx, y, c = TEAL, a = 1, x0 = 80, x1 = W - 80) {
  ctx.save(); ctx.globalAlpha *= a;
  S.add(ctx, () => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, 0.8)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x0, y - 1.5, x1 - x0, 3); glow(ctx, (x0 + x1) / 2, y, (x1 - x0) * 0.4, c, 0.12); });
  ctx.restore();
}

// ---------- 发光描边的通用合成：fn(c) 在离屏层上画线，之后叠两层辉光 + 本体 ----------
// 批处理：batch(ctx, fn) 期间所有 lit() 都画进同一张离屏层，最后只做一次辉光（半分辨率模糊），比每根线各模糊一次快一个数量级
let B = null; const HB1 = new K.Canvas(W / 2, H / 2), HB2 = new K.Canvas(W / 2, H / 2);
function composite(ctx, cv, o = {}) {
  const { a = 1, glowA = 0.9, blur = 9 } = o;
  const h1 = HB1.getContext('2d'), h2 = HB2.getContext('2d'); h1.reset(); h2.reset();
  h1.filter = `blur(${blur}px)`; h1.drawImage(cv, 0, 0, W / 2, H / 2); h2.filter = `blur(${(blur * 0.25).toFixed(1)}px)`; h2.drawImage(cv, 0, 0, W / 2, H / 2);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a * glowA * 0.85; ctx.drawImage(HB1, 0, 0, W, H); ctx.globalAlpha = a * glowA * 0.9; ctx.drawImage(HB2, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a; ctx.drawImage(cv, 0, 0); ctx.restore();
}
function batch(ctx, fn, o = {}) { const c = S.layer(); const prev = B; B = c; try { fn(); } finally { B = prev; } composite(ctx, c.canvas, o); }
function lit(ctx, fn, o = {}) {
  const { a = 1 } = o;
  if (a <= 0.003) return;
  if (B) { B.save(); B.setTransform(ctx.getTransform()); B.globalAlpha = a; fn(B); B.restore(); return; }
  const c = S.layer(); c.setTransform(ctx.getTransform()); fn(c);
  composite(ctx, c.canvas, o);
}
// 人物线稿：o.c 线色、o.w 线宽、o.p 描出来的进度（0-1）、o.fill 深色填充（遮挡背后的线）、o.a
function wire(ctx, draw, o = {}) {
  const { c = TEAL, w = 3, p = 1, fill = [6, 18, 24], fillA = 0.92, a = 1, glowA = 0.9 } = o;
  if (a <= 0.003 || p <= 0.001) return null;
  let ret = null;
  lit(ctx, l => {
    const st = l.stroke.bind(l), fl = l.fill.bind(l);
    l.lineJoin = 'round'; l.lineCap = 'round'; l.lineWidth = w;
    if (p < 1) l.setLineDash([lerp(0, 420, p), 4000]);
    const baseA = l.globalAlpha;
    l.fill = function (a1) { const pa = a1 && typeof a1 === 'object' ? a1 : null; const ga = l.globalAlpha; l.globalAlpha = baseA; l.fillStyle = rgba(fill, fillA); pa ? fl(pa) : fl(); l.strokeStyle = rgba(c); pa ? st(pa) : st(); l.globalAlpha = ga; };
    ret = draw(l);
    delete l.fill; l.setLineDash([]);
  }, { a, glowA });
  return ret;
}
// 折线逐步长出来；pts=[[x,y]...]，p 0-1；o.close
function line(ctx, pts, p, c = TEAL, w = 4, a = 1, o = {}) {
  if (p <= 0.001 || a <= 0.003 || pts.length < 2) return;
  const segs = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
  const want = L * clamp(p);
  lit(ctx, l => { l.strokeStyle = rgba(c); l.lineWidth = w; l.lineCap = 'round'; l.lineJoin = 'round'; if (o.dash) l.setLineDash(o.dash); l.beginPath(); l.moveTo(pts[0][0], pts[0][1]); let acc = 0, end = pts[0];
    for (let i = 1; i < pts.length; i++) { if (acc + segs[i - 1] <= want) { l.lineTo(pts[i][0], pts[i][1]); acc += segs[i - 1]; end = pts[i]; } else { const u = (want - acc) / segs[i - 1]; end = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; l.lineTo(end[0], end[1]); break; } }
    l.stroke(); if (o.head !== false && p < 1) { l.fillStyle = rgba(mix(c, [255, 255, 255], 0.6)); l.beginPath(); l.arc(end[0], end[1], w * 1.4, 0, 6.2832); l.fill(); } }, { a, glowA: o.glowA == null ? 0.9 : o.glowA });
}
// 贝塞尔/任意曲线采样成折线
function sample(fn, n = 60) { const out = []; for (let i = 0; i <= n; i++) out.push(fn(i / n)); return out; }
const arcPts = (x, y, r, a0, a1, n = 90, sy = 1) => sample(u => [x + Math.cos(lerp(a0, a1, u)) * r, y + Math.sin(lerp(a0, a1, u)) * r * sy], n);
// 轨道环
function orbit(ctx, x, y, r, p, t, c = TEAL, a = 1, o = {}) {
  if (p <= 0.001 || a <= 0.003) return;
  const { ticks = 36, spin = 0.08, w = 3, dash = null, sy = 1 } = o;
  line(ctx, arcPts(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, 120, sy), 1, c, w, a, { head: false, dash, glowA: 0.7 });
  const tk = smooth(clamp((p - 0.5) * 2));
  if (tk > 0.01) lit(ctx, l => { l.strokeStyle = rgba(c, 0.8); l.lineWidth = 2; for (let k = 0; k < ticks; k++) { const an = k / ticks * Math.PI * 2 + t * spin, len = k % 3 ? 10 : 22; if (k / ticks > tk) continue; l.beginPath(); l.moveTo(x + Math.cos(an) * (r + 10), y + Math.sin(an) * (r + 10) * sy); l.lineTo(x + Math.cos(an) * (r + 10 + len), y + Math.sin(an) * (r + 10 + len) * sy); l.stroke(); } }, { a: a * 0.8, glowA: 0.5 });
}
// 放射光束
function rays(ctx, x, y, p, c = GOLD, a = 1, n = 18, len = 900) {
  if (p <= 0.001 || a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) { const an = k / n * Math.PI * 2 + 0.2, l0 = 120 + 60 * p, l1 = l0 + len * easeOut(p) * (0.6 + 0.4 * ((k * 7) % 5) / 4), wd = 0.035;
    const g = ctx.createLinearGradient(x + Math.cos(an) * l0, y + Math.sin(an) * l0, x + Math.cos(an) * l1, y + Math.sin(an) * l1); g.addColorStop(0, rgba(c, 0.35 * a * (1 - p * 0.5))); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + Math.cos(an - wd) * l0, y + Math.sin(an - wd) * l0); ctx.lineTo(x + Math.cos(an - wd * 2.2) * l1, y + Math.sin(an - wd * 2.2) * l1); ctx.lineTo(x + Math.cos(an + wd * 2.2) * l1, y + Math.sin(an + wd * 2.2) * l1); ctx.lineTo(x + Math.cos(an + wd) * l0, y + Math.sin(an + wd) * l0); ctx.fill(); }
  ctx.restore();
}
// ---------- 图标（中心 (x,y)，尺寸 s≈1 时约 120px）；返回折线列表，交给 line 逐笔描 ----------
const ICON = {
  mug: (x, y, s) => [[[x - 50 * s, y - 50 * s], [x - 44 * s, y + 50 * s], [x + 44 * s, y + 50 * s], [x + 50 * s, y - 50 * s]], sample(u => [x + 50 * s + Math.sin(u * Math.PI) * 34 * s, y - 30 * s + u * 50 * s], 20), [[x - 70 * s, y + 60 * s], [x + 70 * s, y + 60 * s]]],
  steam: (x, y, s, t) => [-1, 0, 1].map(k => sample(u => [x + k * 26 * s + Math.sin(u * 6 + t * 2 + k) * 10 * s, y - 70 * s - u * 120 * s], 24)),
  bowl: (x, y, s) => [sample(u => [x + Math.cos(Math.PI * u) * 70 * s, y + Math.sin(Math.PI * u) * 56 * s], 30), [[x - 76 * s, y], [x + 76 * s, y]], [[x - 26 * s, y + 56 * s], [x + 26 * s, y + 56 * s]], sample(u => [x - 40 * s + u * 80 * s, y - 14 * s - Math.sin(u * Math.PI) * 26 * s], 16)],
  coat: (x, y, s) => [[[x - 22 * s, y - 70 * s], [x - 60 * s, y - 50 * s], [x - 80 * s, y + 30 * s], [x - 56 * s, y + 34 * s], [x - 50 * s, y - 10 * s], [x - 50 * s, y + 76 * s], [x + 50 * s, y + 76 * s], [x + 50 * s, y - 10 * s], [x + 56 * s, y + 34 * s], [x + 80 * s, y + 30 * s], [x + 60 * s, y - 50 * s], [x + 22 * s, y - 70 * s], [x, y - 30 * s], [x - 22 * s, y - 70 * s]], [[x, y - 30 * s], [x, y + 76 * s]]],
  house: (x, y, s) => [[[x - 80 * s, y - 10 * s], [x, y - 86 * s], [x + 80 * s, y - 10 * s]], [[x - 62 * s, y - 24 * s], [x - 62 * s, y + 70 * s], [x + 62 * s, y + 70 * s], [x + 62 * s, y - 24 * s]], [[x - 18 * s, y + 70 * s], [x - 18 * s, y + 20 * s], [x + 18 * s, y + 20 * s], [x + 18 * s, y + 70 * s]]],
  heart: (x, y, s) => [sample(u => { const a = u * Math.PI * 2; return [x + 16 * Math.pow(Math.sin(a), 3) * 5 * s, y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 5 * s]; }, 80)],
  person: (x, y, s) => [arcPts(x, y - 46 * s, 24 * s, 0, Math.PI * 2, 30), sample(u => [x + Math.cos(Math.PI + u * Math.PI) * 50 * s, y + 46 * s + Math.sin(Math.PI + u * Math.PI) * 50 * s], 24)],
};
function icon(ctx, kind, x, y, s, p, c = TEAL, a = 1, t = 0, w = 4) {
  const parts = ICON[kind](x, y, s, t), n = parts.length;
  parts.forEach((pts, i) => line(ctx, pts, clamp(p * n - i), c, w, a, { head: false }));
}
// 维度小牌：「E 外向」……逐个滑入
function tags(ctx, items, y, p, c = TEAL, a = 1) {
  const gap = 16, size = 40, wid = items.map(([k, v]) => K.measure(ctx, v, { size, family: 'ESSans', weight: 700 }) + 96), tot = wid.reduce((s2, v) => s2 + v, 0) + gap * (items.length - 1);
  let x = W / 2 - tot / 2;
  items.forEach(([k, v], i) => { const u = smooth(clamp(p * items.length - i)); if (u <= 0) { x += wid[i] + gap; return; }
    ctx.save(); ctx.globalAlpha *= a * u; ctx.translate(0, (1 - u) * 20);
    ctx.strokeStyle = rgba(c, 0.7); ctx.lineWidth = 2; ctx.fillStyle = 'rgba(4,14,20,0.6)'; ctx.beginPath(); ctx.roundRect(x, y - 36, wid[i], 72, 36); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(c, 0.9); ctx.beginPath(); ctx.roundRect(x + 9, y - 27, 54, 54, 27); ctx.fill();
    K.text(ctx, k, x + 36, y + 13, { size: 38, family: 'Latin', weight: 600, color: [6, 20, 26] });
    K.text(ctx, v, x + 74, y + 14, { size, family: 'ESSans', weight: 700, color: mix(c, [255, 255, 255], 0.55), align: 'left' });
    ctx.restore(); x += wid[i] + gap; });
}
module.exports = { batch, TEAL, GOLD, ROSE, ICE, bg, floor, lit, wire, line, sample, arcPts, orbit, rays, icon, ICON, tags };
