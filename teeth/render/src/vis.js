// 视觉元件：牙齿、上下颚、环形口、喉咙隧道、裂纹、血管、玻璃碎裂、火星、标题
'use strict';
const K = require('./core');
const { W, H, C, rgba, mix, clamp, lerp, smooth, easeOut, easeOutExpo, easeIn, glow, glowLine, glowSegs, line, partial, circlePts, text, mulberry32 } = K;
const A = require('./audio');
const CX = W / 2, CY = H / 2;

function cumulative(speedFn) {
  const dt = 1 / 240, n = Math.ceil((A.DUR + 2) * 240);
  const tab = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) tab[i] = tab[i - 1] + speedFn((i - 0.5) * dt) * dt;
  return t => { const f = clamp(t, 0, A.DUR + 1.9) * 240, i = Math.floor(f); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
}

// —— 一颗牙：根部在 (x,y)，朝 ang 方向长 h，根宽 w；略带弯曲 ——
function toothPts(x, y, w, h, ang, bend = 0.15) {
  const pts = [];
  const N = 10;
  const tipX = bend * w, tipY = h;
  for (let i = 0; i <= N; i++) { const u = i / N; const px = lerp(-w / 2, tipX, u) - Math.sin(u * Math.PI) * w * 0.12; const py = u * tipY * (1 - 0.04 * Math.sin(u * Math.PI)); pts.push([px, py]); }
  for (let i = N; i >= 0; i--) { const u = i / N; const px = lerp(w / 2, tipX, u) + Math.sin(u * Math.PI) * w * 0.05; const py = u * tipY; pts.push([px, py]); }
  const ca = Math.cos(ang - Math.PI / 2), sa = Math.sin(ang - Math.PI / 2);
  return pts.map(([px, py]) => [x + px * ca - py * sa, y + px * sa + py * ca]);
}
// 批量画牙：实心骨白 + 血红描边光
function drawTeeth(ctx, teeth, o = {}) {
  const { a = 1, fill = C.bone, edge = C.blood, edgeA = 0.8, shade = 0.5 } = o;
  if (a <= 0.003 || !teeth.length) return;
  ctx.save();
  ctx.beginPath();
  for (const p of teeth) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
  ctx.fillStyle = rgba(fill, 0.95 * a);
  ctx.fill();
  ctx.restore();
  // 描边的光
  const segs = [];
  for (const p of teeth) for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; segs.push(p[i][0], p[i][1], q[0], q[1]); }
  glowSegs(ctx, segs, edge, a * edgeA, 1.4, 1.3);
}

// —— 上下颚：open=1 张到屏幕边外，open=0 两排牙交错咬合 ——
const JAW = (() => {
  const r = mulberry32(7), top = [], bot = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const canine = Math.abs(i - 2.5) < 0.6 || Math.abs(i - (n - 3.5)) < 0.6;
    top.push({ u, h: (canine ? 1.55 : 1) * (165 + r() * 30), w: W / n * 0.7, bend: (u - 0.5) * 0.3 });
  }
  for (let i = 0; i < n - 1; i++) {
    const u = (i + 1) / n;
    const canine = Math.abs(i - 2) < 0.6 || Math.abs(i - (n - 4)) < 0.6;
    bot.push({ u, h: (canine ? 1.5 : 1) * (150 + r() * 30), w: W / n * 0.68, bend: (0.5 - u) * 0.3 });
  }
  return { top, bot };
})();
function jaws(ctx, t, open, o = {}) {
  const { a = 1, edge = C.blood, gum = C.wine, fill = C.bone, curve = 0.00012, shake = 0 } = o;
  if (a <= 0.003) return;
  const bite = 110;                               // 咬合时上下牙根距中线的距离
  const gapTop = lerp(CY - bite, -260, open), gapBot = lerp(CY + bite, H + 260, open);
  const yTop = x => gapTop - curve * (x - CX) * (x - CX);
  const yBot = x => gapBot + curve * (x - CX) * (x - CX);
  // 牙龈
  ctx.save();
  for (const [yF, dir] of [[yTop, -1], [yBot, 1]]) {
    ctx.beginPath();
    ctx.moveTo(-20, yF(-20));
    for (let x = -20; x <= W + 20; x += 40) ctx.lineTo(x, yF(x));
    ctx.lineTo(W + 20, dir < 0 ? -400 : H + 400); ctx.lineTo(-20, dir < 0 ? -400 : H + 400); ctx.closePath();
    const g = ctx.createLinearGradient(0, yF(CX), 0, yF(CX) + dir * 260);
    g.addColorStop(0, rgba(gum, 0.95 * a)); g.addColorStop(1, rgba([12, 2, 4], a));
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.restore();
  const teeth = [];
  for (const T of JAW.top) { const x = T.u * W; teeth.push(toothPts(x, yTop(x) - 6, T.w, T.h, Math.PI / 2, T.bend)); }
  for (const T of JAW.bot) { const x = T.u * W; teeth.push(toothPts(x, yBot(x) + 6, T.w, T.h, -Math.PI / 2, T.bend)); }
  drawTeeth(ctx, teeth, { a, edge, fill, edgeA: 0.9 });
  // 牙根暗、牙尖亮
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (const [y0, dir] of [[gapTop, 1], [gapBot, -1]]) {
    const g = ctx.createLinearGradient(0, y0, 0, y0 + dir * 300);
    g.addColorStop(0, 'rgb(60,24,26)'); g.addColorStop(0.45, 'rgb(215,190,180)'); g.addColorStop(1, 'rgb(255,255,255)');
    ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y0 + dir * 300) - (dir > 0 ? 400 : 0), W, 300 + 400);
  }
  ctx.restore();
  // 牙龈线的光
  const gl = [], gb = [];
  for (let x = -20; x <= W + 20; x += 30) { gl.push([x, yTop(x)]); gb.push([x, yBot(x)]); }
  glowLine(ctx, gl, edge, 0.6 * a, 1.6, 1.4); glowLine(ctx, gb, edge, 0.6 * a, 1.6, 1.4);
}

