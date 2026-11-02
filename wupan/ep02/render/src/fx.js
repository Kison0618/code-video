// 后期：纸纹叠加、颗粒、轻暗角、黑场
'use strict';
const K = require('./core');
const { W, H, Canvas, clamp, mulberry32 } = K;
const { ImageData } = require('skia-canvas');
const P = require('./paper');

function flatten(src, dst) {
  const buf = src.toBufferSync('raw');
  const dx = dst.getContext('2d');
  dx.reset();
  dx.putImageData(new ImageData(new Uint8ClampedArray(buf.buffer, buf.byteOffset, buf.byteLength), src.width, src.height), 0, 0);
  return dst;
}

function black(ctx, a) {
  if (a <= 0.003) return;
  ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`;
  ctx.fillRect(0, 0, W, H);
}

const VIG = P.bitmap((() => {
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.15);
  g.addColorStop(0, 'rgba(60,35,10,0)'); g.addColorStop(1, 'rgba(60,35,10,0.32)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return cv;
})());
// 颗粒：一张固定的全屏颗粒（静止，不逐帧变化；v1 逐帧换颗粒让码率涨到 59 Mbps）
const GRAIN = (() => {
  const r = mulberry32(9), S = 256, cv = new Canvas(S, S), x = cv.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  for (let i = 0; i < S * S; i++) { const v = r() * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  const full = new Canvas(W, H), y = full.getContext('2d');
  for (let yy = 0; yy < H; yy += S) for (let xx = 0; xx < W; xx += S) y.drawImage(cv, xx, yy);
  return P.bitmap(full);
})();
// 收尾：整屏纸纹（multiply）+ 暗角 + 静止颗粒
function finish(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.85;
  ctx.drawImage(P.TEX, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(VIG, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.06;
  ctx.drawImage(GRAIN, 0, 0);
  ctx.restore();
}

module.exports = { flatten, black, finish };
