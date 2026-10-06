// 公共工具：画布、字体、配色、缓动、随机数、光晕、文字
'use strict';
const path = require('path');
const { Canvas, FontLibrary } = require('skia-canvas');

const W = 1920, H = 1080, FPS = 60;

const FONT_DIR = path.join(__dirname, '..', 'fonts');
FontLibrary.use('Song', [
  'NotoSerifSC_200ExtraLight.ttf', 'NotoSerifSC_300Light.ttf',
  'NotoSerifSC_400Regular.ttf', 'NotoSerifSC_500Medium.ttf',
].map(f => path.join(FONT_DIR, f)));
FontLibrary.use('Garamond', [
  'CormorantGaramond_300Light.ttf', 'CormorantGaramond_400Regular.ttf',
  'CormorantGaramond_400Regular_Italic.ttf', 'CormorantGaramond_500Medium_Italic.ttf',
].map(f => path.join(FONT_DIR, f)));
FontLibrary.use('Mono', [
  'JetBrainsMono_300Light.ttf', 'JetBrainsMono_400Regular.ttf',
].map(f => path.join(FONT_DIR, f)));

// 配色：金色只给"生命之线"和主角，青色是结构，玫红是"错误/变异"
const C = {
  bg: [4, 6, 10],
  ivory: [237, 230, 216],
  gold: [236, 196, 122],
  amber: [255, 170, 80],
  cyan: [126, 184, 201],
  rose: [214, 84, 106],
  dim: [120, 132, 150],
};
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// 数学与缓动
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeInOut = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = x => Math.pow(clamp(x), 3);
const easeOutExpo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
// 在 [a,b] 内可见，前后各有淡入淡出
function vis(t, a, b, fi = 0.6, fo = 0.6) {
  if (t < a || t > b) return 0;
  return Math.min(smooth((t - a) / fi), smooth((b - t) / fo));
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 平滑的一维值噪声（确定性）
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const h = n => { const s = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453; return s - Math.floor(s); };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}

// 关键帧插值：[[t, {k:v}], ...]，段间 easeInOut
function keyframes(list, t) {
  if (t <= list[0][0]) return { ...list[0][1] };
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, a] = list[i], [t1, b] = list[i + 1];
    if (t <= t1) {
      const u = easeInOut((t - t0) / (t1 - t0));
      const o = {};
      for (const k in a) o[k] = lerp(a[k], b[k] !== undefined ? b[k] : a[k], u);
      return o;
    }
  }
  return { ...list[list.length - 1][1] };
}

// 光晕贴图：高斯衰减的白色圆，按颜色缓存
const glowCache = new Map();
function glowSprite(c) {
  const key = c.join(',');
  if (glowCache.has(key)) return glowCache.get(key);
  const S = 256, cv = new Canvas(S, S), x = cv.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (i + 0.5 - S / 2) / (S / 2), dy = (j + 0.5 - S / 2) / (S / 2);
    const r2 = dx * dx + dy * dy;
    let a = Math.exp(-r2 * 5.5) * (1 - smooth(r2)) + 0.6 * Math.exp(-r2 * 60);
    a = clamp(a);
    const k = (j * S + i) * 4;
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.round(a * 255);
  }
  x.putImageData(img, 0, 0);
  glowCache.set(key, cv);
  return cv;
}
// 在 (x,y) 画半径 r 的光晕（叠加模式）
function glow(ctx, x, y, r, c, a = 1) {
  if (a <= 0.002 || r <= 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  ctx.drawImage(glowSprite(c), x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}
// 带光晕的折线：多遍描边
function glowLine(ctx, pts, c, a = 1, w = 1.6, spread = 1) {
  if (a <= 0.002 || pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const passes = [[w * 9 * spread, 0.035], [w * 4 * spread, 0.09], [w * 1.8, 0.28], [w, 0.95]];
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  for (const [lw, la] of passes) {
    ctx.strokeStyle = rgba(c, la * a);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}
function line(ctx, pts, c, a = 1, w = 1) {
  if (a <= 0.002 || pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(c, a);
  ctx.lineWidth = w;
  ctx.stroke();
}
// 截取折线的前 f 部分（按弧长）
function partial(pts, f) {
  if (f >= 1) return pts;
  if (f <= 0) return [];
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  const target = L * f, out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (acc + seg[i - 1] >= target) {
      const u = (target - acc) / seg[i - 1];
      out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
      return out;
    }
    acc += seg[i - 1]; out.push(pts[i]);
  }
  return out;
}

// 文字：支持字间距、对齐、透明度
function text(ctx, str, x, y, o = {}) {
  const {
    size = 32, family = 'Song', weight = 300, style = 'normal', color = C.ivory, alpha = 1,
    align = 'center', spacing = 0, baseline = 'alphabetic', glowA = 0,
  } = o;
  if (alpha <= 0.002) return 0;
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.textBaseline = baseline;
  ctx.fillStyle = rgba(color, alpha);
  const chars = [...str];
  const sp = spacing * size;
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((s, v) => s + v, 0) + sp * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  if (glowA > 0) glow(ctx, x + (align === 'center' ? 0 : align === 'right' ? -total / 2 : total / 2), y - size * 0.35, total * 0.6 + size, color, glowA * alpha);
  if (sp === 0) {
    ctx.textAlign = 'left';
    ctx.fillText(str, cx, y);
  } else {
    for (let i = 0; i < chars.length; i++) { ctx.fillText(chars[i], cx, y); cx += widths[i] + sp; }
  }
  ctx.restore();
  return total;
}
function measure(ctx, str, o = {}) {
  const { size = 32, family = 'Song', weight = 300, style = 'normal', spacing = 0 } = o;
  ctx.save(); ctx.font = `${style} ${weight} ${size}px ${family}`;
  const chars = [...str];
  const w = chars.reduce((s, ch) => s + ctx.measureText(ch).width, 0) + spacing * size * Math.max(0, chars.length - 1);
  ctx.restore();
  return w;
}

const fmt = n => Math.round(n).toLocaleString('en-US');

module.exports = {
  W, H, FPS, Canvas, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, easeOutExpo,
  vis, mulberry32, noise1, keyframes, glow, glowSprite, glowLine, line, partial, text, measure, fmt,
};
