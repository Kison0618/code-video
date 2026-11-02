// 第二集 v5 的小零件：红褐色划线、印章音效登记、剪图局部、手机外壳、翻卡、便签、微信消息气泡
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const P = require('../paper');
const Q = require('../kit02');
const CUT = require('../cutout');

const RUST = Q.RUST, INK = Q.INK;

// 手绘划线：从 (x0,y0) 到 (x1,y1)，p 画到哪
function strike(ctx, x0, y0, x1, y1, p, col = RUST, w = 10) {
  if (p <= 0.01) return;
  const q = easeOut(p), pts = [];
  for (let k = 0; k <= 20; k++) { const u = k / 20 * q; pts.push([lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * 9) * 3]); }
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
}

// 印章音效登记：场景在模块加载时登记落章时刻，mix_v5.py 照这个放 yinzhang 音效
//   level: 'main'（结尾“误判”，峰值低于人声 4 dB）| 'minor'（其余，低于人声 12 dB）
const STAMPS = [];
function stampAt(name, t, level = 'minor') { STAMPS.push({ name, t: +t.toFixed(3), level }); }

// 剪图的一部分：只画剪影框里 u0..u1 × v0..v1 那一块，块的底边中点放在 (x,y)，块高 h
const SILC = new Map();
function silOf(c) {
  if (!SILC.has(c.name)) { const cv = new K.Canvas(c.w, c.h), z = cv.getContext('2d'); z.drawImage(c.img, 0, 0); z.globalCompositeOperation = 'source-in'; z.fillStyle = '#2a211a'; z.fillRect(0, 0, c.w, c.h); SILC.set(c.name, { ...c, img: P.bitmap(cv) }); }
  return SILC.get(c.name);
}
function putPart(ctx, n, x, y, h, [u0, v0, u1, v1], o = {}) {
  let c = Q.cut(n);
  if (!c) return Q.placeholder(ctx, n, x, y, h * 0.5, h, o);
  if (o.sil) c = silOf(c);
  const [x0, y0, x1, y1] = c.box, bw = x1 - x0, bh = y1 - y0;
  const px0 = x0 + bw * u0, px1 = x0 + bw * u1, py0 = y0 + bh * v0, py1 = y0 + bh * v1;
  const s = h / (py1 - py0);
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.flip ? -s : s, s); ctx.translate(-(px0 + px1) / 2, -py1);
  ctx.beginPath(); ctx.rect(px0, py0, px1 - px0, py1 - py0); ctx.clip();
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(60,35,10,0.4)'; ctx.shadowBlur = 10 / s; ctx.shadowOffsetY = 6 / s; }
  ctx.drawImage(c.img, 0, 0);
  ctx.restore();
}

// 手机：中心 (x,y)，屏幕 w×h；screen(ctx, w, h) 在屏幕坐标里画（原点左上）
function phone(ctx, x, y, w, h, screen, o = {}) {
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  const b = 26;
  ctx.shadowColor = 'rgba(40,22,8,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#26211d'; ctx.beginPath(); ctx.roundRect(-w / 2 - b, -h / 2 - b * 2.2, w + b * 2, h + b * 4.4, 54); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#4a423b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-w / 2 - b + 6, -h / 2 - b * 2.2 + 6, w + b * 2 - 12, h + b * 4.4 - 12, 48); ctx.stroke();
  ctx.fillStyle = '#3d3630'; ctx.beginPath(); ctx.roundRect(-50, -h / 2 - b * 1.3, 100, 12, 6); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.clip(); ctx.translate(-w / 2, -h / 2); screen(ctx, w, h); ctx.restore();
  ctx.restore();
}

// 微信群里的一条消息：左边头像方块，右边白色气泡；y = 气泡顶；返回气泡高
function msg(ctx, x, y, maxW, text, p, o = {}) {
  if (p <= 0.01) return 0;
  const size = o.size || 38;
  ctx.save(); ctx.font = `500 ${size}px Sans`;
  const tw = Math.min(maxW - 130, ctx.measureText(text).width), bw = tw + 44, bh = size + 40;
  ctx.globalAlpha *= clamp(p * 2); ctx.translate(0, (1 - easeOut(p)) * 30);
  ctx.fillStyle = o.avatar || '#9a8f80'; ctx.beginPath(); ctx.roundRect(x, y, 70, 70, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x + 35, y + 28, 13, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 35, y + 62, 24, 16, 0, Math.PI, 0); ctx.fill();
  const bx = x + 90;
  ctx.fillStyle = o.bg || '#ffffff'; ctx.beginPath(); ctx.roundRect(bx, y, bw, bh, 10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx, y + 26); ctx.lineTo(bx - 12, y + 34); ctx.lineTo(bx, y + 42); ctx.fill();
  ctx.fillStyle = o.color || '#1e1e1e'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, bx + 22, y + bh / 2 + 2);
  ctx.restore();
  return bh;
}

// 翻卡：牌堆在 (x,y)，卡 w×h；p 0..1 翻进来（横向压扁 → 展开），under = 底下已经翻过几张（画几层纸边）
const CARDP = new Map();
function deckCard(ctx, x, y, w, h, p, under, face, o = {}) {
  const key = `${w}x${h}`;
  if (!CARDP.has(key)) CARDP.set(key, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 2, 18, 301)));
  const path = CARDP.get(key);
  for (let k = Math.min(3, under); k >= 1; k--) {
    ctx.save(); ctx.translate(x + k * 14, y + k * 12); ctx.rotate(0.012 * k * (k % 2 ? 1 : -1));
    P.piece(ctx, path, k % 2 ? '#efe2c3' : '#f4ead2', { blur: 14, dy: 6 }); ctx.restore();
  }
  if (p <= 0.01) return;
  const q = easeOut(p), sx = Math.max(0.02, q), lift = Math.sin(clamp(p) * Math.PI) * 30;
  ctx.save(); ctx.translate(x, y - lift); ctx.rotate((o.rot || 0) + (1 - q) * 0.15); ctx.scale(sx, 1);
  P.piece(ctx, path, o.bg || '#f8f0dc', { blur: 22, dy: 10 });
  if (q > 0.35) { ctx.save(); ctx.clip(path); ctx.translate(-w / 2, -h / 2); face(ctx, w, h); ctx.restore(); }
  ctx.restore();
}

// 便签：中心 (x,y)，w×h；p 贴上（从大到小落下），col 底色
function note(ctx, x, y, w, h, p, col, draw, o = {}) {
  if (p <= 0.01) return;
  const q = easeOut(p), s = lerp(1.25, 1, q) * (o.s || 1);
  ctx.save(); ctx.globalAlpha *= clamp(p * 2) * (o.alpha == null ? 1 : o.alpha); ctx.translate(x, y); ctx.rotate((o.rot || 0) + (1 - q) * 0.12); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(50,30,10,0.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 12;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2 - 30); ctx.lineTo(w / 2 - 40, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 30); ctx.lineTo(w / 2 - 40, h / 2); ctx.lineTo(w / 2 - 34, h / 2 - 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-60, -h / 2 - 22, 120, 44);   // 胶带
  ctx.translate(-w / 2, -h / 2); draw(ctx, w, h);
  ctx.restore();
}

const UPPER = [0, 0, 1, 0.68];                             // H02 去掉讲台，只要上半身
module.exports = { UPPER, strike, STAMPS, stampAt, putPart, phone, msg, deckCard, note };
