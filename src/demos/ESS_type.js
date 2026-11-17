'use strict';
// 《ESFJ》v9 画面里的字（2026-11-17 反馈第 3 条：字太小、颜色难看、没有效果）
//   规矩：画面里出现的字一律走这里 —— 最小 40px，粗字重（思源宋 Heavy / 思源黑 Bold），有底（牌子、气泡、卡片）或有光（金箔、霓虹）；
//   出场都有动画：逐字升起 + 一道扫光（foil）、牌子翻亮（plaque）、气泡弹出（bubble）、标签滑入（tag）。
const path = require('path');
const { FontLibrary } = require('skia-canvas');
const K = require('../core');
const { clamp, lerp, smooth, easeOut, rgba, mix } = K;
const ROOT = path.join(__dirname, '..', '..');
FontLibrary.use('ESHeavy', [path.join(ROOT, 'fonts', 'SourceHanSerifSC-Heavy.ttf')]);
const NS = path.join(ROOT, 'node_modules', '@expo-google-fonts', 'noto-sans-sc');
FontLibrary.use('ESSans', ['500Medium', '700Bold', '900Black'].map(w => path.join(NS, w, `NotoSansSC_${w}.ttf`)));

const back = u => { const s = 1.6; u = clamp(u); return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
const fontOf = o => `${o.weight || 900} ${o.size}px ${o.family || 'ESHeavy'}`;
function layout(ctx, str, o) {
  ctx.save(); ctx.font = fontOf(o);
  const ch = [...str], ws = ch.map(c => ctx.measureText(c).width), sp = (o.spacing || 0) * o.size;
  const total = ws.reduce((s, v) => s + v, 0) + sp * Math.max(0, ch.length - 1); ctx.restore();
  let x = o.align === 'left' ? 0 : o.align === 'right' ? -total : -total / 2; const xs = [];
  for (let i = 0; i < ch.length; i++) { xs.push(x); x += ws[i] + sp; }
  return { ch, ws, xs, total };
}
const CV = new Map();
function scratch(w, h) { const k = `${Math.ceil(w / 64)}x${Math.ceil(h / 64)}`; let c = CV.get(k); if (!c) { c = new K.Canvas(Math.ceil(w / 64) * 64, Math.ceil(h / 64) * 64); CV.set(k, c); } const x = c.getContext('2d'); x.reset(); return x; }

// 金箔大字：逐字从下面升起、带模糊散开 → 落定；落定后一道斜向扫光走过；字后面有柔光，底下有投影
//   o: size, family, weight, spacing, align, p(0-1 出场进度), sweep(0-1 扫光位置，<0 不扫), top/bot(渐变色), glow(颜色), glowA, shadow, a
const GOLD_T = [255, 230, 170], GOLD_B = [200, 126, 50];
function foil(ctx, str, x, y, o = {}) {
  const { size = 120, p = 1, sweep = -1, a = 1, top = GOLD_T, bot = GOLD_B, glow = [255, 190, 110], glowA = 0.55, shadow = 0.55, stroke = null } = o;
  if (a <= 0.003 || p <= 0.001) return 0;
  const L = layout(ctx, str, { ...o, size }), pad = size * 0.6, w = L.total + pad * 2, h = size * 1.9;
  const c = scratch(w, h); c.font = fontOf({ ...o, size }); c.textBaseline = 'alphabetic';
  const ox = (o.align === 'left' ? 0 : o.align === 'right' ? L.total : L.total / 2) + pad, oy = size * 1.25;
  const g = c.createLinearGradient(0, oy - size * 0.9, 0, oy + size * 0.1); g.addColorStop(0, rgba(top)); g.addColorStop(0.55, rgba(mix(top, bot, 0.6))); g.addColorStop(1, rgba(bot));
  const n = L.ch.length, span = 0.55;
  for (let i = 0; i < n; i++) {
    const u = clamp((p - (n > 1 ? i / (n - 1) : 0) * (1 - span)) / span), e = easeOut(u); if (u <= 0) continue;
    c.save(); c.globalAlpha = smooth(u); const cx = ox + L.xs[i] + L.ws[i] / 2;
    c.translate(cx, oy + (1 - e) * size * 0.45); const sc = lerp(1.18, 1, e); c.scale(sc, sc);
    if (u < 1) c.filter = `blur(${((1 - e) * size * 0.08).toFixed(1)}px)`;
    if (stroke) { c.lineWidth = size * 0.06; c.strokeStyle = rgba(stroke); c.lineJoin = 'round'; c.strokeText(L.ch[i], -L.ws[i] / 2, 0); }
    c.fillStyle = g; c.fillText(L.ch[i], -L.ws[i] / 2, 0); c.restore();
  }
  if (sweep >= 0 && sweep <= 1) { // 扫光：只在字上
    c.save(); c.globalCompositeOperation = 'source-atop'; const sx = lerp(-w * 0.3, w * 1.3, sweep);
    const sg = c.createLinearGradient(sx - size * 0.8, 0, sx + size * 0.8, size * 0.6); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,252,240,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.fillRect(0, 0, w, h); c.restore();
  }
  const dx = x - ox, dy = y - oy;
  ctx.save(); ctx.globalAlpha *= a;
  if (shadow > 0) { ctx.save(); ctx.globalAlpha *= shadow; ctx.filter = `brightness(0) blur(${(size * 0.09).toFixed(1)}px)`; ctx.drawImage(c.canvas, dx + size * 0.03, dy + size * 0.08); ctx.restore(); }
  if (glowA > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= glowA * 0.6; ctx.filter = `blur(${(size * 0.22).toFixed(1)}px)`; ctx.drawImage(c.canvas, dx, dy); ctx.restore(); }
  ctx.drawImage(c.canvas, dx, dy);
  ctx.restore();
  return L.total;
}

// 刻字（牌子上的字）：深色字 + 下沿一道高光，像刻进金属/木头里
function engrave(ctx, str, x, y, o = {}) {
  const { size = 60, ink = [70, 44, 20], hi = [255, 236, 190], a = 1 } = o;
  if (a <= 0.003) return;
  const L = layout(ctx, str, { ...o, size });
  ctx.save(); ctx.globalAlpha *= a; ctx.font = fontOf({ ...o, size }); ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < L.ch.length; i++) { ctx.fillStyle = rgba(hi, 0.55); ctx.fillText(L.ch[i], x + L.xs[i], y + size * 0.035); ctx.fillStyle = rgba(ink); ctx.fillText(L.ch[i], x + L.xs[i], y); }
  ctx.restore();
}

