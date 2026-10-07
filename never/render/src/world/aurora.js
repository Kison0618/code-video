// 场景五（第一次 drop）：极光。几道光帘在雪山上空舒展、折叠，湖面倒映整片天空；
// 每一拍有一道亮波沿着光帘跑过去（不是闪），重拍时偶尔划过一颗流星；后半段两颗彗星并肩飞过
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, glowLine, mulberry32, hash, noise1 } = K;
const A = require('../audio');
const FX = require('../fx');
const { camera } = require('../cam');

const SKY = new Canvas(W, H), SKYF = new Canvas(W, H);
// 光帘的一根"光柱"：底边最亮，往上褪成紫色
function raySprite(bottom, midc, top) {
  const cv = new Canvas(8, 512), x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 512, 0, 0);
  g.addColorStop(0, rgba(bottom, 0)); g.addColorStop(0.03, rgba(bottom, 0.95)); g.addColorStop(0.12, rgba(midc, 0.7));
  g.addColorStop(0.45, rgba(mix(midc, top, 0.5), 0.32)); g.addColorStop(0.8, rgba(top, 0.12)); g.addColorStop(1, rgba(top, 0));
  x.fillStyle = g; x.fillRect(0, 0, 8, 512);
  const f = new Canvas(8, 512); FX.flatten(cv, f); return f;
}
const RAY_G = raySprite([170, 255, 200], [60, 230, 140], [150, 80, 230]);
const RAY_P = raySprite([255, 170, 220], [230, 90, 170], [120, 80, 240]);
const RAY_C = raySprite([180, 240, 255], [70, 190, 230], [110, 90, 230]);

const CURTAINS = [
  { z: 9000, amp: 3000, fr: 0.00019, ph: 0.3, base: 2600, tall: 4200, spr: RAY_G, a: 0.85, from: 0 },
  { z: 15000, amp: 4500, fr: 0.00013, ph: 2.1, base: 3200, tall: 5200, spr: RAY_G, a: 0.6, from: 0 },
  { z: 7600, amp: 2000, fr: 0.00027, ph: 4.0, base: 2200, tall: 3000, spr: RAY_C, a: 0.55, from: 4 },
  { z: 12000, amp: 3500, fr: 0.00017, ph: 5.2, base: 3000, tall: 4800, spr: RAY_P, a: 0.7, from: 8 },
];
const NRAY = 240, XSPAN = 30000;
const STARS = (() => { const r = mulberry32(21); return Array.from({ length: 3000 }, () => { const az = (r() - 0.5) * 2.4, el = Math.asin(r() * 0.95); return [Math.sin(az) * Math.cos(el) * 1e5, Math.sin(el) * 1e5, Math.cos(az) * Math.cos(el) * 1e5, 0.3 + r() * 0.7, r() * 6.28]; }); })();
function fbm(x, s) { return noise1(x, s) * 0.55 + noise1(x * 2.1, s + 3) * 0.28 + noise1(x * 4.3, s + 7) * 0.12 + noise1(x * 9.1, s + 11) * 0.05; }
const RIDGES = [
  { z: 16000, h: 3400, sc: 0.00016, s: 1, col: [30, 46, 72], snow: 0.6 },
  { z: 9500, h: 1700, sc: 0.00028, s: 2, col: [14, 22, 40], snow: 0.3 },
  { z: 5200, h: 560, sc: 0.0006, s: 3, col: [6, 10, 20], snow: 0.12 },
];

function curtainZ(c, x, t) { return c.z + c.amp * Math.sin(x * c.fr + c.ph + t * 0.07) + 500 * noise1(x * 0.0006 + t * 0.05, c.ph); }

