// ep02 前 1 分钟的小零件：生成素材的取用/占位、马克笔、打字机字、回形针、场记板、胶片、支票、工牌、通缉令、
// 裁缝盒、袖口金杠、曼哈顿街道图、日历、讲台灯光、旧报纸版面、牢墙刻痕、车票、证件框
'use strict';
const path = require('path');
const K = require('./core');
const { W, H, Canvas, clamp, lerp, smooth, prog, easeOut, easeInOut } = K;
const { Path2D } = require('skia-canvas');
const P = require('./paper');
const CUT = require('./cutout');
const X = require('./kit');

const INK = '#231b15', YEL = '#f4c63d', RUST = '#9e3b26', KRAFT = '#d9bf8f', CREAM = '#fbf6ea';

// —— 生成素材：render/assets/gen/Gxx.png。缺图时返回 null，画占位 ——
const has = n => CUT.has('gen/' + n);
const cut = (n, o = {}) => (has(n) ? CUT.get('gen/' + n, { th: 'auto', ...o }) : null);
const MISSING = new Set();
function placeholder(ctx, name, x, y, w, h, o = {}) {
  MISSING.add(name);
  const [u, v] = o.anchor || [0.5, 1];
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  ctx.translate(x - w * u, y - h * v);
  P.piece(ctx, P.poly(P.jag([[0, 0], [w, 0], [w, h], [0, h]], 3, 16, 7)), '#efe3c8', { blur: 14, dy: 6 });
  ctx.setLineDash([16, 12]); ctx.strokeStyle = 'rgba(90,70,50,0.7)'; ctx.lineWidth = 4; ctx.strokeRect(14, 14, w - 28, h - 28); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(60,45,30,0.8)'; ctx.font = '700 36px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name + ' 占位', w / 2, h / 2 - 22); ctx.font = '500 30px Sans'; ctx.fillText(o.label || '', w / 2, h / 2 + 24);
  ctx.restore();
}
// 放一张生成的剪纸图：剪影框高 h，底边中点（或 anchor）放在 (x,y)
function put(ctx, n, x, y, h, o = {}) {
  const c = cut(n, o.cut);
  if (!c) return placeholder(ctx, n, x, y, o.pw || h * (o.ar || 0.75), h, o);
  if (o.sil) return silhouette(ctx, c, x, y, h, o);
  CUT.place(ctx, c, x, y, h, o);
}
const wOf = (n, h, ar = 0.75) => { const c = cut(n); return c ? CUT.width(c, h) : h * ar; };
const ptOf = (n, x, y, h, u, v, o = {}) => { const c = cut(n); return c ? CUT.pt(c, x, y, h, u, v, o) : [x + (u - 0.5) * h * (o.ar || 0.75), y - (1 - v) * h]; };
// 剪影（墨色填满，当背影/押送的人用）
const SIL = new Map();
function silhouette(ctx, c, x, y, h, o) {
  let s = SIL.get(c.name);
  if (!s) { const cv = new Canvas(c.w, c.h), z = cv.getContext('2d'); z.drawImage(c.img, 0, 0); z.globalCompositeOperation = 'source-in'; z.fillStyle = '#2a211a'; z.fillRect(0, 0, c.w, c.h); s = { ...c, img: P.bitmap(cv) }; SIL.set(c.name, s); }
  CUT.place(ctx, s, x, y, h, o);
}
// 整张图当撕边纸片（场景图、地图）
function sheet(ctx, n, x, y, w, h, o = {}) {
  if (!has(n)) return placeholder(ctx, n, x, y + h / 2, w, h, o);
  X.photoCard(ctx, 'gen/' + n, x, y, w, h, { sepia: false, border: 12, ...o });
}

