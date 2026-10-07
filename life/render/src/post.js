// 后期：两级泛光（bloom）+ 前景焦外光斑（bokeh），让高光有"发光体"的质感
'use strict';
const K = require('./core');
const { W, H, Canvas, mulberry32, smooth, prog, glow, C, mix } = K;

const S1 = 4, S2 = 12;
const small1 = new Canvas(W / S1, H / S1), c1 = small1.getContext('2d');
const small2 = new Canvas(W / S2, H / S2), c2 = small2.getContext('2d');

// 泛光强度随段落变化：铺满画面的段落（图灵斑纹、细胞）减弱，避免整屏发白
function bloomAmount(t) {
  const full = smooth(prog(t, 203, 207)) * (1 - smooth(prog(t, 222, 226)))
    + smooth(prog(t, 286, 289)) * (1 - smooth(prog(t, 300, 303)));
  return 1 - 0.6 * Math.min(1, full);
}

function bloom(ctx, t, boost = 0) {
  const amt = bloomAmount(t) * (1 + boost);
  if (amt <= 0.01) return;
  const src = ctx.canvas;
  // skia-canvas 会累积绘制指令，小画布每帧都要 reset，否则越渲越慢、内存一直涨
  c1.reset(); c2.reset();
  // 第一级：1/4 分辨率，提亮高光、压掉暗部后模糊——贴着发光体的紧光晕
  c1.filter = 'contrast(2.4) brightness(0.9) blur(3px)';
  c1.drawImage(src, 0, 0, W / S1, H / S1);
  // 第二级：1/12 分辨率，大范围柔光
  c2.filter = 'blur(4px)';
  c2.drawImage(small1, 0, 0, W / S2, H / S2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = Math.min(1, 0.42 * amt); ctx.drawImage(small1, 0, 0, W, H);
  ctx.globalAlpha = Math.min(1, 0.55 * amt); ctx.drawImage(small2, 0, 0, W, H);
  ctx.restore();
}

// 焦外光斑：很少、很大、很淡，缓慢漂移，制造镜头前的景深
const rnd = mulberry32(2027);
const MOTES = Array.from({ length: 22 }, () => ({
  x: rnd() * W, y: rnd() * H, r: 30 + Math.pow(rnd(), 2) * 90, a: 0.03 + rnd() * 0.05,
  vx: (rnd() - 0.5) * 9, vy: -3 - rnd() * 6, ph: rnd() * 6.283, warm: rnd(),
}));
function bokeh(ctx, t) {
  // 片头片尾黑场、图灵/细胞铺满段落时收起
  const on = smooth(prog(t, 3, 8)) * (1 - smooth(prog(t, 349, 351))) * (0.4 + 0.6 * bloomAmount(t));
  if (on <= 0.01) return;
  for (const m of MOTES) {
    const x = ((m.x + m.vx * t) % (W + 400) + W + 400) % (W + 400) - 200;
    const y = ((m.y + m.vy * t) % (H + 400) + H + 400) % (H + 400) - 200;
    const a = m.a * on * (0.7 + 0.3 * Math.sin(t * 0.4 + m.ph));
    glow(ctx, x, y, m.r, mix(C.gold, C.ivory, m.warm * 0.6), a);
  }
}
module.exports = { bloom, bokeh };
