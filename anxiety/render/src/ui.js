// 文字与图表的公共件：逐字浮现的中英字幕、滚动计数器、坐标轴、刻度、注释
'use strict';
const K = require('./core');
const { W, H, C, rgba, mix, clamp, lerp, smooth, text, measure } = K;

// 一句中文（下面一行小英文）。中文逐字浮现；hl = { '恶': C.red } 指定关键词颜色
// o: { t0, x, y, size, en, hl, out, align, cps }
function caption(ctx, t, cn, o = {}) {
  const { t0 = 0, x = W / 2, y = H - 150, size = 46, en = '', hl = {}, out = Infinity, align = 'center', cps = 14, weight = 500 } = o;
  if (t < t0) return;
  const fade = 1 - smooth((t - out) / 0.6);
  if (fade <= 0) return;
  const st = { family: 'Song', size, weight, spacing: 0.1 };
  const chars = [...cn];
  const total = measure(ctx, cn, st);
  let cx = align === 'center' ? x - total / 2 : x;
  // 关键词：按子串找到每个字的颜色
  const cols = chars.map(() => C.bone);
  for (const [word, col] of Object.entries(hl)) {
    let i = cn.indexOf(word);
    while (i >= 0) { const s = [...cn.slice(0, i)].length; for (let k = 0; k < [...word].length; k++) cols[s + k] = col; i = cn.indexOf(word, i + word.length); }
  }
  chars.forEach((ch, i) => {
    const ti = t0 + i / cps;
    const a = clamp((t - ti) / 0.35) * fade;
    const w = measure(ctx, ch, st) + st.spacing * size;
    if (a > 0) text(ctx, ch, cx, y + (1 - smooth((t - ti) / 0.5)) * 8, { ...st, color: cols[i], alpha: a, align: 'left' });
    cx += w;
  });
  if (en) {
    const ea = clamp((t - t0 - chars.length / cps * 0.6) / 0.8) * fade;
    text(ctx, en, align === 'center' ? x : x, y + size * 0.85, { family: 'Garamond', style: 'italic', size: Math.round(size * 0.42), color: C.dim, alpha: ea * 0.9, align, spacing: 0.04 });
  }
}

// 数字滚动：从 a 滚到 b
function rolling(ctx, t, t0, dur, a, b, x, y, o = {}) {
  const u = smooth(clamp((t - t0) / dur));
  const v = Math.round(lerp(a, b, u));
  const s = (o.fmt || (n => n.toLocaleString('en-US')))(v);
  text(ctx, s, x, y, { family: 'Mono', size: o.size || 28, color: o.color || C.bone, alpha: o.alpha == null ? 1 : o.alpha, align: o.align || 'right', spacing: 0.04 });
  return v;
}

// 小号等宽注释
function note(ctx, s, x, y, o = {}) {
  text(ctx, s, x, y, { family: 'Mono', size: o.size || 18, color: o.color || C.dim, alpha: o.alpha == null ? 0.8 : o.alpha, align: o.align || 'left', spacing: 0.08, weight: 300 });
}

// 坐标轴（带刻度）。box = [x0, y0, x1, y1]（y0 在上）
function axes(ctx, box, a = 1, o = {}) {
  const [x0, y0, x1, y1] = box;
  ctx.save();
  ctx.strokeStyle = rgba(C.dim, 0.7 * a); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  const nx = o.nx || 10, ny = o.ny || 5;
  ctx.strokeStyle = rgba(C.dim, 0.5 * a);
  ctx.beginPath();
  for (let i = 0; i <= nx; i++) { const x = lerp(x0, x1, i / nx); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 6); }
  for (let i = 0; i <= ny; i++) { const y = lerp(y1, y0, i / ny); ctx.moveTo(x0, y); ctx.lineTo(x0 - 6, y); }
  ctx.stroke();
  // 细网格
  ctx.strokeStyle = rgba(C.line, 0.35 * a); ctx.setLineDash([2, 6]);
  ctx.beginPath();
  for (let i = 1; i <= ny; i++) { const y = lerp(y1, y0, i / ny); ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

module.exports = { caption, rolling, note, axes };
