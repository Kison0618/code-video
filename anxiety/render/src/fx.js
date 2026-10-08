// 后期：泛光、淡入淡出、暗角、颗粒
'use strict';
const K = require('./core');
const { W, H, Canvas, clamp, mulberry32 } = K;
const { ImageData } = require('skia-canvas');

// skia-canvas 是"延迟绘制"：把一张画布画进另一张，会把整套绘制指令重新执行一遍。
// 后期要反复读画面，所以先把它"拍扁"成像素位图，之后的复制都只是贴图。
function flatten(src, dst) {
  const buf = src.toBufferSync('raw');
  const dx = dst.getContext('2d');
  dx.reset();
  dx.putImageData(new ImageData(new Uint8ClampedArray(buf.buffer, buf.byteOffset, buf.byteLength), src.width, src.height), 0, 0);
  return dst;
}
const BASE = new Canvas(W, H);
// 把 ctx 当前画面拍扁，并让 ctx 只剩一次贴图（后续继续往上画）
function bake(ctx) {
  flatten(ctx.canvas, BASE);
  ctx.reset();
  ctx.drawImage(BASE, 0, 0);
  return BASE;
}

// —— 泛光：1/4 与 1/12 分辨率两级 ——
const S1 = 4, S2 = 12;
const b1 = new Canvas(W / S1, H / S1), c1 = b1.getContext('2d');
const b2 = new Canvas(W / S2, H / S2), c2 = b2.getContext('2d');
const b1f = new Canvas(W / S1, H / S1);
function bloom(ctx, amt = 1, base = BASE) {
  if (amt <= 0.01) return;
  c1.reset(); c2.reset();
  c1.filter = 'contrast(2.2) brightness(0.85) blur(3px)';
  c1.drawImage(base, 0, 0, W / S1, H / S1);
  flatten(b1, b1f);
  c2.filter = 'blur(4px)';
  c2.drawImage(b1f, 0, 0, W / S2, H / S2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(0.45 * amt); ctx.drawImage(b1f, 0, 0, W, H);
  ctx.globalAlpha = clamp(0.6 * amt); ctx.drawImage(b2, 0, 0, W, H);
  ctx.restore();
}

function black(ctx, a) {
  if (a <= 0.003) return;
  ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`;
  ctx.fillRect(0, 0, W, H);
}

// —— 暗角与颗粒 ——
const VIG = (() => {
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.8)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return cv;
})();
const GRAIN = (() => {
  const r = mulberry32(9), out = [];
  for (let n = 0; n < 6; n++) {
    const S = 256, cv = new Canvas(S, S), x = cv.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    for (let i = 0; i < S * S; i++) { const v = r() * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0); out.push(cv);
  }
  return out;
})();
function finish(ctx, frame, vig = 1) {
  ctx.save();
  ctx.globalAlpha = clamp(vig);
  ctx.drawImage(VIG, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.06;
  const g = GRAIN[frame % GRAIN.length], ox = (frame * 37) % 256, oy = (frame * 91) % 256;
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(g, x, y);
  ctx.restore();
}

module.exports = { flatten, bake, bloom, black, finish };
