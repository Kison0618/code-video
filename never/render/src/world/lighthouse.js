// 场景七（再次铺垫）：夜海。一张由几千个顶点组成的海面，四组波叠在一起起伏，浪随音乐一点点变高；
// 月光在浪尖上碎成一条光路，远处灯塔的光柱每两小节扫过来一次；两盏船灯在海上慢慢靠近
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, mulberry32, noise1 } = K;
const A = require('../audio');
const { camera } = require('../cam');

const NX = 120, NZ = 64;
const ZS = Array.from({ length: NZ }, (_, j) => 120 * Math.pow(90, j / (NZ - 1)));   // 120 → 10800，近密远疏
const WAVES = [
  { k: 0.0042, dir: [0.9, 0.44], amp: 26, sp: 1.1 },
  { k: 0.0071, dir: [-0.5, 0.87], amp: 14, sp: 1.5 },
  { k: 0.013, dir: [0.2, 0.98], amp: 7, sp: 2.1 },
  { k: 0.023, dir: [0.75, -0.66], amp: 3.5, sp: 2.8 },
];
function wave(x, z, t, A0) {
  let h = 0, dx = 0, dz = 0;
  for (const w of WAVES) {
    const ph = w.k * (x * w.dir[0] + z * w.dir[1]) - t * w.sp * Math.sqrt(w.k * 400);
    const s = Math.sin(ph), c = Math.cos(ph);
    // 尖一点的浪：sin 的正半段更尖
    h += w.amp * A0 * (s + 0.35 * s * s);
    dx += w.amp * A0 * w.k * w.dir[0] * c * (1 + 0.7 * s);
    dz += w.amp * A0 * w.k * w.dir[1] * c * (1 + 0.7 * s);
  }
  return [h, dx, dz];
}
const STARS = (() => { const r = mulberry32(8); return Array.from({ length: 900 }, () => [r() * W, r() * H * 0.55, 0.3 + r() * 0.7, r() * 6.28]); })();
const CLOUDS = (() => { const r = mulberry32(15); return Array.from({ length: 26 }, () => ({ x: r() * W * 1.6 - W * 0.3, y: H * (0.05 + r() * 0.35), w: 300 + r() * 500, h: 40 + r() * 70, sp: 6 + r() * 12, a: 0.25 + r() * 0.3 })); })();