// 雪山：三层山脊，近处更暗，山顶有一点极光照的反光
function ridge(sx, R, P, cx, hy) {
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const x = cx + (i / 160 - 0.5) * R.z * 2.6;
    const n = fbm(x * R.sc, R.s), h = R.h * (0.2 + 0.8 * Math.pow(1 - Math.abs(n), 2.2)) * (0.75 + 0.25 * noise1(x * R.sc * 0.3, R.s + 5));
    const q = P([x, h, R.z]); if (q) pts.push(q);
  }
  if (pts.length < 2) return;
  sx.beginPath(); sx.moveTo(pts[0][0], hy + 2);
  for (const q of pts) sx.lineTo(q[0], q[1]);
  sx.lineTo(pts[pts.length - 1][0], hy + 2); sx.closePath();
  const mg = sx.createLinearGradient(0, hy - R.h * 1050 / R.z, 0, hy);
  mg.addColorStop(0, rgba(mix(R.col, [150, 200, 200], R.snow))); mg.addColorStop(0.3, rgba(mix(R.col, [90, 140, 150], R.snow * 0.4))); mg.addColorStop(0.6, rgba(R.col)); mg.addColorStop(1, rgba(mix(R.col, [0, 0, 0], 0.4)));
  sx.fillStyle = mg; sx.fill();
  sx.save(); sx.globalCompositeOperation = 'lighter';
  sx.strokeStyle = rgba([110, 255, 190], 0.12 * R.snow + 0.04); sx.lineWidth = 1.2;
  sx.beginPath(); pts.forEach((q, k) => (k ? sx.lineTo(q[0], q[1]) : sx.moveTo(q[0], q[1]))); sx.stroke();
  sx.restore();
}

