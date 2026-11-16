'use strict';
// 念头树（学自《剃刀》开场）：一句消息长出"解释树"，越往外越密、越细、越红，深层缠成网
//   const T = makeTree(cfg); T.draw(ctx, t, { alpha, shatter, push })
//   cfg: root, rootXY, gen1:[[文字,[x,y],是否分叉,颜色?]], labels:[[文字,第一层编号,深度,位置比例,'mid'|'bad']], filler:[...],
//        t0(开始长), growEnd(长满), maxDepth, seed, clock:{from(分钟), mins, t0, t1}
const path = require('path');
const { FontLibrary } = require('skia-canvas');
const K = require('./core');
const L = require('./lib');
const { W, H, clamp, prog, smooth, easeInOut, glow, rgba, mix, mulberry32 } = K;

const NS = path.join(__dirname, '..', 'node_modules', '@expo-google-fonts', 'noto-sans-sc');
FontLibrary.use('TDSans', ['500Medium', '700Bold', '900Black'].map(w => path.join(NS, w, `NotoSansSC_${w}.ttf`)));

const COLORS = { near: [246, 232, 210], mid: [255, 186, 112], far: [240, 92, 128], bad: [255, 120, 150], root: [150, 236, 130] };

function makeTree(cfg) {
  const C = { ...COLORS, ...(cfg.colors || {}) }, T0 = cfg.t0 || 0, END = cfg.growEnd, MD = cfg.maxDepth || 7;
  const R = mulberry32(cfg.seed || 17), RX = cfg.rootXY;
  const nodes = [], edges = [];
  const addNode = (x, y, depth, g1, t) => { const n = { x, y, depth, g1, t, kids: [] }; nodes.push(n); return n; };
  function addEdge(a, b, t0, dur, bend) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, c = [mx - dy * bend, my + dx * bend], pts = [];
    for (let i = 0; i <= 18; i++) { const s = i / 18, u = 1 - s; pts.push([u * u * a.x + 2 * u * s * c[0] + s * s * b.x, u * u * a.y + 2 * u * s * c[1] + s * s * b.y]); }
    edges.push({ a, b, t0, dur, pts, depth: b.depth, ph: R() * 6.28, fall: 0.6 + R() * 0.8 });
  }
  const depthT = d => T0 + (END - T0) * Math.pow((d - 1) / MD, 1.25) - 0.6;
  const RAD = !!cfg.radial, BB = cfg.bounds || [-120, -80, W + 120, H - 60];
  const root = addNode(RAD ? RX[0] : RX[0] + 120, RX[1], 0, -1, T0 - 1);
  cfg.gen1.forEach(([, p], i) => {
    const n = addNode(p[0], p[1], 1, i, T0 - 0.2 + i * 0.12); root.kids.push(n);
    addEdge(i === 0 && !RAD ? { x: RX[0] - 40, y: RX[1] - 40 } : root, n, T0 - 0.7 + i * 0.12, 0.7, i === 0 && !RAD ? -0.15 : (i - 2.5) * 0.08);
  });
  for (let d = 1; d < MD; d++) for (const p of nodes.filter(n => n.depth === d)) {
    if (d === 1 && !cfg.gen1[p.g1][2]) continue;
    const par = p.depth === 1 ? root : p.par, dir = RAD ? Math.atan2(p.y - RX[1], p.x - RX[0]) : Math.atan2(p.y - par.y, p.x - par.x) * 0.55;
    const k = RAD ? (d < 4 ? 3 : 2 + (R() < 0.3 ? 1 : 0)) : d < 3 ? 3 : 2 + (R() < 0.45 ? 1 : 0) - (R() < 0.15 ? 1 : 0);
    for (let j = 0; j < k; j++) {
      const a = dir + (j / Math.max(1, k - 1) - 0.5) * (RAD ? 1.6 : 1.5) + (R() - 0.5) * 0.5, len = (cfg.len || 200 + R() * 110) * Math.pow(0.9, d);
      const x = p.x + Math.cos(a) * len, y = p.y + Math.sin(a) * len;
      if (x < BB[0] || y < BB[1] || x > BB[2] || y > BB[3]) continue;
      if (cfg.ellipse && ((x - RX[0]) / cfg.ellipse[0]) ** 2 + ((y - RX[1]) / cfg.ellipse[1]) ** 2 > 1 + (R() - 0.5) * 0.25) continue;
      const t0 = depthT(d + 1) + R() * 0.5, n = addNode(x, y, d + 1, p.g1, t0 + 0.45); n.par = p; p.kids.push(n);
      addEdge(p, n, t0, 0.35 + R() * 0.3, (R() - 0.5) * 0.4);
    }
  }
  for (const n of nodes.filter(n => n.depth >= 3)) {
    if (R() > 0.45) continue;
    let best = null, bd = 150;
    for (const m of nodes) if (m !== n && m.depth >= 3 && m.par !== n.par && m.par !== n && n.par !== m) {
      const dd = Math.hypot(m.x - n.x, m.y - n.y); if (dd > 40 && dd < bd && (RAD || m.x > n.x - 30)) { bd = dd; best = m; }
    }
    if (best) addEdge(n, best, Math.max(n.t, best.t) - 0.1, 0.4, (R() - 0.5) * 0.5);
  }
  // 标签：避开已占位置，留安全边距
  const tags = [], boxes = [];
  const LB = cfg.labelBox || [0, 260, W - 160, H - 230];
  const free = (n, w, h) => !boxes.some(b => n.x < b[0] + b[2] && n.x + w > b[0] && n.y - h < b[1] && n.y > b[1] - b[3]) && n.x > LB[0] && n.x + w < LB[2] && n.y > LB[1] && n.y < LB[3];
  const take = (n, w, h) => { boxes.push([n.x, n.y, w, h]); n.tag = 1; };
  cfg.gen1.forEach(([s, p]) => boxes.push([p[0] - 20, p[1] + 16, [...s].length * 50 + 70, 80]));
  if (cfg.clock) boxes.push([0, 260, 760, 260]); // 左上角时钟区
  if (RAD) boxes.push([RX[0] - 140, RX[1] + 120, 280, 240]); // 中心光核
  for (const [s, g, d, f, kind] of cfg.labels) {
    const w = [...s].length * 46 + 40, c = nodes.filter(n => n.g1 === g && n.depth >= d && n.depth <= d + 1).sort((a, b) => a.y - b.y);
    const st = Math.floor(f * c.length);
    for (let i = 0; i < c.length; i++) { const n = c[(st + i) % c.length]; if (free(n, w, 66)) { tags.push({ s, n, kind }); take(n, w, 66); break; } }
  }
  const deep = nodes.filter(n => n.depth >= 4 && !n.tag);
  for (let i = 0, k = 0; i < 400 && k < 26 && deep.length && (cfg.filler || []).length; i++) {
    const n = deep.splice(Math.floor(R() * deep.length), 1)[0], s = cfg.filler[k % cfg.filler.length];
    if (free(n, s.length * 24 + 14, 30)) { tags.push({ s, n, kind: 'fill' }); take(n, s.length * 24 + 14, 30); k++; }
  }
  const colAt = (x, depth, t) => {
    const u = (RAD ? depth / MD * 0.8 : clamp((x - 600) / 1200) * 0.75 + depth / MD * 0.3) + 0.15 * smooth(prog(t, T0 + 4, END + 1.5));
    return u < 0.5 ? mix(C.near, C.mid, u / 0.5) : mix(C.mid, C.far, clamp((u - 0.5) / 0.55));
  };

  function bubble(ctx, x, y, a) {
    const s = cfg.root, w = Math.max(200, [...s].length * 44 + 70), h = 84, c = C.root;
    glow(ctx, x, y, 260, c, 0.22 * a);
    ctx.save(); ctx.globalAlpha = a;
    ctx.shadowColor = rgba(c, 0.7); ctx.shadowBlur = 40;
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, 'rgb(170,246,150)'); g.addColorStop(1, 'rgb(120,214,104)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 22);
    ctx.moveTo(x + w / 2 - 2, y - 12); ctx.lineTo(x + w / 2 + 16, y); ctx.lineTo(x + w / 2 - 2, y + 12); ctx.fill();
    ctx.restore();
    L.rich(ctx, s, x - 4, y + 15, { size: 44, weight: 700, family: 'TDSans', color: [30, 44, 28], spacing: 0.02, alpha: a });
  }
  function clock(ctx, t, a) {
    const k = cfg.clock; if (!k || a <= 0) return;
    const m = Math.round(k.mins * easeInOut(prog(t, k.t0, k.t1))), now = (k.from + m) % 1440;
    const p2 = v => String(v).padStart(2, '0');
    L.rich(ctx, `${p2(Math.floor(now / 60))}:${p2(now % 60)}`, 96, 128, { size: 80, weight: 700, family: 'TDSans', color: [200, 204, 214], alpha: 0.55 * a, align: 'left', spacing: 0.02 });
    L.rich(ctx, `已发送 ${p2(Math.floor(k.from / 60))}:${p2(k.from % 60)}  ·  未回复 ${Math.floor(m / 60)} 小时 ${p2(m % 60)} 分`, 98, 178,
      { size: 38, weight: 500, family: 'TDSans', color: mix([160, 166, 180], [255, 130, 130], prog(t, k.t0 + 2, k.t1)), alpha: 0.85 * a, align: 'left', spacing: 0.03 });
  }

  function draw(ctx, t, o = {}) {
    const { alpha = 1, shatter = 0, push = [0, 15] } = o;
    if (alpha <= 0.003) return;
    const k = easeInOut(prog(t, push[0], push[1])), sc = 1 + 0.05 * k, sh = smooth(shatter);
    ctx.save();
    ctx.translate(40 * k, -10 * k); ctx.translate(RX[0], RX[1]); ctx.scale(sc, sc); ctx.translate(-RX[0], -RX[1]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const heads = [];
    for (const e of edges) {
      const f = clamp((t - e.t0) / e.dur); if (f <= 0) continue;
      let pts = K.partial(e.pts, smooth(f));
      if (sh > 0) pts = pts.map(([x, y], i) => [x + Math.sin(e.ph + i) * 30 * sh, y + 420 * sh * sh * e.fall]);
      const tip = pts[pts.length - 1];
      const c0 = e.depth === 1 ? (cfg.gen1[e.b.g1][3] || C.near) : colAt(e.b.x, e.depth, t), c = mix(c0, [120, 120, 130], sh);
      const w = Math.max(0.9, 3.0 * Math.pow(0.78, e.depth - 1)), a = Math.max(0.22, 0.95 * Math.pow(0.84, e.depth - 1)) * alpha * (1 - sh);
      const br = 0.9 + 0.1 * Math.sin(t * 1.3 + e.b.x * 0.01);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      for (const [lw, la] of [[w * 5, 0.06], [w * 2.2, 0.16], [w, 0.9]]) { ctx.strokeStyle = rgba(c, la * a * br); ctx.lineWidth = lw; ctx.stroke(); }
      if (f < 1 && sh <= 0) heads.push([tip, c]);
    }
    ctx.restore();
    for (const [p, c] of heads) { glow(ctx, p[0], p[1], 20, c, 0.7 * alpha); glow(ctx, p[0], p[1], 5, [255, 255, 255], 0.8 * alpha); }
    for (const n of nodes) {
      if (n.depth < 1 || t < n.t) continue;
      const y = n.y + 420 * sh * sh * (0.6 + (n.x % 7) / 9);
      glow(ctx, n.x + Math.sin(n.y) * 30 * sh, y, Math.max(4, 12 - 1.4 * n.depth), mix(colAt(n.x, n.depth, t), [140, 140, 150], sh), (n.depth < 4 ? 0.55 : n.depth < 6 ? 0.22 : 0.1) * alpha * (1 - sh * 0.7) * smooth(prog(t, n.t, n.t + 0.3)));
    }
    const la = alpha * (1 - smooth(prog(sh, 0, 0.4)));
    const F = cfg.family || 'TDSans', WB = F === 'TDSans' ? 700 : 500, WH = F === 'TDSans' ? 900 : 500;
    cfg.gen1.forEach(([s, p], i) => {
      const a = smooth(prog(t, T0 - 0.1 + i * 0.12, T0 + 0.4 + i * 0.12)) * la, left = RAD ? p[0] < RX[0] : i === 0;
      L.rich(ctx, s, p[0] + (left ? -30 : 22), p[1] - 14, { size: 50, weight: WH, family: F, color: !RAD && i === 0 ? [214, 226, 238] : [250, 246, 240], alpha: a, align: left ? 'right' : 'left', spacing: 0.02 });
    });
    for (const g of tags) {
      const a = smooth(prog(t, g.n.t - 0.1, g.n.t + 0.35)) * la; if (a <= 0) continue;
      const dy = (1 - a) * 8, x = g.n.x + 14, y = g.n.y - 10 + dy;
      if (g.kind === 'mid') L.rich(ctx, g.s, x, y, { size: 42, weight: WB, family: F, color: [236, 226, 214], alpha: a * 0.92, align: 'left', spacing: 0.02 });
      else if (g.kind === 'bad') {
        // 先压一块暗底，让最坏的那几句从红雾里跳出来
        const tw = K.measure(ctx, g.s, { size: 48, weight: WB, family: F, spacing: 0.02 });
        const gr = ctx.createRadialGradient(x + tw / 2, y - 16, 0, x + tw / 2, y - 16, tw * 0.75);
        gr.addColorStop(0, `rgba(6,7,16,${0.85 * a})`); gr.addColorStop(1, 'rgba(6,7,16,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 40, y - 80, tw + 80, 110);
        L.rich(ctx, g.s, x, y, { size: 48, weight: WB, family: F, color: C.bad, keyColor: C.bad, keys: [g.s], glowKey: 0.8, alpha: a, align: 'left', spacing: 0.02 });
      }
      else L.rich(ctx, g.s, g.n.x + 8, g.n.y - 6 + dy, { size: 26, weight: 400, family: F, color: [170, 160, 160], alpha: a * 0.6, align: 'left' });
    }
    if (cfg.bubble !== false) bubble(ctx, RX[0], RX[1], alpha);
    ctx.restore();
    clock(ctx, t, alpha * (1 - sh));
  }
  return { draw, nodes, edges, tags, rootXY: RX };
}
module.exports = { makeTree };

