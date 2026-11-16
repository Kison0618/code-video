// 惊奇风视觉语言：深空底、细宋大字逐字点亮、金色光标、底部双语字幕、细刻度尺、彗星光迹、光球
'use strict';
const K = require('./core');
const { W, H, C, rgba, clamp, lerp, smooth, easeOut, mulberry32, glow } = K;

// ———————————————— 背景：墨蓝渐变 + 极细星尘 ————————————————
const DUST = (() => {
  const r = mulberry32(17), o = [];
  for (let i = 0; i < 340; i++) o.push({ x: r() * W, y: r() * H, s: r() < 0.08 ? 2 : 1.2, a: 0.04 + r() * r() * 0.32, ph: r() * 6.28, sp: 0.4 + r() * 1.6 });
  return o;
})();
function bg(ctx, t, o = {}) {
  const { lift = 1, dust = 1, cx = W / 2, cy = H * 0.46, tint = [12, 24, 38] } = o;
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.95);
  g.addColorStop(0, rgba(tint, 0.95 * lift)); g.addColorStop(0.55, rgba(tint, 0.35 * lift)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dust <= 0) return;
  ctx.save();
  for (const d of DUST) {
    const a = d.a * dust * (0.65 + 0.35 * Math.sin(t * d.sp + d.ph));
    ctx.fillStyle = rgba(C.ice, a);
    ctx.fillRect(d.x + Math.sin(t * 0.05 + d.ph) * 6, d.y - t * 1.5 % H, d.s, d.s);
  }
  ctx.restore();
}

// ———————————————— 文字工具 ————————————————
function font(o) { return `${o.style || 'normal'} ${o.weight || 400} ${o.size}px ${o.family || 'Serif'}`; }
function charWidths(ctx, chars, o) {
  ctx.save(); ctx.font = font(o);
  const ws = chars.map(ch => ctx.measureText(ch).width);
  ctx.restore();
  return ws;
}
// keys: 要上色的子串；返回每个字符是否是关键字
function keyMask(str, keys = []) {
  const chars = [...str], m = chars.map(() => false);
  for (const k of keys) {
    const kc = [...k];
    for (let i = 0; i + kc.length <= chars.length; i++) {
      if (kc.every((c, j) => chars[i + j] === c)) for (let j = 0; j < kc.length; j++) m[i + j] = true;
    }
  }
  return m;
}

// 逐字点亮的大字：每字 0.3 s 由虚到实、轻微上浮；金色关键字带辉光；可带金色光标
function typed(ctx, str, x, y, t, t0, o = {}) {
  const { size = 88, weight = 400, spacing = 0.16, cps = 8, color = C.ivory, keyColor = C.gold, keys = [], alpha = 1,
    cursor = false, underline = -1, family = 'Serif', align = 'center', stagger = null } = o;
  if (alpha <= 0.003 || t < t0 - 0.6) return;
  const chars = [...str], mask = keyMask(str, keys);
  const ws = charWidths(ctx, chars, { size, weight, family });
  const sp = spacing * size;
  const total = ws.reduce((s, v) => s + v, 0) + sp * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const xs = [];
  for (let i = 0; i < chars.length; i++) { xs.push(cx); cx += ws[i] + sp; }
  const at = i => t0 + (stagger ? stagger[i] : i / cps);
  ctx.save();
  ctx.font = font({ size, weight, family });
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < chars.length; i++) {
    const a = smooth((t - at(i)) / 0.32) * alpha;
    if (a <= 0.003) continue;
    const c = mask[i] ? keyColor : color, dy = (1 - easeOut((t - at(i)) / 0.5)) * 12;
    if (mask[i]) { ctx.shadowColor = rgba(keyColor, 0.55 * a); ctx.shadowBlur = size * 0.35; }
    else { ctx.shadowColor = rgba(C.ice, 0.18 * a); ctx.shadowBlur = size * 0.18; }
    ctx.fillStyle = rgba(c, a);
    ctx.fillText(chars[i], xs[i], y + dy);
    // 刚出现那一下的柔光
    const flash = Math.max(0, 1 - (t - at(i)) / 0.45);
    if (flash > 0 && t >= at(i)) { ctx.shadowBlur = size * 0.6; ctx.shadowColor = rgba(mask[i] ? keyColor : C.ice, 0.5 * flash * alpha); ctx.fillText(chars[i], xs[i], y + dy); }
  }
  ctx.restore();
  // 光标：打字时停在下一个字的位置，闪烁
  const done = at(chars.length - 1) + 0.1;
  if (cursor && t >= t0 - 0.5 && t < done + 0.5) {
    let k = chars.findIndex((_, i) => t < at(i)); if (k < 0) k = chars.length - 1;
    const blink = t < t0 ? 0.5 + 0.5 * Math.cos((t - t0) * 9) : 1;
    const ca = alpha * blink * (t > done ? 1 - smooth((t - done) / 0.5) : 1) * smooth((t - t0 + 0.5) / 0.3);
    const ux = k < xs.length ? xs[k] : cx;
    underlineAt(ctx, ux, ux + (ws[k] || size), y + size * 0.2, C.gold, ca);
  }
  if (underline >= 0) {
    const ua = alpha * smooth((t - at(underline) - 0.2) / 0.5);
    underlineAt(ctx, xs[underline], xs[underline] + ws[underline], y + size * 0.2, C.gold, ua * 0.85);
  }
  return { xs, ws, total };
}
function underlineAt(ctx, x0, x1, y, c, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(c, 0.18 * a); ctx.fillRect(x0 - 4, y - 4, x1 - x0 + 8, 9);
  ctx.fillStyle = rgba(c, 0.95 * a); ctx.fillRect(x0, y, x1 - x0, 2.4);
  ctx.restore();
  glow(ctx, (x0 + x1) / 2, y + 1, (x1 - x0) * 0.9, c, 0.35 * a);
}

