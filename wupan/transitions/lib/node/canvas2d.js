/* 三式的纯 2D canvas 改写（不需要 WebGL）。skia-canvas 和浏览器 2D canvas 都能用。
 *
 *   const C2 = require('./lib/node/canvas2d');
 *   C2.juanzhou(ctx, fromCanvas, toCanvas, p, { seed })   // 卷轴：按列切片贴到圆柱上，近似原版
 *   C2.shuaijing(ctx, fromCanvas, toCanvas, p, { seed })  // 甩镜：tanh 机位曲线 + 多次叠印模拟快门积分
 *   C2.moran(ctx, fromCanvas, toCanvas, p, { seed })      // 墨染（简化）：噪声多边形墨团 + 墨灰过渡 + 水渍边
 *
 * from/to 必须已经是和 ctx.canvas 同尺寸的画面（用 C2.cover(img, W, H) 先铺满裁切）。
 * 和 GLSL 原版的取舍写在每个函数前面。速度（1920×1080，skia-canvas 3.0.8，本机）：见 README。
 */
'use strict';

let makeCanvas = (w, h) => {
  if (typeof document !== 'undefined') return Object.assign(document.createElement('canvas'), { width: w, height: h });
  const { Canvas } = require('skia-canvas');
  return new Canvas(w, h);
};
function setCanvasFactory(f) { makeCanvas = f; }

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// 与 GLSL hash12 同式，保证同 seed 下墨滴位置一致
const fract = (x) => x - Math.floor(x);
function hash22(px, py) {
  let x = fract(px * 0.1031), y = fract(py * 0.1030), z = fract(px * 0.0973);
  const d = x * (y + 33.33) + y * (z + 33.33) + z * (x + 33.33);
  x += d; y += d; z += d;
  return [fract((x + y) * z), fract((x + z) * y)];
}

const pool = new Map();
function scratch(name, w, h) {
  let c = pool.get(name);
  if (!c || c.width !== w || c.height !== h) { c = makeCanvas(w, h); pool.set(name, c); }
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.clearRect(0, 0, w, h);
  return [c, g];
}

// 等比铺满裁切到 W×H
function cover(img, W, H, name) {
  const [c, g] = name ? scratch(name, W, H) : [makeCanvas(W, H), null];
  const gg = g || c.getContext('2d');
  const iw = img.width, ih = img.height, k = Math.max(W / iw, H / ih);
  const sw = W / k, sh = H / k;
  gg.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H);
  return c;
}

/* 卷轴 · 2D
 * 保留：卷轴位置/半径曲线、圆柱按列 asin 反算取样（每列 1px drawImage）、漫反射+高光+轮廓压暗、
 *       轴前投影、轴后接触阴影、新展开纸面的泛黄、上下装裱绫边和金线。
 * 省略：纸纤维、斑驳噪声、绫纹；纸面泛黄改成整列乘色渐变。 */
