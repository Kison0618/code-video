// 收尾 034–036 的小零件：卡片背面 / 翻面、木偶手 + 提线（会断）、「大错」小票、标题纸片
'use strict';
const K = require('./core');
const { clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const P = require('./paper');
const C = require('./card');
const CUT = require('./cutout');

const RED = '#c8321f', GOLD = '#c9a24a', INK = '#231b15';

// —— 代码卡尺寸：和 brain.ruleCard 的算法一致（含勾的位置）——
function cardSize(text, size) {
  const cv = new K.Canvas(10, 10), x = cv.getContext('2d'); x.font = C.CODE(size);
  const k = size / 46;
  return [x.measureText(text).width + 130 * k + 40 * k, 104 * k];
}

// —— 卡片背面：深红褐纸 + 金色双框 + 菱格 + 中间一个金菱形。中心在原点 ——
//   o: {seed, rim 0..1（金边高亮）, lift}
const BACKS = new Map();
function backPath(w, h, seed) {
  const k = `${w | 0}x${h | 0}_${seed}`;
  if (!BACKS.has(k)) BACKS.set(k, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 1.6, 14, seed)));
  return BACKS.get(k);
}
function cardBack(ctx, w, h, o = {}) {
  const path = backPath(w, h, o.seed || 3), m = Math.min(w, h);
  if (o.rim > 0.01) {
    ctx.save(); ctx.shadowColor = `rgba(255,200,70,${0.9 * o.rim})`; ctx.shadowBlur = m * 0.35;
    ctx.fillStyle = `rgba(255,214,110,${0.9 * o.rim})`; ctx.fill(path); ctx.restore();
  }
  P.piece(ctx, path, '#6a2f20', { blur: m * 0.14, dy: m * 0.06, color: 'rgba(40,20,8,0.5)' });
  ctx.save(); ctx.clip(path);
  const g = ctx.createRadialGradient(-w * 0.15, -h * 0.2, m * 0.1, 0, 0, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(150,70,44,0.9)'); g.addColorStop(1, 'rgba(60,24,14,0.6)');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  const pad = m * 0.1;
  // 菱格
  ctx.beginPath(); ctx.rect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2); ctx.clip();
  ctx.strokeStyle = 'rgba(214,170,90,0.35)'; ctx.lineWidth = Math.max(1, m * 0.018);
  const st = m * 0.2;
  ctx.beginPath();
  for (let s = -w - h; s < w + h; s += st) { ctx.moveTo(s - h / 2, -h / 2); ctx.lineTo(s + h / 2, h / 2); ctx.moveTo(s + h / 2, -h / 2); ctx.lineTo(s - h / 2, h / 2); }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.5, m * 0.03);
  ctx.strokeRect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2);
  ctx.lineWidth = Math.max(1, m * 0.012);
  ctx.strokeRect(-w / 2 + pad * 1.6, -h / 2 + pad * 1.6, w - pad * 3.2, h - pad * 3.2);
  const d = m * 0.2;
  ctx.fillStyle = '#6a2f20'; ctx.beginPath(); ctx.moveTo(0, -d); ctx.lineTo(d * 0.75, 0); ctx.lineTo(0, d); ctx.lineTo(-d * 0.75, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(0, -d * 0.8); ctx.lineTo(d * 0.6, 0); ctx.lineTo(0, d * 0.8); ctx.lineTo(-d * 0.6, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a3d26'; ctx.beginPath(); ctx.arc(0, 0, d * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// —— 翻面：f = 0 正面，1 背面；在 (x,y) 处按 rot 旋转，水平压扁模拟翻转 ——
function flipCard(ctx, x, y, f, rot, front, back) {
  const c = Math.cos(clamp(f) * Math.PI), sx = Math.max(0.03, Math.abs(c));
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.scale(sx, 1 + 0.06 * (1 - sx));            // 翻到侧面时略微拉高，像卡片朝镜头转过来
  if (c >= 0) front(ctx); else back(ctx);
  ctx.restore();
}

// —— 柔光：卡片后面一圈暖金色 ——
function glowBehind(ctx, x, y, w, h, a, col = [255, 206, 90]) {
  if (a <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(0, 0, w * 0.2, 0, 0, w * 0.85);
  g.addColorStop(0, `rgba(${col},${0.75 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(-w, -w, w * 2, w * 2);
  ctx.restore();
}

// —— 木偶手：素材下面自带的四根线在 y=612（图像像素）处剪掉，后面的线由 string() 接着画 ——
const HAND = CUT.get('eng_puppet_hand');
const CUT_Y = 612;
// 四个挂线点（剪影框内比例坐标），正好落在原图四根线被剪断的地方：后左、前左、前右、后右
const HOOKS = [[0.031, 0.619], [0.160, 0.619], [0.565, 0.619], [0.609, 0.619]];
const HAND_ANCHOR = [0.32, 0.619];
function hand(ctx, x, y, h, alpha = 1) {
  CUT.place(ctx, HAND, x, y, h, { anchor: HAND_ANCHOR, alpha, clip: c => {
    c.beginPath(); c.moveTo(-20, -20); c.lineTo(HAND.w + 20, -20); c.lineTo(HAND.w + 20, CUT_Y);
    for (let i = 20; i >= 0; i--) c.lineTo((HAND.w + 20) * i / 20 - 10, CUT_Y + (i % 2 ? 3 : -3));
    c.closePath(); c.clip();
  } });
}
const hooks = (x, y, h) => HOOKS.map(([u, v]) => CUT.pt(HAND, x, y, h, u, v, { anchor: HAND_ANCHOR }));

// —— 提线：A（手上）→ B（卡上）。o.drop 0..1 线从 A 往下垂到 B；o.snap 0..1 从中间断开（上半截缩回、下半截落下淡出）——
function string(ctx, A, B, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  const col = o.color || '#3a2a1e', lw = o.w || 3.2;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  const drop = o.drop == null ? 1 : o.drop, snap = o.snap || 0;
  if (snap <= 0) {
    const E = [lerp(A[0], B[0], drop), lerp(A[1], B[1], drop)];
    const sag = (o.sag == null ? 8 : o.sag) * drop;
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + E[0]) / 2 + sag, (A[1] + E[1]) / 2, E[0], E[1]); ctx.stroke();
    if (drop >= 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(B[0], B[1], lw * 1.6, 0, Math.PI * 2); ctx.fill(); }
  } else {
    const M = [lerp(A[0], B[0], 0.5), lerp(A[1], B[1], 0.5)], side = o.side || 1;
    const up = easeOut(clamp(snap * 1.4));
    // 上半截：往手那边弹回去，末端打个卷
    const U = [lerp(M[0], A[0], up * 0.75) + side * 46 * Math.sin(up * Math.PI), lerp(M[1], A[1], up * 0.75)];
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + U[0]) / 2 - side * 20 * up, (A[1] + U[1]) / 2, U[0], U[1]); ctx.stroke();
    // 下半截：松垂，掉在卡上，淡出
    const la = 1 - smooth(prog(snap, 0.35, 1));
    if (la > 0.01) {
      const D = [lerp(M[0], B[0], 0.4 * up) - side * 34 * up, lerp(M[1], B[1], 0.85 * up) + 30 * up];
      ctx.globalAlpha *= la;
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.quadraticCurveTo(B[0] - side * 26 * up, (B[1] + D[1]) / 2 - 20 * up, D[0], D[1]); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(B[0], B[1], lw * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha /= la;
    }
    // 断开那一下：一圈短短的金色火花
    const f = 1 - smooth(prog(snap, 0, 0.35));
    if (f > 0.01) {
      ctx.strokeStyle = `rgba(232,160,40,${f})`; ctx.lineWidth = 5;
      const r0 = 10 + 30 * (1 - f), r1 = r0 + 26;
      for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2 + 0.3; ctx.beginPath(); ctx.moveTo(M[0] + Math.cos(an) * r0, M[1] + Math.sin(an) * r0); ctx.lineTo(M[0] + Math.cos(an) * r1, M[1] + Math.sin(an) * r1); ctx.stroke(); }
    }
  }
  ctx.restore();
}

// —— 小票：中心 (x,y)，锯齿下边，大红字 ——
const RCPT = new Map();
function receipt(ctx, x, y, text, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  const w = o.w || 330, h = o.h || 300, key = `${w}x${h}`;
  if (!RCPT.has(key)) {
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2]];
    const n = 12; for (let i = 0; i <= n * 2; i++) pts.push([w / 2 - w * i / (n * 2), h / 2 - (i % 2 ? 18 : 0)]);
    RCPT.set(key, P.poly(P.jag(pts, 1.2, 30, 77)));
  }
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale);
  P.piece(ctx, RCPT.get(key), '#fffcf3', { blur: 20, dy: 10 });
  ctx.fillStyle = 'rgba(80,60,40,0.28)';
  for (let i = 0; i < 3; i++) ctx.fillRect(-w / 2 + 34, -h / 2 + 34 + i * 26, (i === 1 ? 0.55 : 0.8) * (w - 68), 9);
  ctx.strokeStyle = 'rgba(80,60,40,0.4)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(-w / 2 + 28, -h / 2 + 118); ctx.lineTo(w / 2 - 28, -h / 2 + 118); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = RED; ctx.font = `900 ${o.size || 118}px Sans`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, h * 0.17);
  ctx.restore();
}

// —— 标题纸片：拍下来（p 0..1）。中心 (x,y) ——
const SLABS = new Map();
function slab(ctx, x, y, text, p, o = {}) {
  if (p <= 0.01) return;
  const size = o.size || 120, fam = o.font || 'Serif', wt = o.weight || 900;
  ctx.save(); ctx.font = `${wt} ${size}px ${fam}`;
  const tw = ctx.measureText(text).width, w = tw + size * 0.9, h = size * 1.6;
  const key = `${w | 0}_${o.seed || 64}`;
  if (!SLABS.has(key)) SLABS.set(key, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 3, 16, o.seed || 64)));
  const sc = 1 + (1 - easeOut(p)) * 0.5;
  ctx.globalAlpha *= clamp(p * 3) * (o.alpha == null ? 1 : o.alpha);
  ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.02 : o.rot); ctx.scale(sc, sc);
  P.piece(ctx, SLABS.get(key), o.bg || '#fbf6ea', { blur: 16, dy: 8 });
  ctx.fillStyle = o.color || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
  return w;
}

// 红叉（手绘）
function cross(ctx, x, y, s, p, col = RED) {
  if (p <= 0.01) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.17; ctx.lineCap = 'round';
  const a = easeOut(clamp(p * 2)), b = easeOut(clamp(p * 2 - 1));
  ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x - s / 2 + s * a, y - s / 2 + s * a);
  if (b > 0) { ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x + s / 2 - s * b, y - s / 2 + s * b); }
  ctx.stroke(); ctx.restore();
}

module.exports = { RED, GOLD, INK, cardSize, cardBack, flipCard, glowBehind, HAND, hand, hooks, string, receipt, slab, cross };
