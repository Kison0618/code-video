// 底：深蓝黑渐变 + 中间一点暖光 + 缓慢飘动的尘埃（远处的虚、近处的实）
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, glow, mulberry32, clamp } = K;

const BASE = (() => {
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgb(10,12,18)'); g.addColorStop(0.55, 'rgb(8,9,13)'); g.addColorStop(1, 'rgb(6,6,9)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.6);
  r.addColorStop(0, 'rgba(70,56,36,0.22)'); r.addColorStop(0.5, 'rgba(30,30,44,0.12)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = r; x.fillRect(0, 0, W, H);
  return cv;
})();

const DUST = (() => {
  const r = mulberry32(2020), out = [];
  for (let i = 0; i < 260; i++) {
    const z = r();                          // 0 远 … 1 近
    out.push({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 6, vy: -2 - r() * 7 * (0.4 + z), z, ph: r() * 6.28, warm: r() < 0.7 });
  }
  return out;
})();

// warm：尘埃的暖色程度；amt：整体亮度
function draw(ctx, t, o = {}) {
  const { amt = 1, cold = 0 } = o;
  ctx.drawImage(BASE, 0, 0);
  if (cold > 0) glow(ctx, W / 2, H * 0.45, W * 0.55, [30, 70, 110], 0.18 * cold);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const d of DUST) {
    const x = ((d.x + d.vx * t) % W + W) % W, y = ((d.y + d.vy * t) % H + H) % H;
    const tw = 0.55 + 0.45 * Math.sin(t * 0.8 + d.ph);
    const col = d.warm ? [230, 196, 140] : [170, 190, 220];
    if (d.z > 0.93) glow(ctx, x, y, 26 + 30 * d.z, col, 0.05 * tw * amt);          // 近处虚化的大颗粒
    else { ctx.fillStyle = rgba(col, clamp((0.12 + 0.4 * d.z) * tw * amt)); const s = 0.8 + 1.6 * d.z; ctx.fillRect(x, y, s, s); }
  }
  ctx.restore();
}
module.exports = { draw };
