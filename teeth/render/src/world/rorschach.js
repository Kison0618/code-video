// 墨迹测试（罗夏测验）：对折的纸上，青、品红、紫三种墨水晕开，左右完全对称。
// 每一下跺脚滴下一滴新墨，在纸上晕开、和旁边的墨融在一起；边缘像干掉的墨水一样更深更亮。
// 同一团墨，你看到的是蝴蝶、两张对视的脸，还是一张嘴？
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, clamp, lerp, prog, smooth, glow, mulberry32 } = K;
const A = require('../audio');
const { ImageData } = require('skia-canvas');

const RW = 384, RH = 216, HALF = RW / 2;
const FIELD = new Canvas(RW, RH), fx = FIELD.getContext('2d');
const BUF = new Uint8ClampedArray(RW * RH * 4);
// 平滑噪声（让墨迹边缘不规则）
const NG = 64, NOISE = (() => { const r = mulberry32(5), a = new Float32Array(NG * NG); for (let i = 0; i < a.length; i++) a[i] = r(); return a; })();
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const g = (i, j) => NOISE[((j & 63) * NG) + (i & 63)];
  return lerp(lerp(g(xi, yi), g(xi + 1, yi), u), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u), v);
}
const INKS = [[60, 215, 230], [255, 60, 160], [140, 90, 255]];
// 墨滴：一部分开场就在，其余在鼓点上落下
const DROPS = (() => {
  const r = mulberry32(42), out = [];
  const t0 = A.beatT(46);
  for (let i = 0; i < 5; i++) out.push({ x: HALF * (0.55 + r() * 0.45), y: RH * (0.3 + r() * 0.4), R: 18 + r() * 16, t: t0 + i * 0.3, ink: i % 3 });
  let n = 0;
  for (let k = 48; k < 464; k++) if (A.isHit(k) && (k < 112 || k >= 368)) {
    n++;
    const nearFold = r() < 0.6;
    const d = { x: nearFold ? HALF * (0.72 + r() * 0.28) : HALF * (0.25 + r() * 0.55), y: RH * (0.18 + r() * 0.64), R: 9 + r() * 14 * A.hitAt(k), t: A.beatT(k), ink: n % 3 === 0 ? 2 : n % 2 };
    out.push(d);
    // 溅出的小墨点
    for (let j = 0; j < 4; j++) { const a = r() * 6.28, dd = d.R * (1.3 + r() * 1.4); out.push({ x: Math.min(HALF, d.x + Math.cos(a) * dd), y: d.y + Math.sin(a) * dd, R: 2 + r() * 4, t: d.t + 0.05, ink: d.ink }); }
  }
  return out;
})();

function draw(ctx, t, S) {
  const mid = A.env('mid', t);
  // 纸：很暗的墨蓝，带一点纤维
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
  bg.addColorStop(0, 'rgb(20,18,32)'); bg.addColorStop(1, 'rgb(6,6,12)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // 只用本段落里落下的墨；最后的副歌里旧墨会慢慢干掉、缩小，免得铺满整张纸
  const fin = S.name === 'final' || S.name === 'outro';
  const live = DROPS.filter(d => d.t <= t && d.t >= S.t0 - 2.5 && (!fin || t - d.t < 11)).map(d => {
    const age = t - d.t;
    const fade = fin ? 1 - smooth((age - 7) / 4) : 1;
    return { ...d, r: (d.R * (1 - Math.exp(-age * 2.2)) * (1 + 0.08 * Math.sin(age * 0.7)) + age * 0.25) * fade };
  }).filter(d => d.r > 0.5);
  const tt = t * 0.15;
  for (let y = 0; y < RH; y++) {
    for (let x = 0; x < HALF; x++) {
      // 边缘扰动
      const wx = x + (vnoise(x * 0.05 + tt, y * 0.05) - 0.5) * 12 + (vnoise(x * 0.2, y * 0.2 + tt) - 0.5) * 4;
      const wy = y + (vnoise(x * 0.05 + 17, y * 0.05 - tt) - 0.5) * 12 + (vnoise(x * 0.2 + 9, y * 0.2) - 0.5) * 4;
      let F = 0, r0 = 0, g0 = 0, b0 = 0;
      for (const d of live) {
        const dx = wx - d.x, dy = wy - d.y, q = (dx * dx + dy * dy) / (4 * d.r * d.r);
        if (q >= 1) continue;
        const f = 2.37 * (1 - q) * (1 - q) * (1 - q);   // 有限半径的"墨团"核：d = r 处正好等于 1
        F += f; const c = INKS[d.ink]; r0 += c[0] * f; g0 += c[1] * f; b0 += c[2] * f;
      }
      const o = (y * RW + x) * 4, om = (y * RW + (RW - 1 - x)) * 4;
      if (F < 0.5) { BUF[o + 3] = BUF[om + 3] = 0; continue; }
      const a = clamp((F - 0.8) / 0.25);
      const edge = Math.exp(-Math.pow((F - 1.05) / 0.25, 2));          // 干掉的墨边更亮
      const core = clamp((F - 2) / 6);                                  // 中心更深
      const k = (0.5 + 0.9 * edge - 0.25 * core) * (0.85 + 0.3 * mid) / F;
      const fib = 0.9 + 0.2 * vnoise(x * 0.9, y * 0.9);                 // 纸纤维的颗粒
      const R = clamp(r0 * k * fib, 0, 255), G = clamp(g0 * k * fib, 0, 255), B = clamp(b0 * k * fib, 0, 255);
      BUF[o] = BUF[om] = R; BUF[o + 1] = BUF[om + 1] = G; BUF[o + 2] = BUF[om + 2] = B; BUF[o + 3] = BUF[om + 3] = a * 255;
    }
  }
  fx.reset();
  fx.putImageData(new ImageData(BUF, RW, RH), 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(FIELD, 0, 0, W, H);
  ctx.restore();
  // 对折线
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fg = ctx.createLinearGradient(0, 0, 0, H);
  fg.addColorStop(0, 'rgba(236,226,206,0)'); fg.addColorStop(0.5, 'rgba(236,226,206,0.16)'); fg.addColorStop(1, 'rgba(236,226,206,0)');
  ctx.fillStyle = fg; ctx.fillRect(W / 2 - 1, 0, 2, H);
  ctx.restore();
  // 刚落下的墨滴：一点溅开的光
  for (const d of DROPS) {
    const age = t - d.t; if (age < 0 || age > 0.6) continue;
    const a = 1 - age / 0.6, c = INKS[d.ink];
    for (const sx of [d.x, RW - 1 - d.x]) glow(ctx, sx * W / RW, d.y * H / RH, 30 + 80 * age, c, 0.5 * a);
  }
}
const lyricStyle = () => ({ y: H - 120, size: 44, accent: C.cyan });
module.exports = { draw, lyricStyle };
