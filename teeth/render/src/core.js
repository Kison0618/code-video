// 公共工具：画布、字体、配色、缓动、随机数、光晕、线条、文字、3D 投影
'use strict';
const path = require('path');
const { Canvas, FontLibrary } = require('skia-canvas');

const W = 1920, H = 1080, FPS = 60;

const GF = path.join(__dirname, '..', 'node_modules', '@expo-google-fonts');
const font = (pkg, file) => path.join(GF, pkg, file.split('_').slice(1).join('_').replace('.ttf', ''), file);
FontLibrary.use('Garamond', ['CormorantGaramond_300Light.ttf', 'CormorantGaramond_400Regular.ttf', 'CormorantGaramond_500Medium.ttf',
  'CormorantGaramond_300Light_Italic.ttf', 'CormorantGaramond_400Regular_Italic.ttf'].map(f => font('cormorant-garamond', f)));
FontLibrary.use('Cinzel', ['Cinzel_400Regular.ttf', 'Cinzel_600SemiBold.ttf', 'Cinzel_700Bold.ttf', 'Cinzel_900Black.ttf'].map(f => font('cinzel', f)));
FontLibrary.use('Song', ['NotoSerifSC_300Light.ttf', 'NotoSerifSC_400Regular.ttf', 'NotoSerifSC_500Medium.ttf', 'NotoSerifSC_700Bold.ttf'].map(f => font('noto-serif-sc', f)));
FontLibrary.use('Mono', ['JetBrainsMono_300Light.ttf', 'JetBrainsMono_400Regular.ttf'].map(f => font('jetbrains-mono', f)));

// 配色 v2："一颗心的两面"。冷的青、热的品红，中间是骨白；红色只作极少的点缀
const C = {
  bg: [5, 5, 12],
  ink: [10, 9, 20],
  bone: [236, 226, 206],
  ivory: [236, 226, 206],
  white: [255, 250, 244],
  cyan: [70, 225, 235],
  teal: [30, 150, 170],
  ice: [190, 230, 250],
  magenta: [255, 60, 160],
  pink: [255, 140, 200],
  violet: [150, 95, 255],
  amber: [255, 175, 80],
  gold: [240, 196, 116],
  steel: [140, 168, 190],
  blood: [230, 40, 80],
};
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeInOut = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = x => Math.pow(clamp(x), 3);
const easeOutExpo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
function vis(t, a, b, fi = 0.4, fo = 0.4) {
  if (t < a || t > b) return 0;
  return Math.min(fi > 0 ? smooth((t - a) / fi) : 1, fo > 0 ? smooth((b - t) / fo) : 1);
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
}

// 光晕贴图（按颜色缓存）
const glowCache = new Map();
function glowSprite(c) {
  const key = c.map(v => v | 0).join(',');
  if (glowCache.has(key)) return glowCache.get(key);
  const S = 256, cv = new Canvas(S, S), x = cv.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (i + 0.5 - S / 2) / (S / 2), dy = (j + 0.5 - S / 2) / (S / 2), r2 = dx * dx + dy * dy;
    const a = clamp(Math.exp(-r2 * 5.5) * (1 - smooth(r2)) + 0.6 * Math.exp(-r2 * 60));
    const k = (j * S + i) * 4;
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.round(a * 255);
  }
  x.putImageData(img, 0, 0);
  glowCache.set(key, cv);
  return cv;
}
function glow(ctx, x, y, r, c, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  ctx.drawImage(glowSprite(c), x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}
function pathOf(ctx, pts, close) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
}
// 发光线：多遍描边叠加
function glowLine(ctx, pts, c, a = 1, w = 1.6, spread = 1, close = false) {
  if (a <= 0.003 || pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  pathOf(ctx, pts, close);
  for (const [lw, la] of [[w * 8 * spread, 0.04], [w * 3.5 * spread, 0.1], [w * 1.7, 0.3], [w, 0.95]]) {
    ctx.strokeStyle = rgba(c, clamp(la * a));
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}
// 一次性描很多条线段（同色同宽）：segs = [x0,y0,x1,y1, ...]
function glowSegs(ctx, segs, c, a = 1, w = 1.4, spread = 1) {
  if (a <= 0.003 || segs.length < 4) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < segs.length; i += 4) { ctx.moveTo(segs[i], segs[i + 1]); ctx.lineTo(segs[i + 2], segs[i + 3]); }
  for (const [lw, la] of [[w * 7 * spread, 0.045], [w * 3 * spread, 0.11], [w, 0.9]]) {
    ctx.strokeStyle = rgba(c, clamp(la * a));
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}
function line(ctx, pts, c, a = 1, w = 1) {
  if (a <= 0.003 || pts.length < 2) return;
  pathOf(ctx, pts);
  ctx.strokeStyle = rgba(c, clamp(a));
  ctx.lineWidth = w;
  ctx.stroke();
}
function partial(pts, f) {
  if (f >= 1) return pts;
  if (f <= 0) return [];
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  const target = L * f, out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (acc + seg[i - 1] >= target) {
      const u = (target - acc) / (seg[i - 1] || 1);
      out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
      return out;
    }
    acc += seg[i - 1]; out.push(pts[i]);
  }
  return out;
}
function circlePts(cx, cy, r, n = 96, a0 = 0) {
  const o = [];
  for (let k = 0; k <= n; k++) { const a = a0 + k / n * Math.PI * 2; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return o;
}

// 文字（支持字间距）
function text(ctx, str, x, y, o = {}) {
  const { size = 32, family = 'Garamond', weight = 400, style = 'normal', color = C.ivory, alpha = 1, align = 'center', spacing = 0 } = o;
  if (alpha <= 0.003) return 0;
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(color, clamp(alpha));
  if (o.blend) ctx.globalCompositeOperation = o.blend;
  const chars = [...str], sp = spacing * size;
  const ws = chars.map(ch => ctx.measureText(ch).width);
  const total = ws.reduce((s, v) => s + v, 0) + sp * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (let i = 0; i < chars.length; i++) { ctx.fillText(chars[i], cx, y); cx += ws[i] + sp; }
  ctx.restore();
  return total;
}

// —— 3D：绕轴旋转 + 透视投影 ——
function rot3(p, ax, ay, az) {
  let [x, y, z] = p;
  let c = Math.cos(ax), s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay); s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az); s = Math.sin(az);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}
// 相机在 z = -camZ 处看向原点；返回屏幕坐标和缩放（深度）
function proj(p, camZ = 900, fov = 900, cx = W / 2, cy = H / 2) {
  const d = p[2] + camZ;
  if (d <= 10) return null;
  const s = fov / d;
  return [cx + p[0] * s, cy + p[1] * s, s];
}

function measure(ctx, str, o = {}) {
  const { size = 32, family = 'Garamond', weight = 400, style = 'normal', spacing = 0 } = o;
  ctx.save(); ctx.font = `${style} ${weight} ${size}px ${family}`;
  const chars = [...str];
  const w = chars.reduce((s, ch) => s + ctx.measureText(ch).width, 0) + spacing * size * Math.max(0, chars.length - 1);
  ctx.restore();
  return w;
}

module.exports = {
  W, H, FPS, Canvas, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, easeOutExpo, vis,
  mulberry32, hash, noise1, glow, glowSprite, glowLine, glowSegs, line, partial, circlePts, text, measure, rot3, proj,
};
