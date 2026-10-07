// 场景六（间奏）：深海。海面的光一束束斜照下来，海雪缓缓飘落，发光的水母一张一合；
// 一只金色、一只冰蓝色的水母在人群里慢慢靠近。镜头一直往下沉
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, glowLine, mulberry32, noise1 } = K;
const A = require('../audio');

const F = 1000;
const SNOW = (() => { const r = mulberry32(51); return Array.from({ length: 1400 }, () => [(r() - 0.5) * 3200, r() * 4000, 200 + r() * 3000, r() * 6.28, 0.4 + r() * 0.6]); })();
const JELLY = (() => {
  const r = mulberry32(17), out = [];
  const cols = [C.cyan, C.violet, [120, 160, 255], C.rose, [110, 230, 210]];
  for (let i = 0; i < 20; i++) { const z = 900 + r() * 2600; out.push({ x: (r() - 0.5) * z * 2.1, y: (r() - 0.5) * z * 1.2, z, size: 40 + r() * 50, col: cols[Math.floor(r() * cols.length)], ph: r() * 6.28, rate: 0.6 + r() * 0.4, nt: 8 + Math.floor(r() * 8), tilt: (r() - 0.5) * 0.5, rise: 10 + r() * 20 }); }
  return out;
})();
const RAYS = (() => { const r = mulberry32(3); return Array.from({ length: 14 }, () => ({ x: r() * 1.4 - 0.2, w: 30 + r() * 120, a: 0.05 + r() * 0.08, sp: 0.1 + r() * 0.3, ph: r() * 6.28 })); })();

// 一只水母：伞盖（会收缩）、伞缘的褶边、里面的四瓣发光体、长长的触手
function jelly(ctx, x, y, s, col, t, ph, contr, a, nt, tilt) {
  const Rb = s;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt);
  ctx.globalCompositeOperation = 'lighter';
  // 触手（先画，在伞盖后面）
  for (let k = 0; k < nt; k++) {
    const u0 = (k + 0.5) / nt * 2 - 1;
    const x0 = u0 * Rb * (0.85 - 0.25 * contr), pts = [];
    const L = Rb * (3.2 + 1.5 * Math.sin(k * 7.1)) * (1 + 0.1 * contr);
    for (let i = 0; i <= 18; i++) {
      const v = i / 18;
      pts.push([x0 * (1 - v * 0.4) + Math.sin(v * 5 - t * 1.8 + ph + k) * Rb * 0.22 * v, Rb * 0.05 + v * L]);
    }
    glowLine(ctx, pts, col, a * 0.35, Math.max(0.6, s * 0.012), 0.8);
  }
  // 口腕：中间几条更粗、带褶的
  for (let k = 0; k < 4; k++) {
    const pts = [], x0 = (k - 1.5) * Rb * 0.12;
    for (let i = 0; i <= 16; i++) { const v = i / 16; pts.push([x0 + Math.sin(v * 8 + t * 1.2 + k * 2 + ph) * Rb * 0.12 * (0.3 + v), Rb * 0.1 + v * Rb * 1.8]); }
    glowLine(ctx, pts, mix(col, C.white, 0.3), a * 0.45, Math.max(1, s * 0.03), 1);
  }
  // 伞盖：半个椭圆，收缩时变窄变高，伞缘一圈小波纹
  const bw = Rb * (1 - 0.18 * contr), bh = Rb * 0.78 * (1 + 0.15 * contr);
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const ang = Math.PI + (i / 48) * Math.PI;
    ctx.lineTo(Math.cos(ang) * bw, Math.sin(ang) * bh);
  }
  for (let i = 0; i <= 24; i++) { const v = i / 24; ctx.lineTo(bw - v * 2 * bw, Rb * 0.06 * Math.sin(v * 50 + t * 3) + Rb * 0.04); }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, -bh * 0.35, 0, 0, -bh * 0.2, Rb * 1.1);
  g.addColorStop(0, rgba(mix(col, C.white, 0.5), 0.32 * a)); g.addColorStop(0.6, rgba(col, 0.14 * a)); g.addColorStop(1, rgba(col, 0.38 * a));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba(mix(col, C.white, 0.4), 0.55 * a); ctx.lineWidth = Math.max(1, s * 0.025); ctx.stroke();
  // 伞盖里的经线
  ctx.strokeStyle = rgba(col, 0.22 * a); ctx.lineWidth = Math.max(0.6, s * 0.012);
  ctx.beginPath();
  for (let k = 1; k < 8; k++) { const u = k / 8 * 2 - 1; ctx.moveTo(u * bw * 0.95, 0); ctx.quadraticCurveTo(u * bw * 0.7, -bh * 0.8, 0, -bh * 0.95); }
  ctx.stroke();
  ctx.restore();
  // 四瓣发光体
  for (let k = 0; k < 4; k++) {
    const ang = k * Math.PI / 2 + t * 0.3 + ph;
    const p = [Math.cos(ang) * bw * 0.32, -bh * 0.4 + Math.sin(ang) * bh * 0.12];
    const c = Math.cos(tilt), sn = Math.sin(tilt);
    glow(ctx, x + p[0] * c - p[1] * sn, y + p[0] * sn + p[1] * c, Rb * 0.35, mix(col, C.white, 0.2), 0.5 * a);
  }
  glow(ctx, x, y - bh * 0.4, Rb * 2.2, col, 0.18 * a);
}

