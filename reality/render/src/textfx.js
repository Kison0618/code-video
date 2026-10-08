// 文字特效：解码（乱码逐字锁定）、砸入（放大落下 + 落点光晕）、故障（错位分色）、粒子聚字、划线
// 所有效果都只由时间 t 决定
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, smooth, easeOut, easeOutExpo, easeInOut, glow, text, measure, mulberry32, hash } = K;

const GLYPHS = '01アイウエオカキクケコ#%&*+=<>/\\|λΣΔ∞≠≈人心恶真假爱恨立场筛选';
function colorsFor(str, hl, base) {
  const chars = [...str], cols = chars.map(() => base);
  for (const [w, c] of Object.entries(hl || {})) {
    let i = str.indexOf(w);
    while (i >= 0) { const s = [...str.slice(0, i)].length; for (let k = 0; k < [...w].length; k++) cols[s + k] = c; i = str.indexOf(w, i + w.length); }
  }
  return cols;
}
// 每个字的位置
function layout(ctx, str, st, x, align) {
  const chars = [...str], ws = chars.map(ch => measure(ctx, ch, st)), sp = (st.spacing || 0) * st.size;
  const total = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  return chars.map((ch, i) => { const r = { ch, x: cx, w: ws[i] }; cx += ws[i] + sp; return r; });
}
const fade = (t, out) => (out == null ? 1 : 1 - smooth((t - out) / 0.5));

// 英文小字
function sub(ctx, t, en, x, y, t0, out, a = 0.85) {
  if (!en) return;
  const al = clamp((t - t0) / 0.6) * fade(t, out) * a;
  text(ctx, en, x, y, { family: 'Garamond', style: 'italic', size: 21, color: C.dim, alpha: al, align: 'center', spacing: 0.04 });
}

// 解码：每个字先是乱跳的符号，从左到右依次锁定成真字；锁定瞬间亮一下
function decode(ctx, t, str, o = {}) {
  const { t0 = 0, x = W / 2, y = H / 2, size = 48, color = C.bone, hl = {}, cps = 16, out = null, align = 'center', weight = 500, en = '', family = 'Song', cursor = true } = o;
  if (t < t0) return;
  const f = fade(t, out); if (f <= 0) return;
  const st = { family, size, weight, spacing: 0.12 };
  const L = layout(ctx, str, st, x, align), cols = colorsFor(str, hl, color);
  let last = null;
  L.forEach((c, i) => {
    const tl = t0 + 0.25 + i / cps;                   // 锁定时间
    const tsh = t0 + i / (cps * 2.2);                 // 开始出现乱码
    if (t < tsh) return;
    if (t < tl) {
      const g = GLYPHS[Math.floor(hash(i * 7.3 + Math.floor(t * 24)) * GLYPHS.length)];
      text(ctx, g, c.x + c.w / 2, y, { family: /[一-鿿]/.test(g) ? 'Song' : 'Mono', size: size * 0.8, color: C.dim, alpha: 0.6 * f, align: 'center' });
    } else {
      const k = t - tl;
      text(ctx, c.ch, c.x, y, { ...st, color: cols[i], alpha: f, align: 'left' });
      if (k < 0.25) glow(ctx, c.x + c.w / 2, y - size * 0.35, size * 0.9, cols[i] === color ? C.white : cols[i], 0.35 * (1 - k / 0.25) * f);
      last = c;
    }
  });
  // 光标
  if (cursor && f > 0) {
    const done = t > t0 + 0.25 + L.length / cps;
    const c = last || L[0];
    const cx = last ? c.x + c.w + 6 : c.x;
    if (!done || Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = rgba(C.gold, 0.8 * f * (done ? smooth(1 - (t - t0 - 0.25 - L.length / cps) / 2) : 1)); ctx.fillRect(cx, y - size * 0.8, size * 0.08, size * 0.9); }
  }
  sub(ctx, t, en, x, y + size * 0.9, t0 + 0.25 + L.length / cps, out);
}

// 砸入：每个字从放大的虚影落到原位，落点一圈光
function slam(ctx, t, str, o = {}) {
  const { t0 = 0, x = W / 2, y = H / 2, size = 64, color = C.bone, hl = {}, stagger = 0.045, out = null, align = 'center', weight = 700, en = '', family = 'Song', ghost = true } = o;
  if (t < t0) return;
  const f = fade(t, out); if (f <= 0) return;
  const st = { family, size, weight, spacing: 0.1 };
  const L = layout(ctx, str, st, x, align), cols = colorsFor(str, hl, color);
  L.forEach((c, i) => {
    const k = (t - t0 - i * stagger) / 0.22;
    if (k <= 0) return;
    const e = easeOutExpo(clamp(k));
    const s = lerp(2.2, 1, e), a = clamp(k * 2) * f;
    const cx = c.x + c.w / 2, cy = y - size * 0.35;
    if (ghost && k < 1) for (let g = 1; g <= 3; g++) {
      const sg = s + g * 0.12 * (1 - e);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sg, sg); ctx.translate(-cx, -cy);
      text(ctx, c.ch, c.x, y, { ...st, color: cols[i], alpha: a * 0.12 * (1 - e), align: 'left' });
      ctx.restore();
    }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
    text(ctx, c.ch, c.x, y, { ...st, color: cols[i], alpha: a, align: 'left' });
    ctx.restore();
    if (k >= 1 && k < 2.5) glow(ctx, cx, cy, size * 1.4, cols[i], 0.3 * (1 - (k - 1) / 1.5) * f);
  });
  sub(ctx, t, en, x, y + size * 0.85, t0 + L.length * stagger + 0.2, out);
}

