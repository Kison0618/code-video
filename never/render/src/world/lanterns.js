// 场景九（最后 32 小节）：天灯与烟花。drop 落下的那一刻，湖面上千盏天灯一起升起；
// 之后烟花在每个小节的重拍上绽开（物理模拟：初速度、空气阻力、重力），湖面倒映整片天空。
// 四个乐句：升灯 → 烟花 → 抬头看满天的灯 → 烟花最密，金色和冰蓝的两盏灯并肩飞向高处
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, glowSegs, glowLine, mulberry32, noise1 } = K;
const A = require('../audio');
const FX = require('../fx');
const { camera } = require('../cam');

const SKY = new Canvas(W, H), SKYF = new Canvas(W, H);
const T0 = A.barT(96);
const LANT = (() => {
  const r = mulberry32(606), out = [];
  for (let i = 0; i < 1900; i++) {
    const z = 700 + Math.pow(r(), 0.8) * 15000;
    // 大部分在 drop 的前两小节里一起放飞，其余陆续升起
    const k = r(), tl = k < 0.3 ? T0 - 30 + r() * 30 : k < 0.65 ? T0 - 0.2 + r() * 3 : T0 + r() * 58;
    out.push({ x: (r() - 0.5) * z * 2.4, z, tl, v: 26 + r() * 30, sw: r() * 6.28, ff: 0.6 + r() * 0.8, sz: 0.85 + r() * 0.4 });
  }
  return out;
})();
const STARS = (() => { const r = mulberry32(31); return Array.from({ length: 1400 }, () => { const az = (r() - 0.5) * 2.2, el = Math.asin(0.03 + r() * 0.95); return [Math.sin(az) * Math.cos(el) * 1e5, Math.sin(el) * 1e5, Math.cos(az) * Math.cos(el) * 1e5, 0.3 + r() * 0.7]; }); })();

// 烟花：在重拍上绽开
const FW_COLS = [[C.gold, C.amber], [C.rose, C.gold], [C.cyan, C.ice], [C.violet, C.rose], [C.gold, C.white], [C.green, C.cyan]];
const FIREWORKS = (() => {
  const out = [];
  const add = (tb, seed, big) => {
    const r = mulberry32(seed);
    const z = big ? 2300 + r() * 900 : 2600 + r() * 3600;
    out.push({ tb, B: [(r() - 0.5) * z * 1.0, 900 + r() * 900 + (big ? 400 : 0), z], cols: seed === 960 ? FW_COLS[0] : FW_COLS[Math.floor(r() * FW_COLS.length)], n: big ? 260 : 130 + Math.floor(r() * 60), sp: (big ? 1000 : 500 + r() * 250), seed, ring: r() < 0.25 });
  };
  add(A.barT(96), 960, true);
  add(A.barT(100), 1000, false);
  for (let b = 104; b < 112; b++) add(A.barT(b), b * 7, b % 4 === 0);
  for (let b = 112; b < 120; b += 2) add(A.barT(b), b * 7, false);
  for (let b = 120; b < 125; b++) { add(A.barT(b), b * 7, b % 2 === 0); add(A.barT(b + 0.5), b * 11 + 3, false); }
  return out;
})();
const DRAG = 1.5, GRAV = 140;
function fwPos(B, v, tau) {
  const e = (1 - Math.exp(-DRAG * tau)) / DRAG;
  return [B[0] + v[0] * e, B[1] + v[1] * e - GRAV * (tau / DRAG - e / DRAG), B[2] + v[2] * e];
}
const FW_DIRS = new Map();
function dirs(f) {
  if (FW_DIRS.has(f.seed)) return FW_DIRS.get(f.seed);
  const r = mulberry32(f.seed + 1), d = [];
  for (let i = 0; i < f.n; i++) {
    let u = r() * 2 - 1, p = r() * 6.2832;
    if (f.ring) u = (r() - 0.5) * 0.12;            // 环形烟花
    const q = Math.sqrt(1 - u * u), s = f.sp * (0.85 + r() * 0.3);
    d.push([q * Math.cos(p) * s, u * s, q * Math.sin(p) * s, Math.floor(r() * 2)]);
  }
  FW_DIRS.set(f.seed, d);
  return d;
}