// —— 环形口：多圈朝内的牙，层层反向旋转 ——
function maw(ctx, t, o = {}) {
  const { x = CX, y = CY, R = 420, rings = 3, a = 1, spin = 0, bite = 0, edge = C.blood, fill = C.bone, open = 1 } = o;
  if (a <= 0.003) return;
  // 喉咙深处的红光
  glow(ctx, x, y, R * 1.4, C.blood, 0.35 * a);
  glow(ctx, x, y, R * 0.5, C.ember, 0.25 * a * (0.5 + bite));
  const teeth = [];
  for (let i = 0; i < rings; i++) {
    const r = R * (1 - i * 0.27) * (1 - 0.12 * bite) * lerp(0.35, 1, open);
    const n = 22 - i * 4;
    const rot = spin * (i % 2 ? -1 : 1) * (1 + i * 0.4) + i * 0.3;
    const h = r * (0.4 + 0.14 * bite), w = (2 * Math.PI * r / n) * 0.6;
    for (let k = 0; k < n; k++) {
      const ang = rot + (k / n) * Math.PI * 2;
      const hk = h * (k % 2 ? 0.72 : 1) * (0.9 + 0.2 * Math.sin(k * 2.3 + i));   // 长短交错
      teeth.push(toothPts(x + Math.cos(ang) * r, y + Math.sin(ang) * r, w * (k % 2 ? 0.8 : 1), hk, ang + Math.PI, 0.1));
    }
  }
  drawTeeth(ctx, teeth, { a, edge, fill, edgeA: 0.9 });
  // 牙根暗、牙尖亮：用 multiply 压一层径向渐变
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const RR = R * 1.25;
  const g = ctx.createRadialGradient(x, y, R * 0.12, x, y, RR);
  g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(0.45, 'rgb(205,175,170)'); g.addColorStop(0.75, 'rgb(45,20,22)'); g.addColorStop(1, 'rgb(255,255,255)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, RR, 0, 6.2832); ctx.fill();   // 圆形，边缘回到"不压暗"，不会露出方边
  ctx.restore();
}

// —— 喉咙隧道：一节节牙环朝镜头冲来 ——
function throat(ctx, t, travel, o = {}) {
  const { a = 1, n = 10, R = 620, edge = C.blood, fill = C.bone, twist = 0.3 } = o;
  // 喉咙深处的红光
  glow(ctx, CX, CY, 520, C.blood, 0.45 * a);
  glow(ctx, CX, CY, 160, C.ember, 0.35 * a);
  for (let i = n - 1; i >= 0; i--) {
    const z = (i - (travel % 1)) / n;        // 0 近 → 1 远
    if (z < 0) continue;
    const zz = 0.38 + z * 2.4, s = 1 / zz;
    const fade = smooth(clamp((z - 0.02) * 5)) * clamp((1 - z) * 1.6);   // 贴近镜头的提前淡出
    if (fade <= 0.01) continue;
    const ring = i + Math.floor(travel);
    const teeth = [];
    const r = R * s, nT = 20, rot = twist * ring + t * 0.1 * (ring % 2 ? 1 : -1);
    const h = r * 0.38, w = (2 * Math.PI * r / nT) * 0.56;
    for (let k = 0; k < nT; k++) {
      const ang = rot + (k / nT) * Math.PI * 2;
      teeth.push(toothPts(CX + Math.cos(ang) * r, CY + Math.sin(ang) * r * 0.92, w * (k % 2 ? 0.8 : 1), h * (k % 2 ? 0.7 : 1), ang + Math.PI, 0.1));
    }
    const near = clamp(1.1 - z);
    drawTeeth(ctx, teeth, { a: a * fade, edge, fill: mix([70, 12, 18], fill, near * near), edgeA: 0.35 + 0.65 * near });
  }
}

// —— 裂纹：从一点向外分叉的折线树 ——
function crackTree(seed, x0, y0, ang0, len0, depth = 4) {
  const r = mulberry32(seed), segs = [];
  const grow = (x, y, ang, len, d, t0) => {
    let px = x, py = y;
    const steps = 3 + Math.floor(r() * 3);
    for (let s = 0; s < steps; s++) {
      ang += (r() - 0.5) * 0.9;
      const l = len / steps * (0.7 + r() * 0.6);
      const nx = px + Math.cos(ang) * l, ny = py + Math.sin(ang) * l;
      segs.push({ x0: px, y0: py, x1: nx, y1: ny, t: t0 + (s / steps) * 0.5 ** (depth - d), d });
      px = nx; py = ny;
      if (d > 0 && r() < 0.45) grow(px, py, ang + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7), len * 0.55, d - 1, t0 + 0.2);
    }
  };
  grow(x0, y0, ang0, len0, depth, 0);
  return segs;
}
const crackCache = new Map();
function crack(ctx, age, seed, x, y, o = {}) {
  const { len = 520, life = 1.8, a = 1, arms = 3, col = C.blood } = o;
  if (age < 0 || age > life) return;
  const key = seed + ':' + Math.round(x) + ':' + Math.round(y) + ':' + len + ':' + arms;
  let tree = crackCache.get(key);
  if (!tree) {
    const r = mulberry32(seed * 3 + 1); tree = [];
    for (let i = 0; i < arms; i++) tree.push(...crackTree(seed * 17 + i, x, y, r() * 6.283, len * (0.6 + r() * 0.6)));
    crackCache.set(key, tree);
    if (crackCache.size > 400) crackCache.delete(crackCache.keys().next().value);
  }
  const g = easeOutExpo(age / 0.14);           // 0.14 秒内裂开
  const fade = Math.pow(1 - age / life, 1.4);
  const outer = [], core = [];
  for (const s of tree) {
    if (s.t > g) continue;
    const f = clamp((g - s.t) / 0.15);
    const x1 = lerp(s.x0, s.x1, f), y1 = lerp(s.y0, s.y1, f);
    outer.push(s.x0, s.y0, x1, y1);
    if (s.d >= 3) core.push(s.x0, s.y0, x1, y1);
  }
  glowSegs(ctx, outer, col, a * fade, 1.6, 1.4);
  glowSegs(ctx, core, C.white, a * fade * 0.8, 1.0, 0.6);
}