function draw(ctx, t, S) {
  const local = t - S.t0, u = S.u;
  const mid = A.env('mid', t);
  const sink = local * 55;                   // 镜头下沉
  const depth = smooth(u);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(mix([24, 86, 124], [10, 40, 70], depth))); g.addColorStop(0.45, rgba(mix([8, 34, 62], [4, 18, 40], depth))); g.addColorStop(1, 'rgb(2,6,16)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 海面透下来的光束
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const r of RAYS) {
    const a = r.a * (0.6 + 0.4 * Math.sin(t * r.sp + r.ph)) * (1 - 0.5 * depth) * (0.8 + 0.4 * mid);
    const x0 = r.x * W + Math.sin(t * 0.13 + r.ph) * 60, x1 = x0 - 380;
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, rgba([150, 220, 255], a)); lg.addColorStop(1, rgba([150, 220, 255], 0));
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(x0 - r.w / 2, -10); ctx.lineTo(x0 + r.w / 2, -10); ctx.lineTo(x1 + r.w * 1.6, H); ctx.lineTo(x1 - r.w * 1.6, H); ctx.closePath(); ctx.fill();
  }
  // 海面的波光
  for (let i = 0; i < 60; i++) {
    const x = ((i * 97.3 + Math.sin(t * 0.5 + i) * 40) % (W + 200)) - 100;
    glow(ctx, x, 6 + 10 * Math.sin(i * 3.1), 40 + 30 * Math.sin(i), [170, 230, 255], 0.12 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 1.3)) * (1 - depth));
  }
  ctx.restore();

  // 海雪：近的大而虚，远的是小点；镜头下沉所以它们往上走
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of SNOW) {
    const y = ((s[1] - sink - t * 12) % 4000 + 4000) % 4000 - 2000;
    const x = s[0] + Math.sin(t * 0.3 + s[3]) * 20;
    const sc = F / s[2], sx = W / 2 + x * sc, sy = H / 2 + y * sc;
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
    if (s[2] < 500) glow(ctx, sx, sy, 10 * sc, [200, 230, 255], 0.12 * s[4]);
    else { ctx.fillStyle = rgba([200, 230, 255], 0.45 * s[4] * clamp(1.6 - s[2] / 2200)); ctx.fillRect(sx, sy, 1.2 + sc, 1.2 + sc); }
  }
  ctx.restore();

  // 水母：远的先画
  const all = JELLY.map(j => ({ ...j, y: j.y - local * j.rise + sink * 0.6 }));
  // 我们：两只水母从两边慢慢游到一起
  const m = easeInOut(prog(local, 0, 14));
  all.push({ x: lerp(-700, -95, m), y: lerp(250, -40, m), z: 700, size: 75, col: C.gold, ph: 0, rate: 1, nt: 12, tilt: lerp(0.35, 0.12, m), rise: 0, hero: 1 });
  all.push({ x: lerp(680, 95, m), y: lerp(-150, 0, m), z: 760, size: 70, col: C.ice, ph: 2, rate: 1, nt: 12, tilt: lerp(-0.4, -0.12, m), rise: 0, hero: 1 });
  all.sort((a, b) => b.z - a.z);
  for (const j of all) {
    const sc = F / j.z, x = W / 2 + j.x * sc, span = j.z * 1.4;
    const y = H / 2 + (j.hero ? j.y : (((j.y + span / 2) % span + span) % span - span / 2)) * sc;
    // 两拍一次收缩（只有主角跟着拍子，其它按自己的节奏）
    const ph = j.hero ? (A.beatF(t) / 2) % 1 : (t * j.rate * 0.5 + j.ph) % 1;
    const contr = Math.pow(Math.sin(Math.min(1, ph / 0.35) * Math.PI), 2) * (ph < 0.35 ? 1 : 0) + (ph >= 0.35 ? 0 : 0);
    const fog = clamp(1.3 - j.z / 3000);
    jelly(ctx, x, y, j.size * sc, mix([60, 110, 160], j.col, fog), t, j.ph, contr, fog * (j.hero ? 1 : 0.8), j.nt, j.tilt + 0.06 * Math.sin(t * 0.4 + j.ph));
  }
}
module.exports = { draw, lyricStyle: { y: H - 120, size: 48, glowCol: C.cyan } };
