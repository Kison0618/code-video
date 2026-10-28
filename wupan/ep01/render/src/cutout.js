// 抠图：白底的版画/产品照 → 剪影 + 外扩一圈锯齿白纸边（拼贴剪纸感）。结果缓存到 render/.cache，渲染进程直接读
//   const c = CUT.get('eng_dog')            → { img, w, h, box:[x0,y0,x1,y1] }（图像像素）
//   CUT.place(ctx, c, x, y, h, o)           → 剪影底边中点放在 (x,y)，高 h；o: alpha, flip, rot, shadow, anchor:[u,v]
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./core');
const { Canvas, noise1 } = K;
const { Image } = require('skia-canvas');
const P = require('./paper');

const ASSETS = path.join(__dirname, '..', 'assets'), CACHE = path.join(__dirname, '..', '.cache');
const DEF = { th: 222, rim: 7, photo: false, tint: 0.08 };

function load(file) { const im = new Image(); im.src = fs.readFileSync(file); return im; }

function build(name, o) {
  let img = load(path.join(ASSETS, name + '.png'));
  if (Math.max(img.width, img.height) > 2400) {          // 大图先缩一半，缓存和渲染都轻一些
    const c = new Canvas(img.width >> 1, img.height >> 1); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); img = P.bitmap(c);
  }
  const IW = img.width, IH = img.height, SW = IW >> 1, SH = IH >> 1;
  const cv = new Canvas(SW, SH), x = cv.getContext('2d'); x.drawImage(img, 0, 0, SW, SH);
  const d = x.getImageData(0, 0, SW, SH).data, N = SW * SH;
  const dark = new Uint8Array(N);
  for (let i = 0; i < N; i++) dark[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) < o.th ? 1 : 0;
  const bar = new Uint8Array(N), R = 2;
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) if (dark[j * SW + i])
    for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < SW && jj < SH) bar[jj * SW + ii] = 1; }
  const ext = new Uint8Array(N), st = [];
  const push = i => { if (!ext[i] && !bar[i]) { ext[i] = 1; st.push(i); } };
  for (let i = 0; i < SW; i++) { push(i); push((SH - 1) * SW + i); }
  for (let j = 0; j < SH; j++) { push(j * SW); push(j * SW + SW - 1); }
  while (st.length) { const i = st.pop(), xx = i % SW, yy = (i / SW) | 0; if (xx > 0) push(i - 1); if (xx < SW - 1) push(i + 1); if (yy > 0) push(i - SW); if (yy < SH - 1) push(i + SW); }
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = ext[i] ? 1e9 : 0;
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const k = j * SW + i; let v = dist[k];
    if (i > 0) v = Math.min(v, dist[k - 1] + 1); if (j > 0) v = Math.min(v, dist[k - SW] + 1); if (i > 0 && j > 0) v = Math.min(v, dist[k - SW - 1] + 1.414); if (i < SW - 1 && j > 0) v = Math.min(v, dist[k - SW + 1] + 1.414); dist[k] = v; }
  for (let j = SH - 1; j >= 0; j--) for (let i = SW - 1; i >= 0; i--) { const k = j * SW + i; let v = dist[k];
    if (i < SW - 1) v = Math.min(v, dist[k + 1] + 1); if (j < SH - 1) v = Math.min(v, dist[k + SW] + 1); if (i < SW - 1 && j < SH - 1) v = Math.min(v, dist[k + SW + 1] + 1.414); if (i > 0 && j < SH - 1) v = Math.min(v, dist[k + SW - 1] + 1.414); dist[k] = v; }
  const mk = f => { const c = new Canvas(SW, SH), y = c.getContext('2d'), im = y.createImageData(SW, SH); for (let i = 0; i < N; i++) im.data[i * 4 + 3] = f(i) ? 255 : 0; y.putImageData(im, 0, 0); return c; };
  const inner = mk(i => !ext[i]);
  const paper = mk(i => { const xx = i % SW, yy = (i / SW) | 0; return dist[i] <= o.rim + 3.5 * noise1(xx * 0.09 + yy * 0.031, 3) + 1.5 * noise1(yy * 0.23 + xx * 0.05, 8); });
  let x0 = SW, y0 = SH, x1 = 0, y1 = 0;
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) if (!ext[j * SW + i]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  const out = new Canvas(IW, IH), z = out.getContext('2d');
  z.drawImage(paper, 0, 0, IW, IH);
  z.globalCompositeOperation = 'source-in'; z.fillStyle = o.photo ? '#fbf8f0' : '#f7efdc'; z.fillRect(0, 0, IW, IH);
  const ink = new Canvas(IW, IH), y = ink.getContext('2d');
  y.drawImage(img, 0, 0); y.globalCompositeOperation = 'destination-in'; y.drawImage(inner, 0, 0, IW, IH);
  z.globalCompositeOperation = o.photo ? 'source-over' : 'multiply'; z.drawImage(P.bitmap(ink), 0, 0);
  if (o.tint) { z.globalCompositeOperation = 'source-atop'; z.fillStyle = `rgba(120,70,20,${o.tint})`; z.fillRect(0, 0, IW, IH); }
  // 裁掉空白：只保留剪影 + 纸边
  const pad = (o.rim + 8) * 2, bx = Math.max(0, x0 * 2 - pad), by = Math.max(0, y0 * 2 - pad), bw = Math.min(IW, x1 * 2 + pad) - bx, bh = Math.min(IH, y1 * 2 + pad) - by;
  const crop = new Canvas(bw, bh); crop.getContext('2d').drawImage(P.bitmap(out), -bx, -by);
  return { cv: crop, box: [x0 * 2 - bx, y0 * 2 - by, x1 * 2 - bx, y1 * 2 - by] };
}