function draw(ctx, t, S) {
  const local = t - S.t0, u = S.u;
  const mid = A.env('mid', t), rms = A.env('rms', t);
  const amp = lerp(0.7, 2.1, smooth(u)) * (0.9 + 0.2 * rms);   // 浪随着铺垫一点点变大
  const camZ = local * 70;
  const bob = 6 * Math.sin(local * 0.7);
  const camY = 50 + 70 * amp + bob;
  const P = camera({ x: 0, y: camY, z: camZ, yaw: 0.04 * Math.sin(local * 0.09), pitch: 0.02 - 0.03 * amp, f: 1000 });
  const hz = P([0, camY, camZ + 1e7]); const hy = hz ? hz[1] : H / 2;
  const moonX = W * 0.5 + 120, moonY = hy - 300;

  // 天空 + 月 + 云
  const g = ctx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, 'rgb(4,6,18)'); g.addColorStop(0.7, 'rgb(14,22,46)'); g.addColorStop(1, 'rgb(34,46,74)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of STARS) if (s[1] < hy - 20) { ctx.fillStyle = rgba(C.white, s[2] * (0.5 + 0.5 * Math.sin(t + s[3])) * 0.7); ctx.fillRect(s[0], s[1], 1.5, 1.5); }
  glow(ctx, moonX, moonY, 420, [120, 150, 210], 0.22);
  glow(ctx, moonX, moonY, 110, [220, 230, 255], 0.25);
  ctx.restore();
  ctx.fillStyle = 'rgb(236,240,255)'; ctx.beginPath(); ctx.arc(moonX, moonY, 34, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(160,170,200,0.25)';
  for (const [dx, dy, r] of [[-10, -8, 9], [8, 6, 6], [12, -12, 4], [-6, 14, 5]]) { ctx.beginPath(); ctx.arc(moonX + dx, moonY + dy, r, 0, 6.2832); ctx.fill(); }
  for (const c of CLOUDS) {
    const x = ((c.x + c.sp * local) % (W * 1.6)) - W * 0.3;
    const cg = ctx.createRadialGradient(x, c.y, 0, x, c.y, c.w / 2);
    const lit = clamp(1 - Math.hypot(x - moonX, c.y - moonY) / 700);
    cg.addColorStop(0, rgba(mix([20, 26, 48], [90, 100, 140], lit), c.a)); cg.addColorStop(1, rgba([20, 26, 48], 0));
    ctx.save(); ctx.translate(x, c.y); ctx.scale(1, c.h / c.w); ctx.translate(-x, -c.y);
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, c.y, c.w / 2, 0, 6.2832); ctx.fill(); ctx.restore();
  }

  // 远处的灯塔：岛、塔身、灯
  const LH = [2600, 0, camZ * 0 + 7400];
  const base = P(LH), top = P([LH[0], 260, LH[2]]);
  let beam = 0;
  if (base && top) {
    ctx.fillStyle = 'rgb(6,9,18)';
    ctx.beginPath(); ctx.moveTo(base[0] - 160 * base[2] * 3, base[1] + 4);
    ctx.quadraticCurveTo(base[0] - 40 * base[2] * 3, base[1] - 50 * base[2] * 3, base[0], base[1] - 70 * base[2] * 3);
    ctx.quadraticCurveTo(base[0] + 60 * base[2] * 3, base[1] - 40 * base[2] * 3, base[0] + 200 * base[2] * 3, base[1] + 4); ctx.fill();
    const tw = 9 * top[2] * 3, bw = 15 * base[2] * 3;
    ctx.fillStyle = 'rgb(16,20,32)';
    ctx.beginPath(); ctx.moveTo(base[0] - bw, base[1] - 50 * base[2] * 3); ctx.lineTo(top[0] - tw, top[1]); ctx.lineTo(top[0] + tw, top[1]); ctx.lineTo(base[0] + bw, base[1] - 50 * base[2] * 3); ctx.fill();
    // 光柱：转一圈 = 两小节，正对镜头时在重拍上
    const ang = ((A.barF(t) / 2) % 1) * 6.2832;           // 0 = 对着镜头
    const facing = Math.cos(ang), side = Math.sin(ang);
    beam = Math.pow(Math.max(0, facing), 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const len = 1700 * Math.abs(side) + 200, dirx = side > 0 ? -1 : 1;
    const bg = ctx.createLinearGradient(top[0], top[1], top[0] + dirx * len, top[1] + 30);
    bg.addColorStop(0, rgba([255, 230, 170], 0.28 * (1 - beam * 0.5))); bg.addColorStop(1, rgba([255, 230, 170], 0));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0] + dirx * len, top[1] - 110 * (0.4 + Math.abs(side))); ctx.lineTo(top[0] + dirx * len, top[1] + 110 * (0.4 + Math.abs(side))); ctx.closePath(); ctx.fill();
    ctx.restore();
    glow(ctx, top[0], top[1], 30 + 70 * beam, [255, 225, 160], 0.5 + 0.3 * beam);
    glow(ctx, top[0], top[1], 8, C.white, 1);
  }
  // 海平线的薄雾
  const mist = ctx.createLinearGradient(0, hy - 50, 0, hy + 40);
  mist.addColorStop(0, 'rgba(60,76,110,0)'); mist.addColorStop(0.55, 'rgba(60,76,110,0.35)'); mist.addColorStop(1, 'rgba(20,28,46,0)');
  ctx.fillStyle = mist; ctx.fillRect(0, hy - 50, W, 90);

  // 海面：从远到近一行一行画，每行先用暗色填到底（挡住后面的行），再描亮线
  const XW = j => ZS[j] * 1.25 + 300;
  const row = new Array(NX + 1);
  for (let j = NZ - 1; j >= 0; j--) {
    const z = camZ + ZS[j], xw = XW(j);
    const fog = clamp(1 - ZS[j] / 11000);
    let ok = true;
    for (let i = 0; i <= NX; i++) {
      const x = (i / NX - 0.5) * 2 * xw;
      const [h, dx, dz] = wave(x, z, t, amp);
      const q = P([x, h, z]); if (!q) { ok = false; break; }
      row[i] = [q[0], q[1], dx, dz, q[2]];
    }
    if (!ok) continue;
    ctx.beginPath(); ctx.moveTo(row[0][0], H + 10);
    for (const q of row) ctx.lineTo(q[0], q[1]);
    ctx.lineTo(row[NX][0], H + 10); ctx.closePath();
    ctx.fillStyle = rgba(mix([18, 26, 48], [3, 6, 14], fog * 0.9 + 0.1)); ctx.fill();
    // 线的亮度：朝月亮那一侧的坡更亮
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = clamp(row[0][4] * 5, 0.8, 2.2);
    ctx.strokeStyle = rgba(mix([70, 120, 200], [130, 200, 255], fog), (0.08 + 0.3 * fog) * (0.8 + 0.4 * mid));
    ctx.beginPath(); row.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
    // 月光碎在浪尖：靠近月亮正下方、坡面朝向镜头的顶点
    for (let i = 0; i <= NX; i++) {
      const q = row[i];
      const near = Math.exp(-Math.pow((q[0] - moonX) / (90 + 260 * (1 - fog)), 2));
      if (near < 0.05) continue;
      const tilt = clamp(0.4 - q[3] * 1.6);
      const tw = Math.pow(0.5 + 0.5 * Math.sin(i * 12.9898 + j * 78.233 + t * 5), 4);
      const sp = near * (0.25 + 0.75 * tilt * tilt) * tw;
      if (sp > 0.04) {
        // 光点落在两个顶点之间的随机位置，避免排成网格
        const nq = row[Math.min(NX, i + 1)], f = (Math.sin(i * 7.13 + j * 3.71 + Math.floor(t * 4) * 1.37) * 43758.5453) % 1;
        const fx = Math.abs(f);
        glow(ctx, lerp(q[0], nq[0], fx), lerp(q[1], nq[1], fx), 3 + 7 * Math.min(2, q[4] * 3), [255, 245, 220], sp * (0.7 + 0.5 * mid));
      }
    }
    // 灯塔光柱扫过时，海面被照亮一片
    if (beam > 0.02 && base) for (let i = 0; i <= NX; i += 3) {
      const q = row[i], near = Math.exp(-Math.pow((q[0] - base[0]) / 500, 2));
      if (near > 0.1) glow(ctx, q[0], q[1], 8 + 10 * Math.min(2, q[4] * 3), [255, 220, 160], 0.12 * beam * near * fog);
    }
    ctx.restore();
  }

  // 两盏船灯（我们）
  const m = easeInOut(prog(local, 2, 28));
  for (const [x0, col, ph] of [[lerp(-1500, -60, m), C.gold, 0], [lerp(1300, 60, m), C.ice, 1.7]]) {
    const z = camZ + 2600, [h] = wave(x0, z, t, amp);
    const q = P([x0, h + 14, z]); if (!q) continue;
    glow(ctx, q[0], q[1], 46, col, 0.7);
    glow(ctx, q[0], q[1], 9, C.white, 1);
    // 倒影
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createLinearGradient(0, q[1], 0, q[1] + 90);
    rg.addColorStop(0, rgba(col, 0.35)); rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg; ctx.fillRect(q[0] - 3 + Math.sin(t * 3 + ph) * 2, q[1] + 6, 6, 90);
    ctx.restore();
  }
}
module.exports = { draw, lyricStyle: { y: H * 0.36, size: 50, glowCol: [200, 215, 255] } };
