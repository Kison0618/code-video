// 场景二：雨夜的窗。玻璃上的雨滴和滑落的水痕，窗外的城市虚成大大小小的光斑；两个光斑挨在一起
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, glow, mulberry32, hash } = K;
const A = require('../audio');
const FX = require('../fx');
const BG = new Canvas(W, H), BGF = new Canvas(W, H);
const MW = 240, MH = 135, MINI = new Canvas(MW, MH), MINIF = new Canvas(MW, MH);   // 雨滴里的倒影用小图

const BOKEH = (() => {
  const r = mulberry32(12);
  return Array.from({ length: 70 }, () => ({
    x: r() * W, y: H * 0.25 + r() * H * 0.7, rad: 30 + Math.pow(r(), 2) * 120,
    col: [[255, 170, 90], [255, 120, 80], [120, 170, 255], [255, 220, 170], [200, 120, 255]][Math.floor(r() * 5)],
    a: 0.12 + r() * 0.25, ph: r() * 6.28, sp: 0.2 + r() * 0.5, drift: (r() - 0.5) * 6,
  }));
})();
// 静止的小水珠
const BEADS = (() => { const r = mulberry32(5); return Array.from({ length: 300 }, () => ({ x: r() * W, y: r() * H, rad: 3 + Math.pow(r(), 2.5) * 22, sq: 0.85 + r() * 0.3 })); })();
// 滑落的水滴：每条有自己的出发时间和路径
const RUNS = (() => { const r = mulberry32(9); return Array.from({ length: 18 }, () => ({ x: r() * W, t0: r() * 16, sp: 120 + r() * 260, rad: 10 + r() * 10, wob: r() * 6.28, period: 4 + r() * 6 })); })();

function bokehDisc(ctx, x, y, rad, col, a) {
  // 镜头焦外的光斑：边缘略亮的圆盘
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, rgba(col, a * 0.55)); g.addColorStop(0.82, rgba(col, a * 0.7)); g.addColorStop(0.95, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// 一颗会折射的水滴：把窗外的画面缩小、倒过来贴进圆里，再加暗边和高光
function drop(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.clip();
  // 整个窗外的景象被压进一颗水滴里，上下左右都颠倒（真实的雨滴就是这样折射的）
  const sc = (2.6 * rx) / MW;
  ctx.translate(x, y); ctx.scale(-sc, -sc * (ry / rx));
  ctx.drawImage(MINIF, -MW / 2, -MH / 2);
  ctx.restore();
  ctx.save();
  const g = ctx.createRadialGradient(x, y, Math.min(rx, ry) * 0.55, x, y, Math.max(rx, ry));
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(x - rx * 0.35, y - ry * 0.4, rx * 0.18, ry * 0.12, -0.5, 0, 6.2832); ctx.fill();
  ctx.restore();
}

function draw(ctx0, t, S) {
  const local = t - S.t0;
  const mid = A.env('mid', t), hi = A.env('high', t);
  const ctx = BG.getContext('2d'); ctx.reset();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgb(8,10,24)'); g.addColorStop(1, 'rgb(20,14,26)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 窗外：虚焦的城市灯
  for (const b of BOKEH) {
    const a = b.a * (0.7 + 0.3 * Math.sin(t * b.sp + b.ph)) * (0.8 + 0.4 * mid);
    bokehDisc(ctx, b.x + b.drift * local, b.y, b.rad, b.col, a);
  }
  // 我们：窗外两盏挨在一起的灯
  const sep = lerp(220, 70, smooth(prog(local, 0, 14)));
  bokehDisc(ctx, W * 0.62 - sep / 2, H * 0.48, 150, C.gold, 0.32);
  bokehDisc(ctx, W * 0.62 + sep / 2, H * 0.5, 140, C.ice, 0.28);
  // 玻璃的冷色反光
  const sh = ctx.createLinearGradient(0, 0, W, H);
  sh.addColorStop(0, 'rgba(120,150,200,0.06)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,150,200,0.04)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);

  FX.flatten(BG, BGF);
  const mx = MINI.getContext('2d'); mx.reset(); mx.drawImage(BGF, 0, 0, MW, MH); FX.flatten(MINI, MINIF);
  // 玻璃后面的景象稍微虚一点，雨滴里的倒影是清楚的
  ctx0.save(); ctx0.filter = 'blur(2px)'; ctx0.drawImage(BGF, 0, 0); ctx0.restore();
  for (const d of BEADS) drop(ctx0, d.x, d.y, d.rad, d.rad * d.sq);
  // 滑落的水滴和身后的水痕
  for (const r of RUNS) {
    const ph = ((local + r.t0) % r.period) / r.period;
    const y = -40 + ph * (H + 120) * (r.sp / 260);
    if (y > H + 40) continue;
    const x = r.x + Math.sin(y * 0.02 + r.wob) * 6;
    ctx0.save();
    const tr = ctx0.createLinearGradient(x, y - 300, x, y);
    tr.addColorStop(0, 'rgba(200,215,255,0)'); tr.addColorStop(1, 'rgba(200,215,255,0.16)');
    ctx0.strokeStyle = tr; ctx0.lineWidth = r.rad * 0.6; ctx0.lineCap = 'round';
    ctx0.beginPath(); ctx0.moveTo(x - Math.sin((y - 300) * 0.02 + r.wob) * 6, y - 300); ctx0.lineTo(x, y); ctx0.stroke();
    ctx0.restore();
    drop(ctx0, x, y, r.rad, r.rad * 1.2);
  }
}
module.exports = { draw, lyricStyle: { y: H / 2 + 20, size: 58, glowCol: C.gold } };