// —— 血管：从画面边缘向内爬 ——
const VEINS = (() => {
  const r = mulberry32(99), out = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 4;
    const x = side === 0 ? -10 : side === 1 ? W + 10 : r() * W, y = side === 2 ? -10 : side === 3 ? H + 10 : r() * H;
    const ang = Math.atan2(CY - y, CX - x) + (r() - 0.5) * 0.8;
    out.push(crackTree(500 + i, x, y, ang, 500 + r() * 400, 4));
  }
  return out;
})();
function veins(ctx, grow, a = 1) {
  if (grow <= 0 || a <= 0) return;
  const segs = [];
  for (const tree of VEINS) for (const s of tree) {
    if (s.t > grow) continue;
    const f = clamp((grow - s.t) / 0.15);
    segs.push(s.x0, s.y0, lerp(s.x0, s.x1, f), lerp(s.y0, s.y1, f));
  }
  glowSegs(ctx, segs, C.blood, a * 0.8, 1.3, 1.2);
}

// —— 玻璃蛛网碎裂：径向裂线 + 不规则同心环 → 一块块碎片 ——
const GLASS = (() => {
  const r = mulberry32(304), nA = 14, nR = 6;
  const angs = Array.from({ length: nA }, (_, i) => (i / nA) * Math.PI * 2 + (r() - 0.5) * 0.25);
  const rad = j => (j === 0 ? 0 : 60 * Math.pow(1.85, j - 1)) ;
  const P = (i, j) => { const a = angs[(i + nA) % nA]; const rr = rad(j) * (j ? 0.85 + r() * 0.3 : 0); return [CX + Math.cos(a) * rr, CY + Math.sin(a) * rr]; };
  const grid = []; for (let j = 0; j <= nR; j++) { grid.push([]); for (let i = 0; i < nA; i++) grid[j].push(P(i, j)); }
  const shards = [];
  for (let j = 0; j < nR; j++) for (let i = 0; i < nA; i++) {
    const poly = j === 0 ? [grid[0][0], grid[1][i], grid[1][(i + 1) % nA]] : [grid[j][i], grid[j + 1][i], grid[j + 1][(i + 1) % nA], grid[j][(i + 1) % nA]];
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    shards.push({ poly, cx, cy, j, vx: (cx - CX) * (0.06 + r() * 0.1), vy: (cy - CY) * (0.06 + r() * 0.1) - 15 * r(), w: (r() - 0.5) * 1.2, delay: r() * 2.5 });
  }
  return { shards, grid, nA, nR };
})();
// crackF: 裂纹画出的进度；fall: 碎片飞散的时间（秒），burst: 额外的爆散
function glass(ctx, t, crackF, fall, a = 1, burst = 0) {
  const segs = [];
  for (const s of GLASS.shards) {
    const ft = Math.max(0, fall - s.delay);
    const d = ft;
    const ox = s.vx * d + s.vx * 6 * burst, oy = s.vy * d + s.vy * 6 * burst + 9 * ft * ft;
    const rot = s.w * (d * 0.5 + burst * 1.5);
    const pts = s.poly.map(([x, y]) => { const dx = x - s.cx, dy = y - s.cy, c = Math.cos(rot), sn = Math.sin(rot); return [s.cx + ox + dx * c - dy * sn, s.cy + oy + dx * sn + dy * c]; });
    const vis = clamp(crackF * (GLASS.nR + 1) - s.j);
    if (vis <= 0) continue;
    if (fall > 0) {
      ctx.fillStyle = rgba(C.ice, 0.05 * a);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) { const q = pts[(i + 1) % pts.length]; segs.push(pts[i][0], pts[i][1], lerp(pts[i][0], q[0], vis), lerp(pts[i][1], q[1], vis)); }
  }
  glowSegs(ctx, segs, C.ice, a * 0.85, 1.3, 1.1);
}

