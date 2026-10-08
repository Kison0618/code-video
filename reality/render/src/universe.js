// "人的宇宙"：8000 个光点，每个点是一个人。人以群分——点聚成一个个星团，星团之间连着细长的纤维（像宇宙大尺度结构），
// 远处有淡淡的星云。全片好几个镜头都在这个 3D 空间里拍
'use strict';
const K = require('./core');
const { W, H, C, rgba, mix, clamp, glow, mulberry32 } = K;
const { camera } = require('./cam');

function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(6.2832 * r()); }
const N = 8000;
const PTS = (() => {
  const r = mulberry32(777), out = [];
  const CL = [];
  for (let i = 0; i < 70; i++) {
    const a = r() * 6.2832, e = (r() - 0.5) * 1.2, d = 600 + Math.pow(r(), 0.7) * 4200;
    CL.push([Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d * 0.6, Math.sin(a) * Math.cos(e) * d, 80 + r() * 260]);
  }
  for (let i = 0; i < N; i++) {
    let p;
    const k = r();
    if (k < 0.62) {                                   // 星团
      const c = CL[Math.floor(r() * CL.length)];
      p = [c[0] + gauss(r) * c[3], c[1] + gauss(r) * c[3] * 0.8, c[2] + gauss(r) * c[3]];
    } else if (k < 0.92) {                            // 星团之间的纤维
      const a = CL[Math.floor(r() * CL.length)], b = CL[Math.floor(r() * CL.length)], u = r();
      const s = 40 + 60 * Math.sin(u * Math.PI);
      p = [a[0] + (b[0] - a[0]) * u + gauss(r) * s, a[1] + (b[1] - a[1]) * u + gauss(r) * s, a[2] + (b[2] - a[2]) * u + gauss(r) * s];
    } else {                                          // 零散的人
      const a = r() * 6.2832, e = Math.asin(r() * 2 - 1), d = 300 + r() * 5500;
      p = [Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d * 0.6, Math.sin(a) * Math.cos(e) * d];
    }
    const q = r();
    out.push({ p, react: q < 0.12 ? 1 : q < 0.73 ? 0 : -1, tw: r() * 6.28, b: 0.45 + r() * 0.55, warm: r() < 0.08, ord: r(), dir: [gauss(r), gauss(r), gauss(r)] });
  }
  return out;
})();
// 人和人之间的连线：每个点连向离它最近的一两个人（只连近的）
const LINKS = (() => {
  const out = [], grid = new Map(), G = 220;
  const key = (x, y, z) => `${Math.floor(x / G)},${Math.floor(y / G)},${Math.floor(z / G)}`;
  PTS.forEach((pt, i) => { const k = key(...pt.p); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  PTS.forEach((pt, i) => {
    if (i % 2) return;
    const [x, y, z] = pt.p, gx = Math.floor(x / G), gy = Math.floor(y / G), gz = Math.floor(z / G);
    let best = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      for (const j of grid.get(`${gx + a},${gy + b},${gz + c}`) || []) {
        if (j <= i) continue;
        const d = Math.hypot(PTS[j].p[0] - x, PTS[j].p[1] - y, PTS[j].p[2] - z);
        if (d < 200) best.push([d, j]);
      }
    }
    best.sort((u, v) => u[0] - v[0]);
    for (const [, j] of best.slice(0, 2)) out.push(i, j);
  });
  return out;
})();
const NEB = (() => { const r = mulberry32(31); return Array.from({ length: 34 }, () => { const a = r() * 6.2832, d = 2000 + r() * 6000; return { p: [Math.cos(a) * d, (r() - 0.5) * 2600, Math.sin(a) * d], s: 900 + r() * 2200, col: [[60, 70, 110], [80, 60, 100], [50, 80, 100], [90, 70, 60]][Math.floor(r() * 4)], a: 0.05 + r() * 0.07 }; }); })();

// 绕原点的环绕镜头
function orbit(dist, az, el, f = 900, target = [0, 0, 0]) {
  const pos = [target[0] + Math.cos(el) * Math.sin(az) * dist, target[1] + Math.sin(el) * dist, target[2] - Math.cos(el) * Math.cos(az) * dist];
  const d = [target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]], L = Math.hypot(...d);
  return camera({ x: pos[0], y: pos[1], z: pos[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), f });
}