// —— 马克笔 ——
function marker(ctx, pts, p, o = {}) {
  if (p <= 0.01) return;
  const q = K.partial(pts, easeOut(p)); if (q.length < 2) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = o.color || 'rgba(244,198,61,0.85)'; ctx.lineWidth = o.w || 34;
  ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [a, b] of q.slice(1)) ctx.lineTo(a, b); ctx.stroke();
  ctx.restore();
}
function ring(ctx, cx, cy, rx, ry, p, col = YEL, w = 10) {
  if (p <= 0.01) return;
  const pts = [];
  for (let k = 0; k <= 90; k++) { const u = k / 90, a = -2.4 + u * Math.PI * 2.2, r = 1 + 0.05 * Math.sin(u * 7) + u * 0.07; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  marker(ctx, pts, p, { color: col, w });
}
// 关键词纸条：hl = 黄底（马克笔标黄），pop 0..1
function tag(ctx, x, y, text, pop, o = {}) {
  return X.label(ctx, x, y, text, { pop, size: o.size || 58, bg: o.hl ? YEL : (o.bg || CREAM), color: o.color || INK, rot: o.rot, seed: o.seed || 5, font: o.font, weight: o.weight });
}
// 打字机字：n = 已打出的字数
function typed(ctx, str, x, y, size, n, o = {}) {
  const s = [...str].slice(0, Math.floor(n)).join('');
  ctx.save(); ctx.font = `${o.weight || 700} ${size}px ${o.font || 'Type'}`; ctx.fillStyle = o.color || '#2b2420'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
  if (o.align === 'center') { const full = ctx.measureText(str).width; ctx.textAlign = 'left'; ctx.fillText(s, x - full / 2, y); }
  else ctx.fillText(s, x, y);
  ctx.restore();
}
const typeN = (t, a, cps = 16) => Math.max(0, (t - a) * cps);

// —— 回形针 ——
function clip(ctx, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = '#8e9296'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(40,25,10,0.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(10, 120); ctx.lineTo(10, 18); ctx.arc(26, 18, 16, Math.PI, 0); ctx.lineTo(42, 140); ctx.arc(22, 140, 20, 0, Math.PI); ctx.lineTo(2, 40); ctx.stroke();
  ctx.restore();
}
// —— 场记板：中心 (x,y)，open 0..1（板子拍下），文字写在板身 ——
function clapper(ctx, x, y, w, open, lines, o = {}) {
  const h = w * 0.62;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0.08);
  P.piece(ctx, P.poly(P.jag([[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]], 2, 16, 21)), '#2a2420', { blur: 16, dy: 8 });
  ctx.strokeStyle = 'rgba(240,230,210,0.75)'; ctx.lineWidth = 3;
  for (let k = 1; k < lines.length + 1; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 18, k * h / (lines.length + 1) + 18); ctx.lineTo(w / 2 - 18, k * h / (lines.length + 1) + 18); ctx.stroke(); }
  ctx.fillStyle = '#f3ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  lines.forEach((s, k) => { ctx.font = `700 ${k ? 48 : 58}px ${k ? 'Num' : 'Serif'}`; ctx.fillText(s, 0, (k + 1) * h / (lines.length + 1) + 6); });
  // 拍板：斜条纹
  const sticks = a => { ctx.save(); ctx.translate(-w / 2, 0); ctx.rotate(a); P.piece(ctx, P.poly([[0, -h * 0.2], [w, -h * 0.2], [w, 0], [0, 0]]), '#f3ead6', { blur: 6, dy: 3 });
    ctx.beginPath(); ctx.rect(0, -h * 0.2, w, h * 0.2); ctx.clip(); ctx.fillStyle = '#2a2420';
    for (let k = -1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(k * w / 6, 0); ctx.lineTo(k * w / 6 + w / 12, -h * 0.2); ctx.lineTo(k * w / 6 + w / 6, -h * 0.2); ctx.lineTo(k * w / 6 + w / 12, 0); ctx.fill(); } ctx.restore(); };
  sticks(-0.42 * (1 - easeOut(open)));
  ctx.restore();
}
// —— 胶片条：中间一格放 inner(ctx, w, h)，格子中心 (x,y)，格宽 fw ——
function film(ctx, x, y, fw, inner, o = {}) {
  const fh = fw * H / W, gap = fw * 0.08, band = fw * 0.13, n = o.n || 2;
  ctx.save(); ctx.translate(x, y);
  const tw = (fw + gap) * (2 * n + 1) + gap;
  ctx.shadowColor = 'rgba(30,18,6,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#2b221c'; ctx.fillRect(-tw / 2, -fh / 2 - band, tw, fh + band * 2); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#efe4cc';
  for (let k = -tw / 2 + 18; k < tw / 2 - 20; k += fw * 0.11) { ctx.beginPath(); ctx.roundRect(k, -fh / 2 - band * 0.72, fw * 0.055, band * 0.44, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(k, fh / 2 + band * 0.28, fw * 0.055, band * 0.44, 4); ctx.fill(); }
  for (let k = -n; k <= n; k++) {
    const cx = k * (fw + gap);
    ctx.save(); ctx.beginPath(); ctx.rect(cx - fw / 2, -fh / 2, fw, fh); ctx.clip();
    if (k === 0) { ctx.translate(cx - fw / 2, -fh / 2); ctx.scale(fw / W, fh / H); inner(ctx); }
    else { ctx.fillStyle = '#d8c7a4'; ctx.fillRect(cx - fw / 2, -fh / 2, fw, fh); ctx.fillStyle = 'rgba(60,40,20,0.18)'; ctx.fillRect(cx - fw * 0.1, -fh * 0.3, fw * 0.2, fh * 0.6); }
    ctx.restore();
  }
  ctx.restore();
}
// —— 支票（代码画）：中心 (x,y)，宽 w；paid 0..1 盖章 ——
function cheque(ctx, x, y, w, o = {}) {
  const h = w * 0.42, a = o.alpha == null ? 1 : o.alpha; if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.s || 1, o.s || 1);
  P.piece(ctx, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 1.5, 18, o.seed || 3)), '#e4ecd6', { blur: 12, dy: 6 });
  ctx.strokeStyle = 'rgba(70,100,70,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  ctx.strokeStyle = 'rgba(70,100,70,0.28)'; ctx.lineWidth = 1.5;
  for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 14, -h / 2 + 18 + k * (h - 36) / 13); ctx.bezierCurveTo(-w / 6, -h / 2 + 8 + k * (h - 36) / 13, w / 6, -h / 2 + 30 + k * (h - 36) / 13, w / 2 - 14, -h / 2 + 18 + k * (h - 36) / 13); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(40,50,40,0.7)'; ctx.lineWidth = 3;
  [[-0.4, 0.05, 0.25], [-0.4, 0.28, 0.15]].forEach(([u, v, l]) => { ctx.beginPath(); ctx.moveTo(u * w, v * h); ctx.lineTo((u + 0.55) * w, v * h); ctx.stroke(); });
  ctx.beginPath(); ctx.roundRect(w * 0.2, -h * 0.08, w * 0.24, h * 0.22, 6); ctx.stroke();
  ctx.fillStyle = 'rgba(40,50,40,0.8)'; ctx.font = `700 ${w * 0.1}px Num`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('$', w * 0.22, h * 0.03);
  ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.33); ctx.bezierCurveTo(w * 0.18, h * 0.18, w * 0.24, h * 0.42, w * 0.38, h * 0.26); ctx.stroke();   // 签名
  if (o.paid > 0.01) X.stamp(ctx, -w * 0.12, -h * 0.12, 'PAID', o.paid, { size: w * 0.15, font: 'Num', rot: -0.2, seed: o.seed });
  ctx.restore();
}
// —— 工牌：中心 (x,y)；face(ctx, x, y, w, h) 画头像；prop(ctx, x, y, s) 画职业小图 ——
function badge(ctx, x, y, title, face, prop, o = {}) {
  const w = 330, h = 450;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  ctx.strokeStyle = '#6d5a44'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -h / 2 - 70); ctx.lineTo(0, -h / 2 + 8); ctx.stroke();
  P.piece(ctx, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 1.6, 16, o.seed || 4)), '#f6f0e2', { blur: 16, dy: 8 });
  ctx.fillStyle = o.band || '#2f4a63'; ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, 54);
  ctx.beginPath(); ctx.roundRect(-30, -h / 2 + 22, 60, 14, 7); ctx.fillStyle = '#f6f0e2'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 34, -h / 2 + 82, w - 68, 210); ctx.clip(); ctx.fillStyle = '#e9dfca'; ctx.fillRect(-w, -h, 2 * w, 2 * h); face(ctx, 0, -h / 2 + 292, 210); ctx.restore();
  ctx.strokeStyle = 'rgba(60,45,30,0.5)'; ctx.lineWidth = 2.5; ctx.strokeRect(-w / 2 + 34, -h / 2 + 82, w - 68, 210);
  ctx.fillStyle = INK; ctx.font = '700 44px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 44; while (ctx.measureText(title).width > w - 30) { fs -= 2; ctx.font = `700 ${fs}px Sans`; }
  ctx.fillText(title, 0, h / 2 - 102);
  if (prop) prop(ctx, w / 2 - 56, h / 2 - 40, 1);
  ctx.strokeStyle = 'rgba(60,45,30,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 34, h / 2 - 56 + k * 16); ctx.lineTo(-w / 2 + 34 + 130 - k * 30, h / 2 - 56 + k * 16); ctx.stroke(); }
  ctx.restore();
}
// —— 软木墙 + 图钉 ——
function cork(ctx) {
  ctx.fillStyle = '#b98f5e'; ctx.fillRect(0, 0, W, H);
  const r = K.mulberry32(77);
  for (let n = 0; n < 2600; n++) { ctx.fillStyle = r() < 0.5 ? `rgba(90,55,25,${0.12 + r() * 0.2})` : `rgba(230,190,140,${0.1 + r() * 0.15})`; ctx.fillRect(r() * W, r() * H, 2 + r() * 5, 2 + r() * 4); }
}
function pin(ctx, x, y, col = '#a8322a') {
  ctx.save(); ctx.shadowColor = 'rgba(30,15,5,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 16); g.addColorStop(0, '#f08a7a'); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// —— 裁缝纸盒：中心底 (x,y)，open 0..1 盖子掀起；inside(ctx) 画盒里的东西（盒口坐标系，原点在盒口中心）——
function tailorBox(ctx, x, y, w, open, inside) {
  const h = w * 0.36, d = w * 0.3;
  ctx.save(); ctx.translate(x, y);
  P.piece(ctx, P.poly([[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w / 2, 0]]), '#cfae7a', { blur: 22, dy: 12 });
  ctx.fillStyle = '#b8955f'; ctx.fillRect(-w / 2, -h, w, 14);
  ctx.save(); ctx.translate(0, -h); ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 - 40, -d); ctx.lineTo(-w / 2 + 40, -d); ctx.closePath();
  ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.clip(); ctx.translate(0, -d / 2); inside(ctx); ctx.restore();
  // 盖子：向上掀开并往后倒
  const q = easeInOut(open);
  ctx.save(); ctx.translate(0, -h - d * 0.5 - q * 330); ctx.rotate(-q * 0.12); ctx.globalAlpha = 1 - smooth(prog(q, 0.75, 1)) * 0.0;
  P.piece(ctx, P.poly([[-w / 2 - 14, -d * 0.55], [w / 2 + 14, -d * 0.55], [w / 2 + 14, d * 0.55], [-w / 2 - 14, d * 0.55]]), '#d9bb88', { blur: 24, dy: 14 });
  ctx.strokeStyle = 'rgba(120,80,40,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, 0); ctx.lineTo(w / 2 - 30, 0); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// 袖口特写：深蓝袖子 + 四道金杠，lit = 已描亮的道数（小数）
function cuff(ctx, x, y, s, lit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  P.piece(ctx, P.poly(P.jag([[-170, -230], [170, -230], [190, 160], [-190, 160]], 2, 18, 33)), '#24304a', { blur: 18, dy: 10 });
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; for (let k = -160; k < 180; k += 9) { ctx.beginPath(); ctx.moveTo(k, -228); ctx.lineTo(k + 18, 158); ctx.stroke(); }
  for (let k = 0; k < 4; k++) {
    const yy = 120 - k * 42, on = clamp(lit - k);
    ctx.fillStyle = '#8c7442'; ctx.fillRect(-182, yy - 12, 364, 24);
    if (on > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(-182, yy - 14, 364 * easeOut(on), 28); ctx.clip();
      ctx.shadowColor = 'rgba(255,200,60,0.9)'; ctx.shadowBlur = 22; ctx.fillStyle = YEL; ctx.fillRect(-182, yy - 12, 364, 24);
      ctx.restore();
    }
  }
  ctx.restore();
}
// —— 曼哈顿街道图（示意）：斜 29° 的网格，第五大道一条；返回第五大道两端点（屏幕坐标）——
function manhattan(ctx, cx, cy) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5);
  const isl = P.poly(P.jag([[-900, -240], [-300, -330], [700, -300], [980, -150], [900, 170], [200, 280], [-700, 240], [-960, 80]], 6, 22, 61));
  P.piece(ctx, isl, '#eadcbc', { blur: 20, dy: 10 });
  ctx.save(); ctx.clip(isl);
  ctx.strokeStyle = 'rgba(110,85,55,0.55)'; ctx.lineWidth = 3;
  for (let k = -1000; k < 1000; k += 46) { ctx.beginPath(); ctx.moveTo(k, -400); ctx.lineTo(k, 400); ctx.stroke(); }          // 街
  ctx.lineWidth = 6; for (let k = -330; k < 330; k += 92) { ctx.beginPath(); ctx.moveTo(-1000, k); ctx.lineTo(1000, k); ctx.stroke(); }   // 大道
  ctx.fillStyle = 'rgba(120,140,90,0.55)'; ctx.fillRect(330, -60, 420, 120);                                                           // 中央公园
  ctx.restore();
  ctx.restore();
  const m = (u, v) => { const c = Math.cos(-0.5), s = Math.sin(-0.5); return [cx + u * c - v * s, cy + u * s + v * c]; };
  return [m(-880, 0), m(320, 0)];
}
// —— 日历本：中心 (x,y)；page = 当前翻到第几页（小数在翻），labels(k) 每页的字 ——
function calendar(ctx, x, y, page, labels) {
  const w = 300, h = 300;
  ctx.save(); ctx.translate(x, y);
  P.piece(ctx, P.poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]), '#f4ecdc', { blur: 16, dy: 8 });
  const k = Math.floor(page), f = page - k;
  const face = (i, a = 1) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = RUST; ctx.fillRect(-w / 2, -h / 2, w, 70);
    ctx.fillStyle = INK; ctx.font = '700 92px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = labels(i); ctx.font = `700 ${s.length > 4 ? 64 : 92}px Sans`; ctx.fillText(s, 0, 38); ctx.restore();
  };
  face(k + 1 > page ? k : k);
  if (f > 0.02) {   // 上一页往上翻走
    ctx.save(); ctx.translate(0, -h / 2); ctx.scale(1, Math.cos(f * Math.PI / 2)); ctx.translate(0, h / 2);
    ctx.globalAlpha = 1 - f; P.piece(ctx, P.poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]), '#f4ecdc', { blur: 8, dy: 4 }); face(k - 1 >= 0 ? k - 1 : k); ctx.restore();
  }
  ctx.fillStyle = '#6d5a44'; for (const u of [-80, 0, 80]) { ctx.beginPath(); ctx.arc(u, -h / 2 + 10, 8, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
// —— 聚光灯：圆锥光 + 地上一圈亮 ——
function spotlight(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(40,26,14,0.45)'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// —— 1906 旧报纸版面（无可读文字，只有版式）——
const NEWS = (() => {
  const cv = new Canvas(W, H), x = cv.getContext('2d'), r = K.mulberry32(1906);
  x.fillStyle = '#e8dbb9'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(60,45,25,0.85)'; x.fillRect(120, 70, W - 240, 6); x.fillRect(120, 214, W - 240, 4); x.fillRect(120, 224, W - 240, 2);
  // 报头：花体德文地名+年份（旁白关键词），压低对比当底纹
  x.fillStyle = 'rgba(50,38,22,0.72)'; x.font = "118px Black"; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText('K\u00f6penick 1906', W / 2, 196);
  const cols = 6, cw = (W - 240) / cols;
  for (let c = 0; c < cols; c++) {
    if (c) { x.fillStyle = 'rgba(60,45,25,0.5)'; x.fillRect(120 + c * cw - 1, 250, 2, H - 300); }
    let y = 262;
    while (y < H - 40) {
      if (r() < 0.12) { x.fillStyle = 'rgba(55,40,22,0.6)'; x.fillRect(120 + c * cw + 22, y, cw * (0.5 + r() * 0.3), 16); y += 34; continue; }
      x.fillStyle = `rgba(70,55,35,${0.22 + r() * 0.12})`;
      x.fillRect(120 + c * cw + 14, y, cw - 28 - (r() < 0.15 ? r() * 90 : 0), 7); y += 15;
    }
  }
  for (let n = 0; n < 900; n++) { x.fillStyle = `rgba(120,85,40,${r() * 0.08})`; x.beginPath(); x.arc(r() * W, r() * H, 6 + r() * 40, 0, Math.PI * 2); x.fill(); }
  return P.bitmap(cv);
})();
function newspaper(ctx, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(NEWS, 0, 0); ctx.restore(); }
// 版画框（报纸里的插图块）：里面画 inner，外面一圈双线
function plate(ctx, x, y, w, h, inner) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#efe4c8'; ctx.shadowColor = 'rgba(50,30,10,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28); ctx.clip(); inner(ctx, w - 28, h - 28); ctx.restore();
  ctx.strokeStyle = 'rgba(45,32,20,0.85)'; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 40);
  ctx.restore();
}
// 牢墙刻痕：n 道（小数在画）
function tally(ctx, x, y, n, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  P.piece(ctx, P.poly(P.jag([[-230, -120], [230, -120], [230, 120], [-230, 120]], 4, 20, 91)), '#8e8478', { blur: 14, dy: 8 });
  const r = K.mulberry32(5); ctx.fillStyle = 'rgba(40,35,30,0.25)'; for (let k = 0; k < 120; k++) ctx.fillRect(-225 + r() * 450, -115 + r() * 230, 3 + r() * 10, 2 + r() * 4);
  ctx.strokeStyle = '#2a241e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let k = 0; k < Math.floor(n); k++) {
    const g = Math.floor(k / 5), i = k % 5, gx = -200 + (g % 5) * 84, gy = -80 + Math.floor(g / 5) * 100;
    ctx.beginPath();
    if (i < 4) { ctx.moveTo(gx + i * 15, gy); ctx.lineTo(gx + i * 15 + 3, gy + 66); } else { ctx.moveTo(gx - 8, gy + 50); ctx.lineTo(gx + 58, gy + 12); }
    ctx.stroke();
  }
  ctx.restore();
}
// 车票票根
function ticket(ctx, x, y, a, rot = -0.12) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  const w = 300, h = 140;
  const p = new Path2D(); p.moveTo(-w / 2, -h / 2); p.lineTo(w / 2, -h / 2); p.lineTo(w / 2, -18); p.arc(w / 2, 0, 18, -Math.PI / 2, Math.PI / 2, true); p.lineTo(w / 2, h / 2); p.lineTo(-w / 2, h / 2); p.closePath();
  P.piece(ctx, p, '#e9c98a', { blur: 12, dy: 6 });
  ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(w / 2 - 70, -h / 2 + 8); ctx.lineTo(w / 2 - 70, h / 2 - 8); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(60,35,15,0.85)'; ctx.font = '700 60px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1906', -40, 4);
  ctx.restore();
}
// 空白证件框：中心 (x,y)，w×h，一个“证件”抬头
function idFrame(ctx, x, y, w, h, a, o = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0);
  const outer = new Path2D(); outer.rect(-w / 2 - 34, -h / 2 - 96, w + 68, h + 130); const inner = new Path2D(); inner.rect(-w / 2, -h / 2, w, h);
  const ring = new Path2D(); ring.addPath(outer); ring.addPath(inner);
  ctx.save(); ctx.shadowColor = 'rgba(40,22,8,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillStyle = '#f2e6c8'; ctx.fill(ring, 'evenodd'); ctx.restore();
  ctx.strokeStyle = RUST; ctx.lineWidth = 5; ctx.strokeRect(-w / 2 - 20, -h / 2 - 82, w + 40, h + 102); ctx.lineWidth = 3; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = INK; ctx.font = '700 60px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('证 件', 0, -h / 2 - 44);
  ctx.restore();
}
// 钱箱（G17 没到时代码画）
function cashbox(ctx, x, y, s, open) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const q = easeOut(open);
  P.piece(ctx, P.poly([[-200, -120], [200, -120], [200, 60], [-200, 60]]), '#5d4a36', { blur: 18, dy: 10 });
  ctx.fillStyle = '#3f3226'; ctx.fillRect(-190, -110, 380, 30);
  for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(-150 + k * 72, -120 - q * (30 + k % 2 * 12)); ctx.rotate((k - 2) * 0.1 * q); P.piece(ctx, P.poly([[-60, -36], [60, -36], [60, 36], [-60, 36]]), '#c9c3a0', { blur: 6, dy: 3 }); ctx.strokeStyle = 'rgba(70,80,50,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(-52, -28, 104, 56); ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(0, -120); ctx.scale(1, Math.cos(q * 1.35)); P.piece(ctx, P.poly([[-205, -150], [205, -150], [205, 0], [-205, 0]]), '#6c5640', { blur: 10, dy: 4 }); ctx.restore();
  ctx.restore();
}

module.exports = { INK, YEL, RUST, KRAFT, CREAM, has, cut, put, wOf, ptOf, sheet, placeholder, MISSING, silhouette, marker, ring, tag, typed, typeN, clip, clapper, film, cheque, badge, cork, pin, tailorBox, cuff, manhattan, calendar, spotlight, newspaper, plate, tally, ticket, idFrame, cashbox };
