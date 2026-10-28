// 人脑：版画人头侧影（head_engrave），颅腔可以变半透明，里面放芯片或代码卡。001、012、034–036 共用
'use strict';
const K = require('./core');
const { Canvas, clamp, lerp, smooth, prog, easeOut } = K;
const P = require('./paper');
const C = require('./card');
const CUT = require('./cutout');

const HEAD = CUT.get('head_engrave');
// 颅腔范围（剪影框内的比例坐标）：中心 (0.47, 0.25)，半径 (0.42, 0.24)
const CR = { u: 0.47, v: 0.25, ru: 0.43, rv: 0.25 };
const [bx0, by0, bx1, by1] = HEAD.box, BW = bx1 - bx0, BH = by1 - by0;
// 半透明颅腔：一块羽化的奶白椭圆，只留在剪影里面
const GLASS = (() => {
  const cv = new Canvas(HEAD.w, HEAD.h), x = cv.getContext('2d');
  const cx = bx0 + CR.u * BW, cy = by0 + CR.v * BH, rx = CR.ru * BW, ry = CR.rv * BH;
  x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
  const g = x.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx);
  g.addColorStop(0, 'rgba(255,250,236,0.97)'); g.addColorStop(0.78, 'rgba(255,248,230,0.9)'); g.addColorStop(1, 'rgba(255,248,230,0)');
  x.fillStyle = g; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore();
  // 脑回：几道淡棕色弯线
  x.strokeStyle = 'rgba(176,112,62,0.38)'; x.lineWidth = 7; x.lineCap = 'round';
  const r = K.mulberry32(5);
  x.beginPath();
  for (let k = 0; k <= 120; k++) { const a = k / 120 * Math.PI * 2, rr = 0.86 + 0.05 * Math.sin(a * 9) + 0.03 * Math.sin(a * 23); const px = cx + Math.cos(a) * rx * rr * 0.92, py = cy + Math.sin(a) * ry * rr * 0.86; k ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
  x.lineWidth = 5; x.strokeStyle = 'rgba(176,112,62,0.22)';
  for (let n = 0; n < 9; n++) {
    const a = r() * Math.PI * 2, d = 0.3 + r() * 0.45;
    let px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 4; k++) { const nx = px + (r() - 0.5) * 120, ny = py + (r() - 0.5) * 70; x.quadraticCurveTo((px + nx) / 2 + (r() - 0.5) * 60, (py + ny) / 2 + (r() - 0.5) * 60, nx, ny); px = nx; py = ny; }
    x.stroke();
  }
  x.globalCompositeOperation = 'destination-in'; x.drawImage(HEAD.img, 0, 0);
  return P.bitmap(cv);
})();
const GL = { img: GLASS, box: HEAD.box, w: HEAD.w, h: HEAD.h };

// o: {x, y(底边), h, glass 0..1, alpha, rot}；返回 map(u,v) → 屏幕坐标
function head(ctx, o) {
  const po = { alpha: o.alpha, rot: o.rot, anchor: o.anchor };
  CUT.place(ctx, HEAD, o.x, o.y, o.h, po);
  if (o.glass > 0.01) CUT.place(ctx, GL, o.x, o.y, o.h, { ...po, alpha: (o.alpha == null ? 1 : o.alpha) * o.glass, shadow: false });
  return (u, v) => CUT.pt(HEAD, o.x, o.y, o.h, u, v, po);
}
const scaleOf = h => h / BH;