// 铜牌：圆角金属板 + 斜面 + 四颗铆钉 + 刻字；p 翻亮（从暗铜到被灯照亮），sweep 一道反光
//   主字 main（大）+ 副字 sub（拉丁，小一号但≥34px）
function plaque(ctx, x, y, w, h, main, sub, o = {}) {
  const { p = 1, sweep = -1, a = 1, metal = [214, 168, 96], size = Math.min(h * 0.42, w * 0.8 / Math.max(1, [...main].length)) } = o;
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  const lum = lerp(0.45, 0.92, p), m0 = mix([30, 20, 12], mix(metal, [255, 244, 210], 0.15), lum), m1 = mix([20, 14, 8], mix(metal, [120, 70, 30], 0.35), lum);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = h * 0.18; ctx.shadowOffsetY = h * 0.08;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, rgba(m0)); g.addColorStop(0.5, rgba(mix(m0, m1, 0.5))); g.addColorStop(1, rgba(m1));
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.12); ctx.fill(); ctx.shadowColor = 'transparent';
  // 斜面
  ctx.lineWidth = h * 0.04; ctx.strokeStyle = rgba(mix(m0, [255, 255, 255], 0.35), 0.8); ctx.beginPath(); ctx.roundRect(-w / 2 + h * 0.05, -h / 2 + h * 0.05, w - h * 0.1, h - h * 0.1, h * 0.09); ctx.stroke();
  ctx.strokeStyle = rgba(m1, 0.9); ctx.lineWidth = h * 0.02; ctx.beginPath(); ctx.roundRect(-w / 2 + h * 0.11, -h / 2 + h * 0.11, w - h * 0.22, h - h * 0.22, h * 0.06); ctx.stroke();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const rx = sx * (w / 2 - h * 0.13), ry = sy * (h / 2 - h * 0.13); const rg = ctx.createRadialGradient(rx - 2, ry - 2, 0, rx, ry, h * 0.04); rg.addColorStop(0, rgba(mix(m0, [255, 255, 255], 0.6))); rg.addColorStop(1, rgba(m1)); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, ry, h * 0.035, 0, 6.2832); ctx.fill(); }
  const ink = mix([40, 24, 10], [70, 40, 16], p);
  engrave(ctx, main, 0, sub ? -h * 0.02 + size * 0.2 : size * 0.36, { size, ink, hi: mix(m0, [255, 255, 255], 0.4), family: 'ESHeavy', spacing: 0.08 });
  if (sub) engrave(ctx, sub, 0, h * 0.34, { size: Math.max(30, h * 0.17), ink, hi: mix(m0, [255, 255, 255], 0.4), family: 'Latin', weight: 600, spacing: 0.3 });
  if (sweep >= 0 && sweep <= 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.12); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const sx = lerp(-w, w, sweep); const sg = ctx.createLinearGradient(sx - h * 0.6, -h / 2, sx + h * 0.6, h / 2); sg.addColorStop(0, 'rgba(255,240,200,0)'); sg.addColorStop(0.5, 'rgba(255,240,200,0.55)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore(); }
  ctx.restore();
}