const mem = new Map();
function get(name, opt = {}) {
  if (mem.has(name)) return mem.get(name);
  const o = { ...DEF, ...opt };
  fs.mkdirSync(CACHE, { recursive: true });
  const png = path.join(CACHE, `${name}_r${o.rim}_t${o.th}${o.photo ? 'p' : ''}.png`), meta = png + '.json';
  const src = path.join(ASSETS, name + '.png');
  let res;
  if (fs.existsSync(png) && fs.existsSync(meta) && fs.statSync(png).mtimeMs > fs.statSync(src).mtimeMs) {
    const im = load(png), cv = new Canvas(im.width, im.height); cv.getContext('2d').drawImage(im, 0, 0);
    res = { img: P.bitmap(cv), box: JSON.parse(fs.readFileSync(meta, 'utf8')) };
  } else {
    const b = build(name, o);
    const tmp = png + '.' + process.pid + '.tmp';
    b.cv.toFileSync(tmp, { format: 'png' }); fs.renameSync(tmp, png);
    fs.writeFileSync(meta, JSON.stringify(b.box));
    res = { img: P.bitmap(b.cv), box: b.box };
  }
  res.w = res.img.width; res.h = res.img.height; res.name = name;
  mem.set(name, res);
  return res;
}

// 摆放：anchor 是剪影框内的点（默认底边中点）放到 (x,y)；h = 剪影框高度（像素）
function place(ctx, c, x, y, h, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003) return;
  const [x0, y0, x1, y1] = c.box, s = h / (y1 - y0);
  const [u, v] = o.anchor || [0.5, 1];
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.flip ? -s : s, s);
  ctx.translate(-(x0 + (x1 - x0) * u), -(y0 + (y1 - y0) * v));
  if (o.shadow !== false) { ctx.shadowColor = `rgba(60,35,10,${0.42 * (o.shadow || 1)})`; ctx.shadowBlur = 20 / s * 0.5; ctx.shadowOffsetX = 6 / s * 0.5; ctx.shadowOffsetY = 10 / s * 0.5; }
  if (o.clip) o.clip(ctx);
  ctx.drawImage(c.img, 0, 0);
  ctx.restore();
}
// 框内某点 → 屏幕坐标（和 place 用同一套参数）
function pt(c, x, y, h, u, v, o = {}) {
  const [x0, y0, x1, y1] = c.box, s = h / (y1 - y0), [au, av] = o.anchor || [0.5, 1];
  const dx = (u - au) * (x1 - x0) * s * (o.flip ? -1 : 1), dy = (v - av) * (y1 - y0) * s;
  const r = o.rot || 0;
  return [x + dx * Math.cos(r) - dy * Math.sin(r), y + dx * Math.sin(r) + dy * Math.cos(r)];
}
const width = (c, h) => (c.box[2] - c.box[0]) * h / (c.box[3] - c.box[1]);
const has = name => fs.existsSync(path.join(ASSETS, name + '.png'));
module.exports = { get, place, pt, width, has, load, ASSETS };
if (require.main === module) {
  for (const n of process.argv.slice(2)) { const t0 = Date.now(); const c = get(n); console.log(n, c.w, c.h, c.box, Date.now() - t0, 'ms'); }
}