// 电路芯片：深绿板 + 金色针脚 + 走线 + 中间的字
function chip(ctx, x, y, w, h, label, a = 1, glow = 0) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  if (glow > 0.01) {
    const g = ctx.createRadialGradient(0, 0, h * 0.3, 0, 0, w * 0.95);
    g.addColorStop(0, `rgba(255,214,90,${0.55 * glow})`); g.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = g; ctx.fillRect(-w, -w, w * 2, w * 2);
  }
  // 针脚
  ctx.fillStyle = '#c9a24a';
  const nx = 7, ny = 4, pin = Math.min(w, h) * 0.11;
  for (let i = 0; i < nx; i++) { const px = -w / 2 + w * (i + 0.5) / nx - pin * 0.3; ctx.fillRect(px, -h / 2 - pin, pin * 0.6, pin); ctx.fillRect(px, h / 2, pin * 0.6, pin); }
  for (let i = 0; i < ny; i++) { const py = -h / 2 + h * (i + 0.5) / ny - pin * 0.3; ctx.fillRect(-w / 2 - pin, py, pin, pin * 0.6); ctx.fillRect(w / 2, py, pin, pin * 0.6); }
  ctx.shadowColor = 'rgba(40,25,10,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#24493a'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(214,180,96,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(-w / 2 + 24, -h / 2 + 24, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(214,180,96,0.8)'; ctx.fill();
  const fs = Math.min(h * 0.4, w / ([...label].length + 0.8));
  ctx.font = `700 ${fs}px Sans`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = glow > 0.01 ? `rgba(255,236,170,1)` : '#f3e6c0';
  if (glow > 0.01) { ctx.shadowColor = `rgba(255,220,120,${0.9 * glow})`; ctx.shadowBlur = 18 * glow; }
  ctx.fillText(label, 0, fs * 0.04);
  ctx.restore();
}

// 一张单行代码卡（和蚁巢右上角那张同一个样子）：中心 (cx,cy)，字号 size
//   o: {alpha, scale, rot, n(已打字数), hl:[起,长,p], tick, tint(闪红), seed}
function ruleCard(ctx, cx, cy, text, size, o = {}) {
  ctx.save(); ctx.font = C.CODE(size); const tw = ctx.measureText(text).width; ctx.restore();
  const k = size / 46, w = tw + 130 * k + (o.tick != null ? 40 * k : 0), h = 104 * k;
  C.card(ctx, cx - w / 2, cy - h / 2, w, h, { alpha: o.alpha, scale: o.scale, rot: o.rot == null ? 0.012 : o.rot, seed: o.seed || 21, blur: 14 * k, dy: 7 * k, tint: o.tint,
    inner: c => {
      C.codeLine(c, text, 30 * k, 70 * k, { size, n: o.n, hl: o.hl });
      if (o.tick != null) C.tick(c, w - 52 * k, 50 * k, 46 * k, o.tick);
    } });
  return [w, h];
}

// 黄黑警示带：从左往右拉开（p），y 中线，角度 rot
const TAPE_H = 74;
function tape(ctx, y, rot, p, x0 = -80, x1 = K.W + 80) {
  if (p <= 0.01) return;
  const L = x1 - x0, l = L * easeOut(p);
  ctx.save(); ctx.translate(x0, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(40,25,10,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#f2c230'; ctx.fillRect(0, -TAPE_H / 2, l, TAPE_H);
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.rect(0, -TAPE_H / 2, l, TAPE_H); ctx.clip();
  ctx.fillStyle = '#1f1a16';
  for (let s = -TAPE_H; s < l + TAPE_H; s += 64) { ctx.beginPath(); ctx.moveTo(s, TAPE_H / 2); ctx.lineTo(s + 32, TAPE_H / 2); ctx.lineTo(s + 32 + TAPE_H, -TAPE_H / 2); ctx.lineTo(s + TAPE_H, -TAPE_H / 2); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(0, -TAPE_H / 2, l, 8);
  ctx.restore();
  ctx.restore();
}
// 警示灯：琥珀色灯罩 + 闪光（on 0..1）
function beacon(ctx, x, y, s, on) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (on > 0.01) {
    const g = ctx.createRadialGradient(0, -40, 10, 0, -40, 260);
    g.addColorStop(0, `rgba(255,120,40,${0.75 * on})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.fillRect(-300, -320, 600, 560);
  }
  ctx.shadowColor = 'rgba(40,25,10,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#2b2420'; ctx.beginPath(); ctx.roundRect(-62, -8, 124, 34, 6); ctx.fill();
  ctx.shadowColor = 'transparent';
  const gg = ctx.createLinearGradient(-50, -90, 50, 0);
  gg.addColorStop(0, on > 0.5 ? '#ffd27a' : '#e8873a'); gg.addColorStop(1, on > 0.5 ? '#ff5a1e' : '#b0471c');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-48, -6); ctx.lineTo(-48, -60); ctx.arc(0, -60, 48, Math.PI, 0); ctx.lineTo(48, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-20, -70, 9, 24, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

module.exports = { HEAD, CR, head, scaleOf, chip, ruleCard, tape, beacon };
