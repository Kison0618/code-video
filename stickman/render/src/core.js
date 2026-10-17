// 公共工具：画布、字体、配色、缓动、随机数
'use strict';
const path = require('path');
const { Canvas, FontLibrary } = require('skia-canvas');

const W = 1920, H = 1080;
const FPS = +(process.env.FPS || 60);

const GF = path.join(__dirname, '..', 'node_modules', '@expo-google-fonts');
const font = (pkg, file) => path.join(GF, pkg, file.split('_').slice(1).join('_').replace('.ttf', ''), file);
// Consolas 的开源替代（编程集的代码字体）
FontLibrary.use('Code', ['Inconsolata_400Regular.ttf', 'Inconsolata_500Medium.ttf', 'Inconsolata_700Bold.ttf'].map(f => font('inconsolata', f)));
// 数学集的人文无衬线体
FontLibrary.use('Sans', ['OpenSans_400Regular.ttf', 'OpenSans_600SemiBold.ttf', 'OpenSans_700Bold.ttf'].map(f => font('open-sans', f)));
FontLibrary.use('SC', ['NotoSansSC_400Regular.ttf', 'NotoSansSC_700Bold.ttf'].map(f => font('noto-sans-sc', f)));
FontLibrary.use('Mono', ['JetBrainsMono_400Regular.ttf'].map(f => font('jetbrains-mono', f)));

// 配色：全部实测自原片
const C = {
  bg: [0, 0, 0],
  white: [255, 255, 255],
  yellow: [254, 196, 0],        // 编程集主角
  orange: [255, 110, 0],        // 数学 / 几何集主角
  laptop: [202, 202, 202],
  laptopEdge: [151, 151, 151],
  // VS Code Dark+
  fn: [220, 220, 170],
  var: [156, 220, 254],
  str: [206, 145, 120],
  num: [181, 206, 168],
  kw: [197, 134, 192],
  bracket: [249, 196, 8],
  op: [212, 212, 212],
  sel: [51, 51, 51],
  err: [110, 12, 12],
  errText: [230, 40, 40],
  // matplotlib 默认色
  mplBlue: [31, 119, 180],
  mplOrange: [255, 127, 14],
  gold: [255, 200, 48],
  warm: [255, 150, 60],
};
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const E = {
  linear: x => clamp(x),
  in: x => Math.pow(clamp(x), 2),
  out: x => 1 - Math.pow(1 - clamp(x), 2),
  inOut: x => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; },
  in3: x => Math.pow(clamp(x), 3),
  out3: x => 1 - Math.pow(1 - clamp(x), 3),
  inOut3: x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x))),
  // 带过冲的回弹：动画里的"压下去再弹回"
  outBack: x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  // 关键帧之间的"保持"：直接跳到下一个姿势
  step: x => (x >= 1 ? 1 : 0),
  smooth,
};

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
const D2R = Math.PI / 180;

// 文字
function text(ctx, str, x, y, o = {}) {
  const { size = 32, family = 'Sans', weight = 400, color = C.white, alpha = 1, align = 'left', baseline = 'alphabetic' } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align; ctx.textBaseline = baseline;
  ctx.fillStyle = rgba(color, clamp(alpha));
  ctx.fillText(str, x, y);
  ctx.restore();
}
function measure(ctx, str, size, family = 'Sans', weight = 400) {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`;
  const w = ctx.measureText(str).width; ctx.restore(); return w;
}

module.exports = { W, H, FPS, Canvas, C, rgba, mix, clamp, lerp, prog, smooth, E, mulberry32, hash, noise1, D2R, text, measure };