// 故障：分色错位 + 横向切片抖动，随时间稳定下来；之后偶尔再闪一下
function glitch(ctx, t, str, o = {}) {
  const { t0 = 0, x = W / 2, y = H / 2, size = 56, color = C.red, out = null, align = 'center', weight = 700, en = '', family = 'Song', settle = 0.5 } = o;
  if (t < t0) return;
  const f = fade(t, out); if (f <= 0) return;
  const k = t - t0;
  let amt = Math.exp(-k / settle * 3);
  const tick = Math.floor(t * 20);
  if (hash(tick * 3.1 + 7) < 0.06) amt = Math.max(amt, 0.35);   // 偶尔的复发
  const st = { family, size, weight, spacing: 0.1, align };
  const a = clamp(k / 0.08) * f;
  if (amt > 0.02) {
    const dx = amt * 18 * (hash(tick) - 0.5) * 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    text(ctx, str, x - 6 * amt - dx, y, { ...st, color: [255, 40, 60], alpha: 0.6 * a });
    text(ctx, str, x + 6 * amt + dx, y, { ...st, color: [60, 200, 255], alpha: 0.45 * a });
    ctx.restore();
    // 横向切片
    for (let s = 0; s < 4; s++) {
      const h = size * (0.08 + 0.15 * hash(tick * 1.7 + s)), yy = y - size * (0.9 * hash(tick * 2.3 + s * 5));
      ctx.save(); ctx.beginPath(); ctx.rect(0, yy, W, h); ctx.clip();
      text(ctx, str, x + (hash(tick + s * 9) - 0.5) * 60 * amt, y, { ...st, color, alpha: a });
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = 1 - amt * 0.6; text(ctx, str, x, y, { ...st, color, alpha: a }); ctx.restore();
  } else text(ctx, str, x, y, { ...st, color, alpha: a });
  sub(ctx, t, en, x, y + size * 0.85, t0 + 0.3, out);
}

// 粒子聚字：把字栅格化成点，粒子从 from(i) 飞来组成字；落定后清晰的字淡入
const SAMPLE = new Map();
function sampleText(str, size, family, weight, step) {
  const key = [str, size, family, weight, step].join('|');
  if (SAMPLE.has(key)) return SAMPLE.get(key);
  const cv = new Canvas(W, 400), x = cv.getContext('2d');
  x.font = `${weight} ${size}px ${family}`; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.fillText(str, W / 2, 200);
  const d = x.getImageData(0, 0, W, 400).data, pts = [];
  const r = mulberry32(str.length * 13 + size);
  for (let yy = 0; yy < 400; yy += step) for (let xx = 0; xx < W; xx += step) if (d[(yy * W + xx) * 4 + 3] > 128) pts.push([xx - W / 2 + (r() - 0.5) * step, yy - 200 + (r() - 0.5) * step]);
  SAMPLE.set(key, pts);
  return pts;
}
function particleText(ctx, t, str, o = {}) {
  const { t0 = 0, x = W / 2, y = H / 2, size = 90, color = C.gold, family = 'Song', weight = 700, from = null, dur = 1.6, out = null, en = '', step = 4, solid = true } = o;
  if (t < t0) return;
  const f = fade(t, out); if (f <= 0) return;
  const pts = sampleText(str, size, family, weight, step);
  const r = mulberry32(str.length * 7 + 3);
  const segs = [];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(color, 0.9 * f);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const delay = r() * 0.5, u = easeInOut(clamp((t - t0 - delay) / dur));
    const src = from ? from(i, r) : [x + (r() - 0.5) * W * 1.4, y + (r() - 0.5) * H * 1.4];
    const tx = x + p[0], ty = y + p[1] - size * 0.05;
    const sw = (1 - u) * 30 * Math.sin(i + t * 3);
    const px = lerp(src[0], tx, u) + sw, py = lerp(src[1], ty, u) + (1 - u) * 20 * Math.cos(i * 1.3 + t * 2);
    const shimmer = u >= 1 ? Math.sin(t * 4 + i) * 0.6 : 0;
    ctx.rect(px - 1.1, py - 1.1 + shimmer, 2.2, 2.2);
  });
  ctx.fill();
  ctx.restore();
  const settled = clamp((t - t0 - dur - 0.4) / 0.6);
  if (solid && settled > 0) {
    text(ctx, str, x, y + size * 0.36, { family, size, weight, color, alpha: settled * 0.85 * f, align: 'center' });
    glow(ctx, x, y, size * 3, color, 0.08 * settled * f);
  }
  sub(ctx, t, en, x, y + size * 1.05, t0 + dur + 0.3, out);
}

// 划线：从左到右划过一行字（删除线 / 下划线）
function strike(ctx, t, t0, x0, x1, y, col = C.red, dur = 0.35, w = 4) {
  if (t < t0) return;
  const u = easeOut(clamp((t - t0) / dur));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, u), y); ctx.stroke();
  ctx.restore();
  glow(ctx, lerp(x0, x1, u), y, 30, col, 0.6 * (1 - clamp((t - t0 - dur) / 0.3)));
}

module.exports = { decode, slam, glitch, particleText, strike, layout, sub };