function juanzhou(ctx, from, to, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height, A = W / H;
  if (p <= 0) return ctx.drawImage(from, 0, 0);
  if (p >= 1) return ctx.drawImage(to, 0, 0);
  const e = mix(p, ease(p), 0.4);
  const R = 0.1 * (0.7 + 0.3 * (1 - e));
  const xr = mix(A + R + 0.1, -R - 0.12, e);
  const bandH = 0.042 * (1 - smooth(0.62, 0.92, p));
  const xpx = (X) => X * H;                       // 高度单位 → 像素
  const L = xpx(xr - R), Rr = xpx(xr + R);
  ctx.save();
  // 旧画面 + 卷轴前方的柔和投影
  ctx.drawImage(from, 0, 0);
  const env = smooth(0, 0.06, p);
  const sh = ctx.createLinearGradient(L, 0, L - xpx(0.5), 0);
  for (let i = 0; i <= 10; i++) { const d = i / 10 * 0.5; sh.addColorStop(i / 10, `rgba(0,0,0,${(0.5 * Math.exp(-d / 0.035) + 0.22 * Math.exp(-d / 0.16)) * env})`); }
  ctx.fillStyle = sh; ctx.fillRect(Math.max(0, L - xpx(0.5)), 0, xpx(0.5), H);
  // 已展开的平铺纸面：新画面
  const x0 = Math.max(0, Math.floor(Rr));
  if (x0 < W) {
    ctx.drawImage(to, x0, 0, W - x0, H, x0, 0, W - x0, H);
    // 泛黄：靠近卷轴最重，往右指数褪去
    const fadeAll = 1 - smooth(0.7, 1, p);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(Rr, 0, Rr + xpx(1.5), 0);
    for (let i = 0; i <= 8; i++) { const a = Math.exp(-(i / 8 * 1.5) / 0.5) * fadeAll; g.addColorStop(i / 8, `rgb(${255 - 0 * a | 0},${255 - 13 * a | 0},${255 - 46 * a | 0})`); }
    ctx.fillStyle = g; ctx.fillRect(x0, 0, W - x0, H);
    ctx.globalCompositeOperation = 'source-over';
    // 接触阴影
    const cs = ctx.createLinearGradient(Rr, 0, Rr + xpx(0.08), 0);
    const ca = 0.35 * (1 - smooth(0.9, 1, p));
    for (let i = 0; i <= 6; i++) cs.addColorStop(i / 6, `rgba(0,0,0,${ca * Math.exp(-(i / 6 * 0.08) / 0.018)})`);
    ctx.fillStyle = cs; ctx.fillRect(x0, 0, xpx(0.08), H);
  }
  // 卷轴本体：逐列
  const Ld = [-0.55, 0.25, 0.8], ln = Math.hypot(...Ld); Ld[0] /= ln; Ld[1] /= ln; Ld[2] /= ln;
  const Hv = [Ld[0], Ld[1], Ld[2] + 1], hn = Math.hypot(...Hv);
  const cFade = 1 - smooth(0.85, 1, p);
  for (let x = Math.max(0, Math.floor(L)); x < Math.min(W, Math.ceil(Rr)); x++) {
    const X = (x + 0.5) / H, nx = clamp((X - xr) / R, -1, 1);
    const phi = Math.PI + Math.asin(nx);
    const Xc = Math.abs(xr - R * phi);
    const nz = Math.sqrt(Math.max(1 - nx * nx, 0));
    const squeeze = 1 - 0.035 * nz, hh = H * squeeze, y0 = (H - hh) / 2;
    const sx = clamp(Xc * H, 0, W - 1);
    ctx.drawImage(to, sx, 0, 1, H, x, y0, 1, hh);
    // 泛黄
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(255,${255 - 13 * cFade | 0},${255 - 46 * cFade | 0})`; ctx.fillRect(x, y0, 1, hh);
    ctx.globalCompositeOperation = 'source-over';
    const diff = Math.max(nx * Ld[0] + nz * Ld[2], 0);
    const spec = Math.pow(Math.max((nx * Hv[0] + nz * Hv[2]) / hn, 0), 24);
    let k = (0.22 + 0.88 * diff) * (0.55 + 0.45 * smooth(0, 0.25, nz));
    if (k < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(x, y0, 1, hh); }
    else { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${Math.min(1, k - 1)})`; ctx.fillRect(x, y0, 1, hh); ctx.globalCompositeOperation = 'source-over'; }
    if (spec > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,245,224,${spec * 0.14})`; ctx.fillRect(x, y0, 1, hh); ctx.globalCompositeOperation = 'source-over'; }
  }
  // 装裱：上下绫边 + 金色隔水线（只在已展开与卷轴上）
  if (bandH > 0.001) {
    const bx = Math.max(0, Math.floor(L)), bw = W - bx, b = bandH * H;
    ctx.fillStyle = 'rgb(153,168,158)';
    ctx.fillRect(bx, 0, bw, b); ctx.fillRect(bx, H - b, bw, b);
    ctx.fillStyle = 'rgb(186,158,107)';
    ctx.fillRect(bx, b - 0.004 * H, bw, 0.003 * H); ctx.fillRect(bx, H - b + 0.001 * H, bw, 0.003 * H);
    // 绫边在卷轴上的明暗
    for (let x = bx; x < Math.min(W, Math.ceil(Rr)); x++) {
      const nx = clamp(((x + 0.5) / H - xr) / R, -1, 1), nz = Math.sqrt(Math.max(1 - nx * nx, 0));
      const k = (0.22 + 0.88 * Math.max(nx * Ld[0] + nz * Ld[2], 0)) * (0.55 + 0.45 * smooth(0, 0.25, nz));
      if (k < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(x, 0, 1, b); ctx.fillRect(x, H - b, 1, b); }
    }
  }
  ctx.restore();
}

/* 甩镜 · 2D
 * 保留：同一全景上相距 0.95 屏宽的两段、tanh S 曲线（K=9）、快门角两端收零（p=0/1 精确）、按时刻决定取旧/新图、越界镜像、
 *       与速度成正比的竖直抖动。
 * 改动：22 次逐像素时间采样 → 每帧整幅叠印 taps 次（默认 16，running average）；省略卷帘快门的行偏移和按行抖动。 */
function shuaijing(ctx, from, to, p, o = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const D = 0.95, K = 9, taps = o.taps || 16;
  const th = Math.tanh;
  const S = (t) => 0.5 + 0.5 * th(K * (clamp(t, 0, 1) - 0.5)) / th(0.5 * K);
  const V = (t) => { const h = th(K * (clamp(t, 0, 1) - 0.5)); return 1 - h * h; };
  const Hs = 0.05 * smooth(0, 0.18, p) * smooth(1, 0.82, p);
  const ph = (o.seed == null ? 0.37 : o.seed) * 37;
  // 带镜像边的条带：[-W, 2W) 三段，中间正向，两侧水平翻转
  const strip = (img, name) => {
    const [c, g] = scratch(name, W * 3, H);
    g.drawImage(img, W, 0);
    g.save(); g.scale(-1, 1); g.drawImage(img, -W, 0); g.drawImage(img, -3 * W, 0); g.restore();
    return c;
  };
  const sf = strip(from, 'sj_from'), st = strip(to, 'sj_to');
  const [acc, ag] = scratch('sj_acc', W, H);
  const n = Hs < 1e-4 ? 1 : taps;
  for (let j = 0; j < n; j++) {
    const fc = n === 1 ? 0 : (j + 0.5) / n - 0.5;
    const t = p + 2 * Hs * fc;
    const v = V(t);
    const sy = v * (0.0065 * Math.sin(t * 31 + ph) + 0.0035 * Math.sin(t * 57 + ph * 1.7)) * H;
    let x = D * S(t);                               // 采样偏移（屏宽）
    let src = sf;
    if (t >= 0.5) { src = st; x -= D; }
    x = ((x % 2) + 2) % 2; if (x > 1) x -= 2;       // 镜像周期 2，落到 [-1,1)
    ag.globalAlpha = 1 / (j + 1);
    ag.drawImage(src, (1 + x) * W, 0, W, H, 0, sy, W, H);
    if (sy > 0) ag.drawImage(src, (1 + x) * W, 0, W, 1, 0, 0, W, sy + 1);        // 竖向抖动露出的边
    else if (sy < 0) ag.drawImage(src, (1 + x) * W, H - 1, W, 1, 0, H + sy - 1, W, -sy + 1);
  }
  ctx.drawImage(acc, 0, 0);
}

/* 墨染 · 2D（简化）
 * 保留：三滴墨的位置/落下时刻/半径曲线（hash 与 GLSL 同式，同 seed 同位置）、p>0.8 浸透外扩、
 *       墨团内先是墨灰（灰度+压缩对比）再向内回到原色、前沿深色水渍、前沿外淡淡的湿晕。
 * 省略：fbm 乘性扭曲（改成角向多频正弦扰动半径）、毛细触须、宣纸纤维。 */
function moran(ctx, from, to, p, o = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height, A = W / H;
  if (p <= 0) return ctx.drawImage(from, 0, 0);
  if (p >= 1) return ctx.drawImage(to, 0, 0);
  const seed = o.seed == null ? 0.37 : o.seed;
  const endF = smooth(0.8, 1, p), env = smooth(0, 0.06, p);
  const drops = [];
  for (let i = 0; i < 3; i++) {
    const h = hash22(i * 7.31 + 1.7, seed * 113 + i * 3.1);
    const c = [(0.16 + 0.68 * h[0]) * A, 0.2 + 0.6 * h[1]];
    const t0 = i * 0.11, g = clamp((p - t0) / (1 - t0), 0, 1);
    const R = 1.3 * Math.pow(g, 1.15) * (0.8 + 0.4 * h[1]) - 0.015 + 1.25 * endF * endF;
    if (R > 0) drops.push({ c, R, ph: h[0] * 40 + i * 3 });
  }
  const blob = (inset) => {
    const path = new (typeof Path2D !== 'undefined' ? Path2D : require('skia-canvas').Path2D)();
    for (const d of drops) {
      const r0 = d.R - inset;
      if (r0 <= 0) continue;
      const N = 180;
      for (let k = 0; k <= N; k++) {
        const a = k / N * Math.PI * 2;
        // 低频大瓣 + 高频毛边；扰动幅度随墨团长大
        const w = 0.16 * Math.sin(3 * a + d.ph) + 0.1 * Math.sin(5 * a + d.ph * 1.7) + 0.05 * Math.sin(9 * a + d.ph * 2.3) + 0.025 * Math.sin(23 * a + d.ph * 3.1) + 0.012 * Math.sin(61 * a + d.ph);
        const r = r0 * (1 + w);
        const x = (d.c[0] + Math.cos(a) * r) * H, y = H - (d.c[1] + Math.sin(a) * r) * H;
        k ? path.lineTo(x, y) : path.moveTo(x, y);
      }
      path.closePath();
    }
    return path;
  };
  const outer = blob(0), inner = blob(0.22);
  // 墨团内容：墨灰（宣纸上的水墨）→ 内部回到原色
  const [lay, lg] = scratch('mr_lay', W, H);
  lg.filter = 'grayscale(1) contrast(0.5) brightness(0.82)';
  lg.drawImage(to, 0, 0); lg.filter = 'none';
  const [col, cg] = scratch('mr_col', W, H);
  cg.drawImage(to, 0, 0);
  const [msk, mg] = scratch('mr_msk', W, H);
  mg.filter = `blur(${Math.round(0.07 * H)}px)`; mg.fillStyle = '#000'; mg.fill(inner); mg.filter = 'none';
  cg.globalCompositeOperation = 'destination-in'; cg.drawImage(msk, 0, 0);
  cg.globalCompositeOperation = 'source-over';
  lg.drawImage(col, 0, 0);
  if (endF > 0) { lg.globalAlpha = endF; lg.drawImage(to, 0, 0); lg.globalAlpha = 1; }   // 浸透：整团回到原色
  lg.globalCompositeOperation = 'destination-in';
  const [om, og] = scratch('mr_om', W, H);
  og.filter = 'blur(1px)'; og.fillStyle = '#000'; og.fill(outer); og.filter = 'none';
  lg.drawImage(om, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  // 合成：旧画面 → 湿晕 → 墨团 → 水渍边。边都用"填充 − 内缩填充"做，只沿墨团并集的外沿出现
  const live = env * (1 - endF);
  const ring = (name, alpha, insetH, blurPx, outside) => {
    const [rc, rg] = scratch(name, W, H);
    if (outside) rg.filter = `blur(${blurPx}px)`;
    rg.fillStyle = `rgba(10,11,14,${alpha})`; rg.fill(outer);
    rg.filter = outside ? 'none' : `blur(${blurPx}px)`;
    rg.globalCompositeOperation = 'destination-out'; rg.fillStyle = '#000';
    rg.fill(outside ? outer : blob(insetH));
    rg.filter = 'none'; rg.globalCompositeOperation = 'source-over';
    return rc;
  };
  ctx.save();
  ctx.drawImage(from, 0, 0);
  if (live > 0) ctx.drawImage(ring('mr_halo', 0.3 * live, 0, Math.round(0.02 * H), true), 0, 0);
  ctx.drawImage(lay, 0, 0);
  if (live > 0) {
    ctx.drawImage(ring('mr_rim2', 0.32 * live, 0.06, Math.round(0.03 * H), false), 0, 0);
    ctx.drawImage(ring('mr_rim', 0.85 * live, 0.012, Math.max(1, Math.round(0.004 * H)), false), 0, 0);
  }
  const fin = smooth(0.97, 1, p);
  if (fin > 0) { ctx.globalAlpha = fin; ctx.filter = 'none'; ctx.drawImage(to, 0, 0); }
  ctx.restore();
}

module.exports = { juanzhou, shuaijing, moran, cover, setCanvasFactory };
