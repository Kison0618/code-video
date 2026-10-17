// 后期：拍扁、泛光（原片没有暗角和颗粒，所以这里也不加）
'use strict';
const K = require('./core');
const { W, H, Canvas, clamp } = K;
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
function bake(ctx) {
  flatten(ctx.canvas, BASE);
  ctx.reset();
  ctx.drawImage(BASE, 0, 0);
  return BASE;
}

// 泛光：只让亮部（光团、白芯、闪电）往外渗，1/4 与 1/12 分辨率两级
const S1 = 4, S2 = 12;
const b1 = new Canvas(W / S1, H / S1), c1 = b1.getContext('2d');
const b2 = new Canvas(W / S2, H / S2), c2 = b2.getContext('2d');
const b1f = new Canvas(W / S1, H / S1);
function bloom(ctx, amt = 1, base = BASE) {
  if (amt <= 0.01) return;
  c1.reset(); c2.reset();
  c1.filter = 'contrast(3) brightness(0.7) blur(3px)';
  c1.drawImage(base, 0, 0, W / S1, H / S1);
  flatten(b1, b1f);
  c2.filter = 'blur(4px)';
  c2.drawImage(b1f, 0, 0, W / S2, H / S2);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(0.5 * amt); ctx.drawImage(b1f, 0, 0, W, H);
  ctx.globalAlpha = clamp(0.7 * amt); ctx.drawImage(b2, 0, 0, W, H);
  ctx.restore();
}
function black(ctx, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
module.exports = { flatten, bake, bloom, black };
