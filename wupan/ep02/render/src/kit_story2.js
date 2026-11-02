// 故事二（No.2 章节卡 + 026–033）自用的小零件：旧杂志封面拼条、订阅页、价格选项卡、图标、便签、实验记录板、虚线框
'use strict';
const K = require('./core');
const { W, H, Canvas, clamp, lerp, easeOut, mulberry32 } = K;
const P = require('./paper');

const INK = '#231b15', RED = '#c8321f', GREEN = '#3d8a3a', NAVY = '#22324a';

// —— 旧杂志封面拼条（No.2 章节卡背景）：三本虚构的旧杂志扇形摊在木桌上，没有任何文字/真实 logo ——
function cover(x, w, h, seed, band, art) {
  const r = mulberry32(seed);
  // 封面纸
  x.fillStyle = '#eee2c6'; x.fillRect(0, 0, w, h);
  // 刊头色带 + 一排粗块（像失焦的刊头字，不可读）
  x.fillStyle = band; x.fillRect(0, 0, w, h * 0.17);
  x.fillStyle = 'rgba(250,240,220,0.9)';
  let bx = w * 0.08;
  while (bx < w * 0.86) { const bw = w * (0.04 + r() * 0.07); x.fillRect(bx, h * 0.045, bw, h * 0.08); bx += bw + w * 0.018; }
  x.fillStyle = 'rgba(40,30,20,0.55)'; x.fillRect(w * 0.08, h * 0.185, w * 0.84, 3);
  // 插画区
  x.save(); x.translate(w / 2, h * 0.52); art(x, w, h, r); x.restore();
  // 底部几行灰色"正文条"
  x.fillStyle = 'rgba(60,45,30,0.45)';
  for (let k = 0; k < 4; k++) x.fillRect(w * 0.1, h * (0.84 + k * 0.035), w * (0.5 + r() * 0.3), h * 0.014);
  // 做旧：污渍、折痕、磨边
  for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(120,80,30,${0.03 + r() * 0.05})`; x.beginPath(); x.arc(r() * w, r() * h, 20 + r() * 70, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = 'rgba(255,250,235,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.62, 0); x.lineTo(w * 0.58, h); x.stroke();
  x.strokeStyle = 'rgba(90,60,30,0.35)'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
}
const halftone = (x, cx, cy, R, col, step = 14) => {
  x.fillStyle = col;
  for (let yy = -R; yy <= R; yy += step) for (let xx = -R; xx <= R; xx += step) {
    const d = Math.hypot(xx, yy) / R; if (d > 1) continue;
    x.beginPath(); x.arc(cx + xx, cy + yy, step * 0.42 * (1 - d * 0.7), 0, Math.PI * 2); x.fill();
  }
};
const ARTS = [
  // 地球（经纬线）
  (x, w) => {
    const R = w * 0.34; halftone(x, 0, 0, R, 'rgba(40,70,90,0.55)');
    x.strokeStyle = '#2b3d50'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2.5; for (let k = -2; k <= 2; k++) { x.beginPath(); x.ellipse(0, 0, Math.abs(k) * R * 0.32 + 1, R, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(-R * Math.cos(k * 0.5), R * Math.sin(k * 0.5)); x.lineTo(R * Math.cos(k * 0.5), R * Math.sin(k * 0.5)); x.stroke(); }
  },
  // 柱状图 + 折线
  (x, w, h) => {
    const bw = w * 0.11, base = h * 0.2;
    [0.3, 0.45, 0.38, 0.62, 0.8].forEach((v, i) => { x.fillStyle = i === 4 ? '#b8452c' : '#3c4f66'; x.fillRect(-w * 0.34 + i * bw * 1.35, base - v * h * 0.42, bw, v * h * 0.42); });
    x.strokeStyle = '#d99a2b'; x.lineWidth = 7; x.lineJoin = 'round'; x.beginPath();
    [[-0.36, 0.05], [-0.18, -0.06], [0, -0.02], [0.18, -0.2], [0.36, -0.3]].forEach(([a, b], i) => i ? x.lineTo(a * w, b * h) : x.moveTo(a * w, b * h)); x.stroke();
  },
  // 天平剪影 + 硬币
  (x, w, h) => {
    halftone(x, 0, -h * 0.02, w * 0.36, 'rgba(150,90,30,0.35)', 16);
    x.fillStyle = '#3a2a1c'; x.fillRect(-6, -h * 0.2, 12, h * 0.36); x.fillRect(-w * 0.3, -h * 0.2, w * 0.6, 10); x.fillRect(-w * 0.12, h * 0.15, w * 0.24, 14);
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * w * 0.3, -h * 0.2); x.lineTo(s * w * 0.3 - 50, h * 0.02); x.lineTo(s * w * 0.3 + 50, h * 0.02); x.closePath(); x.globalAlpha = 0.7; x.fill(); x.globalAlpha = 1; }
    x.fillStyle = '#c9952e'; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(-w * 0.3, h * 0.0 - k * 12, 34, 10, 0, 0, Math.PI * 2); x.fill(); }
  },
];
function magazineStrip(w, h) {
  const cv = new Canvas(w, h), x = cv.getContext('2d'), r = mulberry32(77);
  // 木桌
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#6b4d33'); g.addColorStop(1, '#4a3322');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let k = 0; k < 160; k++) { x.strokeStyle = `rgba(30,18,8,${0.05 + r() * 0.1})`; x.lineWidth = 1 + r() * 3; const y = r() * h; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 30, w * 0.7, y + (r() - 0.5) * 30, w, y + (r() - 0.5) * 20); x.stroke(); }
  const CW = 470, CH = 640;
  const list = [[w * 0.24, h * 0.56, -0.12, '#8e2a1f', 0], [w * 0.76, h * 0.54, 0.1, '#b07a22', 2], [w * 0.5, h * 0.5, 0.02, NAVY, 1]];
  for (const [cx, cy, rot, band, art] of list) {
    const c = new Canvas(CW, CH); cover(c.getContext('2d'), CW, CH, 90 + art, band, ARTS[art]);
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 30; x.shadowOffsetY = 14;
    x.fillStyle = '#000'; x.fillRect(-CW / 2, -CH / 2, CW, CH); x.shadowColor = 'transparent';
    x.drawImage(P.bitmap(c), -CW / 2, -CH / 2);
    x.restore();
  }
  // 暖色做旧
  x.fillStyle = 'rgba(150,100,40,0.12)'; x.fillRect(0, 0, w, h);
  const v = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,0.45)');
  x.fillStyle = v; x.fillRect(0, 0, w, h);
  return P.bitmap(cv);
}

// —— 图标 ——
function iconWeb(x, cx, cy, s, col = NAVY) {
  x.save(); x.translate(cx, cy); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = s * 0.07; x.lineJoin = 'round';
  x.beginPath(); x.roundRect(-s * 0.5, -s * 0.36, s, s * 0.62, s * 0.05); x.stroke();
  x.globalAlpha *= 0.25; x.fillRect(-s * 0.42, -s * 0.28, s * 0.84, s * 0.46); x.globalAlpha /= 0.25;
  x.fillRect(-s * 0.06, s * 0.26, s * 0.12, s * 0.12); x.fillRect(-s * 0.22, s * 0.36, s * 0.44, s * 0.06);
  x.restore();
}
function iconPrint(x, cx, cy, s, col = NAVY) {
  x.save(); x.translate(cx, cy); x.rotate(-0.06); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = s * 0.07; x.lineJoin = 'round';
  x.beginPath(); x.rect(-s * 0.36, -s * 0.44, s * 0.72, s * 0.86); x.stroke();
  x.fillRect(-s * 0.26, -s * 0.33, s * 0.52, s * 0.12);
  x.globalAlpha *= 0.55; for (let k = 0; k < 4; k++) x.fillRect(-s * 0.26, -s * 0.12 + k * s * 0.12, k % 2 ? s * 0.36 : s * 0.52, s * 0.05);
  x.restore();
}

// —— 价格选项卡（干净的界面卡片）：中心 (cx,cy)。o: name, price, icon('web'|'print'|'both'), w,h, alpha, scale, rot,
//    glow 0..1（金色外发光）, hl 0..1（价格荧光笔）, bump 0..1（价格跳一下）, blank（只画卡片轮廓，屏幕里的小页用）
function optionCard(x, cx, cy, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha; if (a <= 0.01) return;
  const w = o.w || 440, h = o.h || 540, s = o.scale == null ? 1 : o.scale;
  x.save(); x.globalAlpha *= a; x.translate(cx, cy); if (o.rot) x.rotate(o.rot); x.scale(s, s);
  if (o.glow > 0.01) { x.shadowColor = `rgba(255,190,40,${0.95 * o.glow})`; x.shadowBlur = 70 * o.glow; x.fillStyle = '#fff6d8'; x.beginPath(); x.roundRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 30); x.fill(); x.shadowColor = 'transparent'; }
  x.shadowColor = 'rgba(40,28,14,0.28)'; x.shadowBlur = 24; x.shadowOffsetY = 10;
  x.fillStyle = '#fffdf8'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 24); x.fill(); x.shadowColor = 'transparent';
  x.strokeStyle = o.glow > 0.3 ? '#d9a02a' : '#d8cdb8'; x.lineWidth = o.glow > 0.3 ? 6 : 3; x.stroke();
  x.fillStyle = NAVY; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, 22, [24, 24, 0, 0]); x.fill();
  if (o.blank) {
    x.fillStyle = '#e4dccb'; x.fillRect(-w * 0.3, -h * 0.2, w * 0.6, h * 0.1); x.fillRect(-w * 0.22, h * 0.05, w * 0.44, h * 0.16);
    x.fillStyle = '#b8452c'; x.beginPath(); x.roundRect(-w * 0.32, h * 0.32, w * 0.64, h * 0.1, 10); x.fill();
    x.restore(); return;
  }
  // 图标
  const iy = -h / 2 + 125;
  if (o.icon === 'web') iconWeb(x, 0, iy, 130);
  else if (o.icon === 'print') iconPrint(x, 0, iy, 130);
  else { iconPrint(x, -58, iy, 112); x.font = '700 60px Sans'; x.fillStyle = NAVY; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+', 6, iy); iconWeb(x, 74, iy, 112); }
  // 名称
  x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle';
  const nm = o.name;
  let sz = 54; x.font = `700 ${sz}px Sans`;
  while (x.measureText(nm).width > w - 50 && sz > 30) { sz -= 2; x.font = `700 ${sz}px Sans`; }
  x.fillText(nm, 0, -h / 2 + 275);
  // 价格
  const py = -h / 2 + 400;
  x.font = '700 124px Num';
  const pw = x.measureText(o.price).width;
  if (o.hl > 0.01) { x.fillStyle = 'rgba(255,214,64,0.8)'; x.beginPath(); x.moveTo(-pw / 2 - 18, py + 46); x.lineTo(-pw / 2 - 12, py - 40); x.lineTo(-pw / 2 - 12 + (pw + 34) * easeOut(o.hl), py - 44); x.lineTo(-pw / 2 - 18 + (pw + 34) * easeOut(o.hl), py + 48); x.closePath(); x.fill(); }
  const b = o.bump || 0, bs = 1 + Math.sin(clamp(b) * Math.PI) * 0.28;
  x.save(); x.translate(0, py - Math.sin(clamp(b) * Math.PI) * 26); x.scale(bs, bs);
  x.fillStyle = b > 0.01 && b < 1 ? RED : INK; x.fillText(o.price, 0, 6); x.restore();
  // 按钮（无字）
  x.fillStyle = '#b8452c'; x.beginPath(); x.roundRect(-w * 0.32, h / 2 - 78, w * 0.64, 46, 23); x.fill();
  if (o.inner) o.inner(x, w, h);
  x.restore();
}

// —— 浏览器窗口（订阅页外框）：左上 (x0,y0)，宽高 w×h，title 页头标题 ——
function browser(x, x0, y0, w, h, title, o = {}) {
  x.save();
  x.shadowColor = 'rgba(40,28,14,0.4)'; x.shadowBlur = 30; x.shadowOffsetY = 14;
  x.fillStyle = '#f4efe4'; x.beginPath(); x.roundRect(x0, y0, w, h, 20); x.fill(); x.shadowColor = 'transparent';
  x.fillStyle = '#ddd3c1'; x.beginPath(); x.roundRect(x0, y0, w, 56, [20, 20, 0, 0]); x.fill();
  ['#d0614c', '#e0b048', '#7fae5a'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(x0 + 36 + i * 34, y0 + 28, 11, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#f7f3ea'; x.beginPath(); x.roundRect(x0 + 160, y0 + 13, w - 320, 30, 15); x.fill();
  // 页头
  x.fillStyle = NAVY; x.fillRect(x0, y0 + 56, w, o.headH || 110);
  x.fillStyle = '#f7efdc'; x.font = `700 ${o.titleSize || 58}px Serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(title, x0 + w / 2, y0 + 56 + (o.headH || 110) / 2 + 2);
  x.restore();
}

