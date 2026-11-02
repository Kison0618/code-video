// 泛黄的伪代码卡片 + 对话气泡
'use strict';
const K = require('./core');
const { clamp, smooth, prog, easeOut } = K;
const P = require('./paper');
const { Path2D } = require('skia-canvas');

const INK = '#2b2118', IF = '#a8371f', ARROW = '#8a7660';
const CODE = s => `700 ${s}px Mono, Sans`;

const cache = new Map();
function cardPath(w, h, seed) {
  const k = `${w}x${h}x${seed}`;
  if (!cache.has(k)) cache.set(k, P.poly(P.jag([[0, 0], [w, 0], [w, h], [0, h]], 1.8, 16, seed)));
  return cache.get(k);
}
// 一行代码：IF 红褐、→ 灰、其余墨色；n = 已打出的字数；hl = [起, 长, 0..1] 荧光笔
function codeLine(ctx, s, x, y, o = {}) {
  const size = o.size || 50, cs = [...s], n = o.n == null ? cs.length : Math.floor(o.n);
  ctx.save();
  ctx.font = CODE(size); ctx.textBaseline = 'alphabetic';
  const wOf = str => ctx.measureText(str).width;
  if (o.hl && o.hl[2] > 0.01) {
    const x0 = x + wOf(cs.slice(0, o.hl[0]).join('')), w = wOf(cs.slice(o.hl[0], o.hl[0] + o.hl[1]).join(''));
    ctx.fillStyle = 'rgba(255,214,64,0.78)';
    ctx.beginPath(); ctx.moveTo(x0 - 8, y + 10); ctx.lineTo(x0 - 4, y - size * 0.86);
    ctx.lineTo(x0 + (w + 14) * easeOut(o.hl[2]), y - size * 0.82); ctx.lineTo(x0 + (w + 10) * easeOut(o.hl[2]), y + 12); ctx.closePath(); ctx.fill();
  }
  let cx = x;
  for (let i = 0; i < Math.min(n, cs.length); i++) {
    const ch = cs[i];
    const isIF = o.color == null && i < 2 && s.startsWith('IF');
    ctx.fillStyle = o.color || (isIF ? IF : ch === '→' ? ARROW : INK);
    ctx.fillText(ch, cx, y);
    cx += wOf(ch);
  }
  if (o.cursor && n < cs.length + 1) { ctx.fillStyle = o.color || INK; ctx.fillRect(cx + 3, y - size * 0.78, size * 0.5, size * 0.9); }
  ctx.restore();
  return cx - x;
}
// 卡片底：投影、泛黄渐变、横线、左侧红线
function card(ctx, x, y, w, h, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  if (o.rot) { ctx.translate(w / 2, h / 2); ctx.rotate(o.rot); ctx.translate(-w / 2, -h / 2); }
  if (o.scale != null && o.scale !== 1) { ctx.translate(w / 2, h / 2); ctx.scale(o.scale, o.scale); ctx.translate(-w / 2, -h / 2); }
  const path = cardPath(w, h, o.seed || 7);
  P.piece(ctx, path, '#f1dcaa', { blur: o.blur || 18, dy: o.dy || 9, color: 'rgba(60,35,10,0.45)' });
  ctx.save(); ctx.clip(path);
  const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 20, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(255,246,214,0.85)'); g.addColorStop(0.7, 'rgba(242,222,170,0.2)'); g.addColorStop(1, 'rgba(196,150,80,0.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (o.tint > 0.01) { ctx.fillStyle = `rgba(214,52,34,${clamp(o.tint)})`; ctx.fillRect(0, 0, w, h); }
  if (o.ruled) {
    ctx.strokeStyle = 'rgba(150,120,80,0.28)'; ctx.lineWidth = 2;
    for (let yy = o.ruled[0]; yy < h - 10; yy += o.ruled[1]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,80,60,0.55)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(44, h); ctx.stroke();
  }
  ctx.restore();
  if (o.inner) o.inner(ctx);
  ctx.restore();
}

// 手绘勾、圈
function tick(ctx, x, y, s, p, col = '#3d8a3a') {
  if (p <= 0.01) return;
  const pts = [[x - s * 0.5, y - s * 0.05], [x - s * 0.12, y + s * 0.35], [x + s * 0.6, y - s * 0.55]];
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const q = K.partial(pts, easeOut(p));
  if (q.length > 1) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [a, b] of q.slice(1)) ctx.lineTo(a, b); ctx.stroke(); }
  ctx.restore();
}
function circle(ctx, cx, cy, rx, ry, p, col = '#c8321f', w = 6) {
  if (p <= 0.01) return;
  const pts = [];
  for (let k = 0; k <= 80; k++) { const u = k / 80, a = -2.6 + u * Math.PI * 2.15; const r = 1 + 0.04 * Math.sin(u * 9) + u * 0.06; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const q = K.partial(pts, easeOut(p));
  if (q.length > 1) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [a, b] of q.slice(1)) ctx.lineTo(a, b); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); }
  ctx.restore();
}