// 一行带关键字上色的静态文字（字幕、结论句共用）
function rich(ctx, str, x, y, o = {}) {
  const { size = 38, weight = 400, spacing = 0.04, color = C.ivory, keyColor = C.gold, keys = [], alpha = 1, family = 'Serif', align = 'center', glowKey = 0.45 } = o;
  if (alpha <= 0.003) return 0;
  const chars = [...str], mask = keyMask(str, keys);
  const ws = charWidths(ctx, chars, { size, weight, family });
  const sp = spacing * size;
  const total = ws.reduce((s, v) => s + v, 0) + sp * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.save();
  ctx.font = font({ size, weight, family });
  for (let i = 0; i < chars.length; i++) {
    if (mask[i]) { ctx.shadowColor = rgba(keyColor, glowKey * alpha); ctx.shadowBlur = size * 0.5; }
    else { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; }
    ctx.fillStyle = rgba(mask[i] ? keyColor : color, alpha);
    ctx.fillText(chars[i], cx, y);
    cx += ws[i] + sp;
  }
  ctx.restore();
  return total;
}

// ———————————————— 字幕：抖音手机竖持横屏看，中文宋体 Medium 62px（约画面高 5.7%），一行放不下按标点折两行；英文行默认不出 ————————————————
const SUB_Y = 972, SUB_EN_Y = 1030, SUB_SIZE = 62, SUB_MAXW = 1560, SUB_EN = false;
function splitSub(ctx, s) {
  const w = K.measure(ctx, s, { size: SUB_SIZE, weight: 500, spacing: 0.06 });
  if (w <= SUB_MAXW) return [s];
  const ch = [...s], mid = ch.length / 2; let best = -1, bd = 1e9;
  ch.forEach((c, i) => { if ('，；：、——'.includes(c) && i < ch.length - 2) { const d = Math.abs(i + 1 - mid); if (d < bd) { bd = d; best = i + 1; } } });
  if (best < 0) best = Math.ceil(mid);
  return [ch.slice(0, best).join(''), ch.slice(best).join('')];
}
function subs(ctx, t, list) {
  for (const s of list) {
    if (t < s.t0 - 0.05 || t > s.t1 + 0.05) continue;
    const a = Math.min(smooth((t - s.t0) / 0.35), smooth((s.t1 - t) / 0.35));
    const dy = (1 - easeOut((t - s.t0) / 0.6)) * 6;
    const lines = splitSub(ctx, s.zh), top = 860 - (lines.length - 1) * 70;
    ctx.save();
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, `rgba(0,0,0,${0.42 * a})`); g.addColorStop(1, `rgba(0,0,0,${0.55 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    ctx.restore();
    lines.forEach((ln, i) => rich(ctx, ln, W / 2, SUB_Y - (lines.length - 1 - i) * 80 + dy, { size: SUB_SIZE, weight: 500, spacing: 0.06, color: [240, 235, 225], keys: s.keys || [], keyColor: s.keyColor || C.gold, alpha: a, glowKey: 0.3 }));
    if (s.en && SUB_EN) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6;
      K.text(ctx, s.en, W / 2, SUB_EN_Y + dy, { size: 30, family: 'Lora', style: 'italic', weight: 400, color: [172, 178, 188], alpha: a * 0.95, spacing: 0 });
      ctx.restore();
    }
  }
}

// HUD 小标签：中文 + 英文大写字距（参考片的「惊奇 SURPRISE」「1948 · BELL LABS」）
function label(ctx, x, y, zh, en, o = {}) {
  const { align = 'left', alpha = 1, color = C.dim, enColor = C.slate } = o, size = (o.size || 30) * 1.3;
  if (alpha <= 0.003) return;
  const zw = zh ? K.measure(ctx, zh, { size, spacing: 0.12 }) : 0;
  const ew = en ? K.measure(ctx, en, { size: size * 0.8, family: 'Latin', weight: 500, spacing: 0.26 }) : 0;
  const gap = zh && en ? size * 0.6 : 0, total = zw + gap + ew;
  let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  if (zh) K.text(ctx, zh, x0, y, { size, color, alpha, align: 'left', spacing: 0.12 });
  if (en) K.text(ctx, en, x0 + zw + gap, y, { size: size * 0.8, family: 'Latin', weight: 500, color: enColor, alpha: alpha * 0.9, align: 'left', spacing: 0.26 });
}
// 读数：斜体西文数字
function num(ctx, str, x, y, o = {}) {
  const { size = 48, color = C.ivory, alpha = 1, align = 'center', weight = 500, glowA = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  if (glowA > 0) { ctx.shadowColor = rgba(color, glowA * alpha); ctx.shadowBlur = size * 0.5; }
  K.text(ctx, str, x, y, { size, family: 'Latin', style: 'italic', weight, color, alpha, align, spacing: 0.02 });
  ctx.restore();
}

// ———————————————— 图形 ————————————————
function orb(ctx, x, y, r, c, a = 1) {
  if (a <= 0.003) return;
  glow(ctx, x, y, r * 7, c, 0.35 * a);
  glow(ctx, x, y, r * 2.6, c, 0.9 * a);
  glow(ctx, x, y, r * 1.1, C.white, a);
}
// 彗星光迹：头部光球 + 渐隐长尾（尾巴朝 (dx,dy) 的反方向）
function comet(ctx, x, y, dx, dy, len, c, a = 1, w = 2.4) {
  if (a <= 0.003) return;
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
  const tx = x - ux * len, ty = y - uy * len;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const [lw, la] of [[w * 6, 0.07], [w * 2.5, 0.22], [w, 0.95]]) {
    const g = ctx.createLinearGradient(x, y, tx, ty);
    g.addColorStop(0, rgba(c, la * a)); g.addColorStop(0.35, rgba(c, la * a * 0.35)); g.addColorStop(1, rgba(c, 0));
    ctx.strokeStyle = g; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  }
  ctx.restore();
  orb(ctx, x, y, w * 1.6, c, a);
}
// 细刻度尺
function ruler(ctx, x0, x1, y, n, a = 1, o = {}) {
  if (a <= 0.003) return;
  const { c = C.slate, major = 5, tick = 7, reveal = 1, below = true } = o;
  const xe = lerp(x0, x1, clamp(reveal));
  ctx.save();
  ctx.strokeStyle = rgba(c, 0.55 * a); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xe, y); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n); if (x > xe + 0.5) break;
    const h = i % major === 0 ? tick * 1.9 : tick;
    ctx.moveTo(x, y); ctx.lineTo(x, below ? y + h : y - h);
  }
  ctx.strokeStyle = rgba(c, 0.45 * a); ctx.stroke();
  ctx.restore();
}
function ellipse(ctx, cx, cy, rx, ry, c, a, w = 1.2, rot = 0, a0 = 0, a1 = Math.PI * 2) {
  if (a <= 0.003 || rx <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, Math.max(0.1, ry), rot, a0, a1);
  ctx.strokeStyle = rgba(c, clamp(a)); ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}
// 扩散光环（一次性冲击波）
function shock(ctx, x, y, t, t0, o = {}) {
  const { r0 = 10, r1 = 700, dur = 1.6, c = C.gold, a = 1, sy = 1, w = 1.6 } = o;
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return;
  const r = lerp(r0, r1, easeOut(u)), al = a * (1 - u) * (1 - u);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ellipse(ctx, x, y, r, r * sy, c, al * 0.9, w);
  ellipse(ctx, x, y, r * 0.97, r * 0.97 * sy, c, al * 0.25, w * 6);
  ctx.restore();
}

module.exports = { bg, typed, rich, subs, label, num, orb, comet, ruler, ellipse, shock, underlineAt, keyMask, SUB_Y };