// —— 便签（黄色方纸，一角卷起）：中心 (cx,cy)；p 0..1 拍上去 ——
function sticky(x, cx, cy, text, p, o = {}) {
  if (p <= 0.01) return;
  const s = (o.size || 150), q = easeOut(clamp(p * 1.3)), sc = lerp(1.6, 1, q);
  x.save(); x.globalAlpha *= clamp(p * 2.5); x.translate(cx, cy); x.rotate(o.rot == null ? 0.08 : o.rot); x.scale(sc, sc);
  x.shadowColor = 'rgba(50,28,8,0.4)'; x.shadowBlur = 16; x.shadowOffsetY = 8;
  x.fillStyle = '#f7dd62';
  x.beginPath(); x.moveTo(-s, -s * 0.62); x.lineTo(s, -s * 0.62); x.lineTo(s, s * 0.42); x.quadraticCurveTo(s * 0.9, s * 0.6, s * 0.7, s * 0.62); x.lineTo(-s, s * 0.62); x.closePath(); x.fill();
  x.shadowColor = 'transparent';
  x.fillStyle = 'rgba(200,160,40,0.5)'; x.fillRect(-s, -s * 0.62, s * 2, s * 0.14);
  x.fillStyle = o.color || '#1d2a4a'; x.font = `700 ${o.font || 92}px Kai`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 0, s * 0.06);
  x.restore();
}