// 画宇宙。o.map(pt, i) 可以改每个点的位置 / 颜色 / 亮度：返回 { p, col, a, s } 或 null
function draw(ctx, t, P, o = {}) {
  const { map = null, nebula = 1, focus = 2600, aperture = 1, alpha = 1, links = 1, fogFar = 9000 } = o;
  const SP = new Array(N);
  // 星云
  if (nebula > 0) for (const n of NEB) {
    const q = P(n.p); if (!q) continue;
    glow(ctx, q[0], q[1], n.s * q[2], n.col, n.a * nebula * alpha);
  }
  const buckets = new Map(), bokeh = [], sparks = [];
  for (let i = 0; i < N; i++) {
    const pt = PTS[i];
    let p = pt.p, col = pt.warm ? [200, 180, 150] : [165, 175, 200], a = pt.b * (0.65 + 0.35 * Math.sin(t * 1.3 + pt.tw)), s = 1;
    if (map) { const m = map(pt, i); if (!m) continue; if (m.p) p = m.p; if (m.col) col = m.col; if (m.a != null) a *= m.a; if (m.s) s = m.s; }
    a *= alpha;
    if (a < 0.03) continue;
    const q = P(p); if (!q) continue;
    if (q[0] < -60 || q[0] > W + 60 || q[1] < -60 || q[1] > H + 60) continue;
    const depth = q[3];
    const fog = clamp(1.25 - depth / fogFar);
    // 景深：离对焦距离越远越虚
    const blur = Math.abs(depth - focus) / focus * aperture;
    const rad = Math.max(1.4, 5.5 * q[2] * s);
    SP[i] = [q[0], q[1], a * fog, col];
    if (blur > 0.6 && depth < focus) { bokeh.push([q[0], q[1], rad * (2 + blur * 5), col, a * fog * 0.18 / (1 + blur)]); continue; }
    const av = clamp(a * fog * 1.15);
    const key = col.join(',') + '|' + Math.round(av * 8);
    if (!buckets.has(key)) buckets.set(key, { col, a: Math.round(av * 8) / 8, pts: [] });
    buckets.get(key).pts.push(q[0], q[1], Math.min(rad, 5));
    if (pt.b > 0.93 && depth < 7000) sparks.push([q[0], q[1], 10 + 30 * q[2], col, a * fog * 0.5]);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of buckets.values()) {
    if (b.a <= 0) continue;
    ctx.fillStyle = rgba(b.col, clamp(b.a));
    ctx.beginPath();
    for (let k = 0; k < b.pts.length; k += 3) ctx.rect(b.pts[k] - b.pts[k + 2] / 2, b.pts[k + 1] - b.pts[k + 2] / 2, b.pts[k + 2], b.pts[k + 2]);
    ctx.fill();
  }
  ctx.restore();
  // 连线
  if (links > 0) {
    const lb = new Map();
    for (let k = 0; k < LINKS.length; k += 2) {
      const a = SP[LINKS[k]], b = SP[LINKS[k + 1]]; if (!a || !b) continue;
      const al = Math.min(a[2], b[2]) * links;
      if (al < 0.05) continue;
      const col = a[3] === b[3] ? a[3] : [165, 175, 200];
      const key = col.join(',') + '|' + Math.round(al * 4);
      if (!lb.has(key)) lb.set(key, { col, a: Math.round(al * 4) / 4, s: [] });
      lb.get(key).s.push(a[0], a[1], b[0], b[1]);
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 0.8;
    for (const L of lb.values()) {
      ctx.strokeStyle = rgba(L.col, 0.16 * L.a); ctx.beginPath();
      for (let k = 0; k < L.s.length; k += 4) { ctx.moveTo(L.s[k], L.s[k + 1]); ctx.lineTo(L.s[k + 2], L.s[k + 3]); }
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const b of bokeh) glow(ctx, b[0], b[1], b[2], b[3], b[4]);
  for (const b of sparks) glow(ctx, b[0], b[1], b[2], b[3], b[4]);
}
module.exports = { N, PTS, draw, orbit, gauss };