// —— 火星：咬合时从咬合线溅出，受重力下落 ——
function sparks(ctx, t, o = {}) {
  const { y = CY, n = 70, a = 1, col = C.ember, beats = 3 } = o;
  const { k } = A.sinceBeat(t);
  const segs = [];
  for (let j = 0; j < beats; j++) {
    const kk = k - j; if (kk < 0) continue;
    const g = A.hitAt(kk); if (g < 0.35) continue;
    const age = t - A.beatT(kk); if (age > 1.4) continue;
    const r = mulberry32(kk * 31 + 7);
    for (let i = 0; i < n; i++) {
      const x0 = r() * W, vx = (r() - 0.5) * 900, vy = -200 - r() * 700, life = 0.6 + r() * 0.8;
      if (age > life) continue;
      const px = x0 + vx * age, py = y + vy * age + 900 * age * age;
      const qx = px - vx * 0.03, qy = py - (vy + 1800 * age) * 0.03;
      segs.push(qx, qy, px, py);
    }
  }
  glowSegs(ctx, segs, col, a, 1.4, 0.8);
}

// —— 标题 TEETH：砸下来，带一点错位 ——
function title(ctx, t, t0, o = {}) {
  const { size = 230, y = CY + 80, a = 1, col = C.bone, life = 99 } = o;
  const age = t - t0; if (age < 0 || age > life) return;
  const s = 1 + 0.5 * Math.exp(-age * 10);
  const la = a * clamp(age * 14) * (1 - smooth((age - life + 0.4) / 0.4));
  ctx.save();
  ctx.translate(CX, y); ctx.scale(s, s);
  glow(ctx, 0, -size * 0.35, size * 2.4, C.blood, 0.4 * la * Math.exp(-age * 1.5));
  // 红色重影错开
  const j = 10 * Math.exp(-age * 6);
  text(ctx, 'TEETH', -j, 0, { family: 'Cinzel', size, weight: 700, color: C.blood, alpha: 0.7 * la, spacing: 0.12, blend: 'lighter' });
  text(ctx, 'TEETH', 0, 0, { family: 'Cinzel', size, weight: 700, color: col, alpha: la, spacing: 0.12 });
  ctx.restore();
}

module.exports = { CX, CY, cumulative, toothPts, drawTeeth, jaws, maw, throat, crack, veins, glass, GLASS, sparks, title };
