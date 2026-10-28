// 纸：暖米色底、纸纹贴图、剪纸工具（锯齿边、带投影的纸片、内凹阴影）
'use strict';
const K = require('./core');
const { W, H, Canvas, mulberry32, noise1 } = K;
const { ImageData, Path2D } = require('skia-canvas');

const BG = '#f8efdd';   // 叠上纸纹（multiply）后约为 #efe6d4

// 位图化：skia-canvas 的画布互画会重放指令，静态层先拍成像素
function bitmap(cv) {
  const buf = cv.toBufferSync('raw');
  const out = new Canvas(cv.width, cv.height);
  out.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buf.buffer, buf.byteOffset, buf.byteLength), cv.width, cv.height), 0, 0);
  return out;
}

// 纸纹：细颗粒 + 纤维 + 大块深浅（multiply 叠加用，接近白色）
function makeTexture(w, h, seed = 3) {
  const cv = new Canvas(w, h), x = cv.getContext('2d');
  const img = x.createImageData(w, h), d = img.data, r = mulberry32(seed);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4;
    const blot = noise1(i * 0.004 + noise1(j * 0.003, 5) * 2, 2) * 6 + noise1(j * 0.006, 9) * 4;
    const v = 244 + blot + (r() - 0.5) * 16;
    d[k] = v; d[k + 1] = v - 2; d[k + 2] = v - 7; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // 纤维：短而淡的弧线
  x.lineCap = 'round';
  for (let n = 0; n < 1400; n++) {
    const px = r() * w, py = r() * h, a = r() * Math.PI, L = 8 + r() * 30;
    x.strokeStyle = r() < 0.5 ? `rgba(120,95,60,${0.05 + r() * 0.07})` : `rgba(255,255,250,${0.12 + r() * 0.15})`;
    x.lineWidth = 0.6 + r() * 0.9;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * L * 0.5 + (r() - 0.5) * 6, py + Math.sin(a) * L * 0.5 + (r() - 0.5) * 6, px + Math.cos(a) * L, py + Math.sin(a) * L);
    x.stroke();
  }
  return bitmap(cv);
}
const TEX = makeTexture(W, H);

// 沿折线加密并加剪刀抖动（剪纸边）
function jag(pts, amp = 3, step = 14, seed = 1, close = true) {
  const r = mulberry32(seed), out = [];
  const n = pts.length, segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.round(L / step));
    const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    for (let k = 0; k < m; k++) {
      const u = k / m, o = (r() - 0.5) * 2 * amp;
      out.push([x0 + (x1 - x0) * u + nx * o, y0 + (y1 - y0) * u + ny * o]);
    }
  }
  if (!close) out.push(pts[n - 1]);
  return out;
}
function poly(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
function ellipsePts(cx, cy, rx, ry, n = 64, rot = 0) {
  const o = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, x = rx * Math.cos(a), y = ry * Math.sin(a); o.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return o;
}
// 带投影的纸片
function piece(ctx, path, fill, sh = {}) {
  ctx.save();
  ctx.shadowColor = sh.color || 'rgba(60,35,10,0.42)';
  ctx.shadowBlur = sh.blur == null ? 12 : sh.blur;
  ctx.shadowOffsetX = sh.dx || 0; ctx.shadowOffsetY = sh.dy == null ? 6 : sh.dy;
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.restore();
}
// 洞：先填洞内颜色，再让洞外的纸往洞里投影（剪纸洞的立体感）
function hole(ctx, path, fill, sh = {}) {
  ctx.save();
  ctx.fillStyle = fill; ctx.fill(path);
  ctx.clip(path);
  const big = new Path2D(); big.rect(-1e4, -1e4, 3e4, 3e4); big.addPath(path);
  ctx.shadowColor = sh.color || 'rgba(30,15,5,0.65)';
  ctx.shadowBlur = sh.blur == null ? 22 : sh.blur; ctx.shadowOffsetY = sh.dy == null ? 12 : sh.dy; ctx.shadowOffsetX = sh.dx || 0;
  ctx.fillStyle = '#000';
  ctx.fill(big, 'evenodd');
  ctx.restore();
}

module.exports = { BG, TEX, makeTexture, bitmap, jag, poly, ellipsePts, piece, hole };