// 气泡（角色说话）：大字黑体，弹出（回弹）→ 落定；尾巴指向说话人 (tx,ty)
function bubble(ctx, str, x, y, o = {}) {
  const { size = 50, a = 1, p = 1, tx = x - 40, ty = y + 100, c = [255, 252, 244], ink = [44, 36, 40], accent = null } = o;
  if (a <= 0.003 || p <= 0.001) return;
  const w = K.measure(ctx, str, { size, family: 'ESSans', weight: 700, spacing: 0.02 }) + size * 1.4, h = size * 2.0, sc = back(p);
  ctx.save(); ctx.globalAlpha *= a * smooth(clamp(p * 3)); ctx.translate(lerp(tx, x, Math.min(1, sc)), lerp(ty, y, Math.min(1, sc))); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.42); ctx.fill();
  { const bx = clamp((tx - x) * 0.4, -w / 2 + h * 0.5, w / 2 - h * 0.5), dx = tx - x - bx, dy = Math.max(30, ty - y - h / 2), d = Math.hypot(dx, dy), L = Math.min(d, size * 1.1); ctx.beginPath(); ctx.moveTo(bx - 26, h / 2 - 8); ctx.lineTo(bx + dx / d * L, h / 2 + dy / d * L); ctx.lineTo(bx + 26, h / 2 - 8); ctx.closePath(); ctx.fill(); } ctx.shadowColor = 'transparent';
  if (accent) { ctx.fillStyle = rgba(accent); ctx.beginPath(); ctx.roundRect(-w / 2 + 14, -h / 2 + 14, 10, h - 28, 5); ctx.fill(); }
  K.text(ctx, str, 0, size * 0.36, { size, family: 'ESSans', weight: 700, spacing: 0.02, color: ink });
  ctx.restore();
}

// 标签（深色磨砂底 + 金字 + 左侧色条）：滑入
function tag(ctx, str, x, y, o = {}) {
  const { size = 46, a = 1, p = 1, c = [255, 214, 150], bg = [18, 14, 22], bar = c, align = 'center' } = o;
  if (a <= 0.003 || p <= 0.001) return;
  const tw = K.measure(ctx, str, { size, family: 'ESSans', weight: 700, spacing: 0.06 }), w = tw + size * 1.5, h = size * 1.75, e = easeOut(p);
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  ctx.save(); ctx.globalAlpha *= a * smooth(clamp(p * 2)); ctx.translate(0, (1 - e) * 30);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w * lerp(0.2, 1, e), h, 14); ctx.clip();
  ctx.fillStyle = rgba(bg, 0.82); ctx.fillRect(x0, y - h / 2, w, h); ctx.fillStyle = rgba(bar); ctx.fillRect(x0, y - h / 2, 10, h);
  K.text(ctx, str, x0 + 10 + (w - 10) / 2, y + size * 0.36, { size, family: 'ESSans', weight: 700, spacing: 0.06, color: c });
  ctx.restore(); ctx.restore();
}
module.exports = { foil, engrave, plaque, bubble, tag, back, layout };