// 对话气泡：x,y 是气泡中心；tail 指向说话的人
function bubble(ctx, o) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  const size = o.size || 54;
  ctx.save();
  ctx.font = `700 ${size}px Sans`;
  const tw = ctx.measureText(o.text).width, w = tw + size * 1.2, h = size * 1.75;
  const pop = o.pop == null ? 1 : o.pop;
  const sc = 0.6 + 0.4 * pop + Math.sin(clamp(pop) * Math.PI) * 0.08;
  ctx.globalAlpha = a * clamp(pop * 1.5);
  ctx.translate(o.x, o.y); ctx.scale(sc, sc); ctx.rotate(o.rot || 0);
  const p = new Path2D();
  const [tx, ty] = o.tail ? [(o.tail[0] - o.x) / sc, (o.tail[1] - o.y) / sc] : [0, h];
  if (o.shout) {
    const n = 22;
    for (let k = 0; k < n * 2; k++) {
      const ang = k / (n * 2) * Math.PI * 2, r = k % 2 ? 1 : 1.16 + 0.05 * Math.sin(k * 2.3);
      const px = Math.cos(ang) * (w / 2 + 18) * r, py = Math.sin(ang) * (h / 2 + 16) * r;
      k ? p.lineTo(px, py) : p.moveTo(px, py);
    }
    p.closePath();
  } else {
    p.roundRect(-w / 2, -h / 2, w, h, h * 0.42);
  }
  // 尾巴
  const bx = clamp(tx * 0.25, -w / 2 + 40, w / 2 - 40);
  const tail = new Path2D();
  tail.moveTo(bx - 26, ty > 0 ? h / 2 - 6 : -h / 2 + 6); tail.lineTo(tx * 0.62, ty * 0.62); tail.lineTo(bx + 26, ty > 0 ? h / 2 - 6 : -h / 2 + 6); tail.closePath();
  const fill = o.shout ? '#fff1cf' : '#fffaf0', edge = o.shout ? '#b8361f' : '#2b2118';
  ctx.shadowColor = 'rgba(50,28,8,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 7;
  ctx.fillStyle = fill; ctx.fill(p); ctx.fill(tail);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4.5; ctx.strokeStyle = edge; ctx.lineJoin = 'round';
  ctx.stroke(p); ctx.stroke(tail);
  ctx.fillStyle = fill; ctx.fill(p);
  ctx.beginPath(); ctx.moveTo(bx - 22, ty > 0 ? h / 2 - 3 : -h / 2 + 3); ctx.lineTo(bx + 22, ty > 0 ? h / 2 - 3 : -h / 2 + 3); ctx.lineWidth = 7; ctx.strokeStyle = fill; ctx.stroke();
  ctx.fillStyle = o.shout ? '#9a2a16' : '#2b2118'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.text, 0, size * 0.04);
  ctx.restore();
}

module.exports = { codeLine, card, tick, circle, bubble, CODE, INK, IF };