function draw(ctx, t, S) {
  const local = t - S.t0, u = S.u;
  const mid = A.env('mid', t), rms = A.env('rms', t);
  const cx = lerp(-600, 600, easeInOut(u));
  const P = camera({ x: cx, y: 40, z: lerp(0, 1200, u), yaw: 0.05 * Math.sin(local * 0.06), pitch: 0.17, f: 1050 });
  const hz = P([cx, 40, 1e7]); const hy = hz ? hz[1] : H * 0.66;

  const sx = SKY.getContext('2d'); sx.reset();
  const g = sx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, 'rgb(3,5,16)'); g.addColorStop(0.65, 'rgb(6,16,34)'); g.addColorStop(1, 'rgb(14,40,52)');
  sx.fillStyle = g; sx.fillRect(0, 0, W, hy + 2);
  // 星
  sx.save(); sx.globalCompositeOperation = 'lighter';
  for (const s of STARS) {
    const q = P(s); if (!q || q[1] > hy) continue;
    sx.fillStyle = rgba(C.white, s[3] * (0.6 + 0.4 * Math.sin(t * 1.3 + s[4])));
    sx.fillRect(q[0], q[1], 1.6, 1.6);
  }
  sx.restore();

  // 极光把低空照亮的一层薄光
  const air = sx.createLinearGradient(0, hy - 420, 0, hy);
  air.addColorStop(0, 'rgba(40,140,120,0)'); air.addColorStop(0.6, rgba([40, 150, 125], 0.16 + 0.12 * rms)); air.addColorStop(1, rgba([70, 120, 150], 0.22));
  sx.save(); sx.globalCompositeOperation = 'lighter'; sx.fillStyle = air; sx.fillRect(0, hy - 420, W, 420); sx.restore();
  ridge(sx, RIDGES[0], P, cx, hy);   // 最远的山在光帘后面
  // 光帘
  sx.save(); sx.globalCompositeOperation = 'lighter';
  const bk = Math.floor(A.beatF(t));
  for (const c of CURTAINS) {
    const ca = c.a * smooth(prog(local, c.from, c.from + 3)) * (0.75 + 0.45 * rms);
    if (ca < 0.01) continue;
    let prev = null;
    for (let i = 0; i <= NRAY; i++) {
      const s = i / NRAY, x = cx + (s - 0.5) * XSPAN;
      const z = curtainZ(c, x, t) + (u * 1200);
      const top = c.base + c.tall * (0.55 + 0.45 * fbm(x * 0.0004 + t * 0.03, c.ph));
      const b0 = P([x, c.base, z]), b1 = P([x, top, z]);
      if (!b0 || !b1) { prev = null; continue; }
      // 侧着看的地方光帘叠得更厚，所以更亮
      let fold = 0.6;
      if (prev) fold = 0.45 + 0.9 * clamp(Math.abs(prev[1] - z) / (XSPAN / NRAY) * 0.25);
      prev = [x, z];
      // 光柱的明暗在帘上流动
      let br = (0.35 + 0.65 * Math.pow(0.5 + 0.5 * fbm(x * 0.0011 - t * 0.35, c.ph + 9), 1.6)) * fold;
      // 每一拍：一道亮波从画面中间往两边跑开
      for (let k = bk; k > bk - 3; k--) {
        const age = t - A.beatT(k); if (age < 0) continue;
        const front = age * 9000, d = Math.abs(x - cx) - front;
        br += 0.55 * Math.exp(-d * d / 4e6) * Math.exp(-age * 1.4) * (0.4 + A.env('sub', A.beatT(k) + 0.08));
      }
      const wpx = Math.max(3, (XSPAN / NRAY) * b0[2] * 3.4);
      sx.globalAlpha = clamp(ca * br * 0.3);
      sx.drawImage(c.spr, b0[0] - wpx / 2, b1[1], wpx, b0[1] - b1[1]);
    }
  }
  sx.restore();

  // 流星：每两小节的重拍
  for (let n = 49; n < 64; n += 2) {
    const t0 = A.barT(n), age = t - t0; if (age < 0 || age > 0.9) continue;
    const r = mulberry32(n * 13), x0 = W * (0.15 + 0.7 * r()), y0 = H * (0.05 + 0.2 * r()), ang = 0.5 + r() * 0.5, len = 380 + r() * 300;
    const head = smooth(age / 0.7), tail = smooth((age - 0.2) / 0.7);
    const p = k => [x0 + Math.cos(ang) * len * k * (r() < 2 ? 1 : 1), y0 + Math.sin(ang) * len * k];
    glowLine(sx, [p(tail), p(head)], C.ice, 0.9 * (1 - smooth((age - 0.6) / 0.3)), 1.4, 0.8);
  }
  // 两颗彗星（我们），后半段并肩划过天空
  const cu = prog(local, 15, 30);
  if (cu > 0 && cu < 1) {
    for (const [off, col] of [[0, C.gold], [1, C.ice]]) {
      const pts = [];
      for (let k = 0; k < 40; k++) {
        const v = cu - k * 0.004;
        pts.push([lerp(-100, W + 100, v), H * (0.32 - 0.18 * Math.sin(v * 3.1)) + off * 34 * (1 - 0.6 * v)]);
      }
      glowLine(sx, pts, col, 0.55, 2, 1.4);
      glow(sx, pts[0][0], pts[0][1], 40, col, 0.8);
      glow(sx, pts[0][0], pts[0][1], 10, C.white, 1);
    }
  }

  for (const R of RIDGES.slice(1)) ridge(sx, R, P, cx, hy);
  // 湖面上的薄雾
  const mist = sx.createLinearGradient(0, hy - 60, 0, hy + 2);
  mist.addColorStop(0, 'rgba(60,120,130,0)'); mist.addColorStop(1, 'rgba(60,120,130,0.22)');
  sx.fillStyle = mist; sx.fillRect(0, hy - 60, W, 62);

  FX.flatten(SKY, SKYF);
  ctx.drawImage(SKYF, 0, 0, W, Math.ceil(hy) + 1, 0, 0, W, Math.ceil(hy) + 1);
  // 湖：倒影按行错开，像被微风吹皱
  const wy = Math.ceil(hy);
  ctx.fillStyle = 'rgb(2,5,10)'; ctx.fillRect(0, wy, W, H - wy);
  ctx.save(); ctx.globalAlpha = 0.8;
  for (let y = wy; y < H; y += 3) {
    const d = y - hy, sy = hy - d - 3; if (sy < 0) break;
    const dx = Math.sin(y * 0.09 + t * 1.6) * (1.5 + d * 0.025) + Math.sin(y * 0.023 - t * 0.7) * d * 0.02;
    ctx.drawImage(SKYF, 0, sy, W, 3, dx, y, W, 3);
  }
  ctx.restore();
  const wg = ctx.createLinearGradient(0, wy, 0, H);
  wg.addColorStop(0, 'rgba(0,4,10,0.05)'); wg.addColorStop(1, 'rgba(0,3,8,0.45)');
  ctx.fillStyle = wg; ctx.fillRect(0, wy, W, H - wy);
  // 岸边一线微光
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(120,220,200,0.08)'; ctx.fillRect(0, wy - 1, W, 2);
  ctx.restore();
}
module.exports = { draw, lyricStyle: { y: H - 110, size: 48, glowCol: [80, 230, 160] } };