// —— 实验记录板：夹板 + 白纸 ——
const BOARD = { x0: 100, y0: 128, x1: W - 100, y1: 970 };
const BOARD_PATH = P.poly(P.jag([[BOARD.x0 + 28, BOARD.y0 + 40], [BOARD.x1 - 28, BOARD.y0 + 40], [BOARD.x1 - 28, BOARD.y1 - 22], [BOARD.x0 + 28, BOARD.y1 - 22]], 1.5, 18, 211));
function board(x) {
  const { x0, y0, x1, y1 } = BOARD;
  x.save();
  x.shadowColor = 'rgba(40,24,8,0.5)'; x.shadowBlur = 30; x.shadowOffsetY = 14;
  x.fillStyle = '#9a6b3e'; x.beginPath(); x.roundRect(x0, y0, x1 - x0, y1 - y0, 26); x.fill(); x.shadowColor = 'transparent';
  x.strokeStyle = 'rgba(60,35,15,0.25)'; x.lineWidth = 2;
  for (let k = 0; k < 12; k++) { const yy = y0 + 20 + k * 70; x.beginPath(); x.moveTo(x0 + 10, yy); x.bezierCurveTo(x0 + 500, yy + 10, x1 - 500, yy - 12, x1 - 10, yy + 4); x.stroke(); }
  P.piece(x, BOARD_PATH, '#fbf8f1', { blur: 8, dy: 3 });
  // 方格淡线
  x.save(); x.clip(BOARD_PATH); x.strokeStyle = 'rgba(80,120,160,0.12)'; x.lineWidth = 1.5;
  for (let xx = x0 + 40; xx < x1; xx += 44) { x.beginPath(); x.moveTo(xx, y0); x.lineTo(xx, y1); x.stroke(); }
  for (let yy = y0 + 50; yy < y1; yy += 44) { x.beginPath(); x.moveTo(x0, yy); x.lineTo(x1, yy); x.stroke(); }
  x.restore();
  // 夹子
  const cx = (x0 + x1) / 2;
  x.shadowColor = 'rgba(0,0,0,0.4)'; x.shadowBlur = 10; x.shadowOffsetY = 5;
  const g = x.createLinearGradient(0, y0 - 20, 0, y0 + 70); g.addColorStop(0, '#d9dcdf'); g.addColorStop(1, '#7d8186');
  x.fillStyle = g; x.beginPath(); x.roundRect(cx - 170, y0 - 14, 340, 76, 14); x.fill();
  x.shadowColor = 'transparent'; x.fillStyle = '#5b5e62'; x.beginPath(); x.roundRect(cx - 60, y0 - 24, 120, 26, 10); x.fill();
  x.restore();
}

function dashedRect(x, x0, y0, w, h, col = 'rgba(90,74,60,0.55)', a = 1) {
  if (a <= 0.01) return;
  x.save(); x.globalAlpha *= a; x.setLineDash([16, 12]); x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.roundRect(x0, y0, w, h, 14); x.stroke(); x.restore();
}
// 实心小三角箭头（涨 ▲ / 跌 ▼）
function tri(x, cx, cy, s, up, col, a = 1) {
  if (a <= 0.01) return;
  x.save(); x.globalAlpha *= a; x.fillStyle = col; x.beginPath();
  if (up) { x.moveTo(cx, cy - s); x.lineTo(cx + s * 0.9, cy + s * 0.6); x.lineTo(cx - s * 0.9, cy + s * 0.6); }
  else { x.moveTo(cx, cy + s); x.lineTo(cx + s * 0.9, cy - s * 0.6); x.lineTo(cx - s * 0.9, cy - s * 0.6); }
  x.closePath(); x.fill(); x.restore();
}

module.exports = { INK, RED, GREEN, NAVY, magazineStrip, optionCard, browser, sticky, board, BOARD, dashedRect, tri, iconWeb, iconPrint };