// 一盏天灯：纸罩（上暗下亮）+ 底部的火 + 光晕
function lantern(sx, x, y, s, fade, fl, haloCol, cols) {
  const w = 26 * s, h = 34 * s;
  glow(sx, x, y + h * 0.2, w * 4, haloCol, 0.35 * fl * fade);
  const lg = sx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  lg.addColorStop(0, rgba(cols[0], 0.9 * fade)); lg.addColorStop(0.7, rgba(cols[1], 0.95 * fade)); lg.addColorStop(1, rgba(cols[2], fade));
  sx.fillStyle = lg;
  sx.beginPath(); sx.moveTo(x - w * 0.42, y - h / 2); sx.lineTo(x + w * 0.42, y - h / 2);
  sx.quadraticCurveTo(x + w * 0.56, y, x + w * 0.4, y + h / 2); sx.lineTo(x - w * 0.4, y + h / 2);
  sx.quadraticCurveTo(x - w * 0.56, y, x - w * 0.42, y - h / 2); sx.fill();
  glow(sx, x, y + h * 0.42, w * 0.9, [255, 240, 200], 0.8 * fl * fade);
}

function draw(ctx, t, S) {
  const local = t - T0, bar = A.barF(t) - 96;
  const mid = A.env('mid', t), rms = A.env('rms', t), hi = A.env('high', t);
  // 镜头：第三个乐句抬头看满天的灯，最后再放平
  const look = smooth(prog(bar, 15, 18)) * (1 - smooth(prog(bar, 23, 26)));
  const cz = local * 26;
  const P = camera({ x: 200 * Math.sin(local * 0.03), y: 40 + 160 * look, z: cz, yaw: 0.06 * Math.sin(local * 0.05), pitch: 0.13 + 0.33 * look, f: 1000 });
  const hz = P([0, 40 + 160 * look, cz + 1e7]); const hy = hz ? hz[1] : H;

  const sx = SKY.getContext('2d'); sx.reset();
  const g = sx.createLinearGradient(0, Math.min(hy, H) - 900, 0, hy);
  g.addColorStop(0, 'rgb(5,6,20)'); g.addColorStop(0.7, 'rgb(22,18,48)'); g.addColorStop(1, 'rgb(70,40,52)');
  sx.fillStyle = g; sx.fillRect(0, 0, W, H);
  sx.save(); sx.globalCompositeOperation = 'lighter'; sx.fillStyle = 'rgba(255,255,255,0.6)';
  sx.beginPath();
  for (const s of STARS) { const q = P(s); if (q && q[1] < hy) sx.rect(q[0], q[1], s[3] * 1.8, s[3] * 1.8); }
  sx.fill(); sx.restore();
  // 对岸：低矮的山和一线灯火
  if (hy < H + 50) {
    sx.fillStyle = 'rgb(8,8,18)'; sx.beginPath(); sx.moveTo(0, hy + 1);
    for (let i = 0; i <= 64; i++) { const x = i / 64 * W; sx.lineTo(x, hy - 18 - 22 * (0.5 + 0.5 * noise1(i * 0.31, 4)) - 30 * Math.max(0, noise1(i * 0.11, 9))); }
    sx.lineTo(W, hy + 1); sx.fill();
    sx.save(); sx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 160; i++) { const x = (i * 131.7) % W; sx.fillStyle = rgba([255, 190, 120], 0.35 + 0.3 * Math.sin(i * 3.3 + t)); sx.fillRect(x, hy - 3 - (i % 3), 1.6, 1.6); }
    sx.restore();
  }

  // 烟花
  for (const f of FIREWORKS) {
    const tau = t - f.tb;
    if (tau < -0.75 || tau > 3.2) continue;
    if (tau < 0) {
      // 升空的火箭：一道细细的金线
      const k = 1 + tau / 0.75, a = P([f.B[0], f.B[1] * Math.max(0, k - 0.12), f.B[2]]), b = P([f.B[0], f.B[1] * k, f.B[2]]);
      if (a && b) glowLine(sx, [[a[0], a[1]], [b[0], b[1]]], C.gold, 0.7, 1.2, 0.6);
      continue;
    }
    const life = Math.pow(clamp(1 - tau / 3.0), 1.4);
    const segs = [[], []];
    const heads = [];
    for (const d of dirs(f)) {
      const p1 = fwPos(f.B, d, tau), p0 = fwPos(f.B, d, Math.max(0, tau - 0.16));
      const a = P(p0), b = P(p1); if (!a || !b) continue;
      segs[d[3]].push(a[0], a[1], b[0], b[1]);
      if (tau > 1.2 && ((d[0] * 13 + tau * 20) | 0) % 5 === 0) heads.push(b);   // 尾声的闪烁
    }
    const fs = P(f.B); const sc = fs ? fs[2] : 0.15;
    glowSegs(sx, segs[0], f.cols[0], life * 0.9, clamp(sc * 6, 1.2, 3), 1);
    glowSegs(sx, segs[1], f.cols[1], life * 0.9, clamp(sc * 6, 1.2, 3), 1);
    for (const h of heads) glow(sx, h[0], h[1], 5, C.white, life * (0.4 + 0.6 * hi));
    // 绽开的一瞬：中心一团柔光（不闪屏）
    if (fs) glow(sx, fs[0], fs[1], Math.min(260, 500 * sc), f.cols[0], 0.3 * Math.exp(-tau * 2.5));
  }

  // 天灯
  sx.save();
  const far = [];
  for (const L of LANT) {
    const age = t - L.tl; if (age < 0) continue;
    const y = 8 + L.v * age + 0.6 * age * age;
    const x = L.x + 30 * Math.sin(age * 0.4 + L.sw), z = L.z + 10 * age;
    const q = P([x, y, z]); if (!q || q[0] < -40 || q[0] > W + 40 || q[1] < -40 || q[1] > H + 40) continue;
    const fl = 0.8 + 0.2 * noise1(t * 3 * L.ff, L.sw * 10);
    const fade = clamp(1 - (y - 2500) / 2500) * clamp(age / 1.2);
    const s = q[2] * L.sz;
    if (s < 0.35) { far.push(q[0], q[1], fl * fade, s); continue; }
    lantern(sx, q[0], q[1], s, fade, fl, C.amber, [[170, 60, 30], [255, 150, 60], [255, 230, 160]]);
  }
  for (let k = 0; k < far.length; k += 4) {
    const s = far[k + 3];
    glow(sx, far[k], far[k + 1], 3 + 26 * s, C.amber, 0.55 * far[k + 2]);
    sx.fillStyle = rgba([255, 210, 150], 0.9 * far[k + 2]); sx.fillRect(far[k] - 1, far[k + 1] - 1, 2 + 3 * s, 2 + 4 * s);
  }
  sx.restore();

  // 我们：金色和冰蓝的两盏灯，最后一个乐句并肩飞向高处
  const m = prog(bar, 22, 32);
  if (m > 0) {
    for (const [dx, col, cols] of [[-34, C.gold, [[190, 110, 40], [255, 190, 90], [255, 240, 190]]], [34, C.ice, [[60, 90, 160], [150, 200, 255], [230, 245, 255]]]]) {
      const q = P([dx * (1 - 0.5 * smooth(m)), 60 + smooth(m) * 1000, cz + 900 + m * 600]);
      if (q) lantern(sx, q[0], q[1], q[2] * 1.1, clamp(m * 8), 1, col, cols);
    }
  }

  FX.flatten(SKY, SKYF);
  const wy = Math.ceil(clamp(hy, 0, H));
  ctx.drawImage(SKYF, 0, 0, W, wy + 1, 0, 0, W, wy + 1);
  if (wy < H) {
    ctx.fillStyle = 'rgb(4,4,12)'; ctx.fillRect(0, wy, W, H - wy);
    ctx.save(); ctx.globalAlpha = 0.7;
    for (let y = wy; y < H; y += 3) {
      const d = y - hy, sy = hy - d - 3; if (sy < 0) break;
      const dx = Math.sin(y * 0.11 + t * 1.8) * (1.5 + d * 0.03) + Math.sin(y * 0.031 - t * 0.6) * d * 0.025;
      ctx.drawImage(SKYF, 0, sy, W, 3, dx, y, W, 3);
    }
    ctx.restore();
    const wg = ctx.createLinearGradient(0, wy, 0, H);
    wg.addColorStop(0, 'rgba(10,6,20,0.1)'); wg.addColorStop(1, 'rgba(4,2,10,0.5)');
    ctx.fillStyle = wg; ctx.fillRect(0, wy, W, H - wy);
  }
  // 整体随音乐的能量微微发暖（不闪）
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba([255, 140, 70], 0.03 + 0.04 * rms); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
module.exports = { draw, lyricStyle: { y: H - 120, size: 50, glowCol: C.amber } };
