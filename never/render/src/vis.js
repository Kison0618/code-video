// 视觉元件：各段画面用这些积木搭出来。全部只依赖时间 t（和预先算好的累积表），可以任意跳帧渲染。
'use strict';
const K = require('./core');
const { W, H, C, rgba, mix, clamp, lerp, smooth, easeOut, easeOutExpo, glow, glowLine, glowSegs, line, circlePts, text, rot3, proj, mulberry32 } = K;
const A = require('./audio');

const CX = W / 2, CY = H / 2;

// —— 累积量表：速度随时间变化时，位置 = 速度的积分（预先按 1/240 秒积分，保证确定性）——
function cumulative(speedFn) {
  const dt = 1 / 240, n = Math.ceil((A.DUR + 2) * 240);
  const tab = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) tab[i] = tab[i - 1] + speedFn((i - 0.5) * dt) * dt;
  return t => { const f = clamp(t, 0, A.DUR + 1.9) * 240, i = Math.floor(f); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
}

// —— 核心光球 ——
function core(ctx, x, y, r, a, col = C.gold, hot = 0) {
  if (a <= 0) return;
  glow(ctx, x, y, r * 9, col, 0.18 * a);
  glow(ctx, x, y, r * 3.2, col, 0.6 * a);
  glow(ctx, x, y, r * 1.2, mix(C.white, col, 0.3), a);
  if (hot > 0) glow(ctx, x, y, r * 16 * hot, C.white, 0.25 * hot * a);
}

// —— 冲击波：从 (x,y) 扩散的细环 ——
function shock(ctx, x, y, age, life, rMax, col, a = 1, w = 1.6) {
  if (age < 0 || age > life) return;
  const u = age / life, r = easeOut(u) * rMax;
  glowLine(ctx, circlePts(x, y, r, 128), col, a * Math.pow(1 - u, 1.6), w * (1 + 2 * (1 - u)), 1.2);
}
// 最近 n 拍的冲击波
function beatShocks(ctx, t, x, y, o = {}) {
  const { n = 3, rMax = 1100, col = C.gold, a = 1, onlyKick = true, lifeBeats = 2 } = o;
  const { k } = A.sinceBeat(t);
  for (let j = 0; j < n; j++) {
    const kk = k - j; if (kk < 0) continue;
    const g = onlyKick ? A.kick(A.beatT(kk) + 0.001) : 1;
    if (g < 0.05) continue;
    shock(ctx, x, y, t - A.beatT(kk), A.BEAT * lifeBeats, rMax, col, a * g);
  }
}

// —— 星空：可加速成"跃迁"的流星线 ——
const STARS = (() => { const r = mulberry32(3); return Array.from({ length: 900 }, () => ({ x: r() * 2 - 1, y: r() * 2 - 1, z: r(), b: 0.3 + r() * 0.7 })); })();
function starfield(ctx, t, travel, speed, a = 1, col = C.ivory, cx = CX, cy = CY) {
  if (a <= 0) return;
  const segs = [], dots = [];
  const streak = clamp(speed / 6, 0, 1);
  for (const s of STARS) {
    const z = 1 - ((s.z + travel) % 1);        // 1 远 → 0 近
    const zz = 0.02 + z * 0.98;
    const px = cx + s.x * W * 0.55 / zz, py = cy + s.y * H * 0.55 / zz;
    if (px < -50 || px > W + 50 || py < -50 || py > H + 50) continue;
    if (streak > 0.05) {
      const z2 = Math.min(1, zz + 0.06 * streak);
      segs.push(cx + s.x * W * 0.55 / z2, cy + s.y * H * 0.55 / z2, px, py);
    } else dots.push([px, py, (1 - z) * 2 + 0.4, s.b]);
  }
  if (segs.length) glowSegs(ctx, segs, col, a * 0.7, 1.1, 0.6);
  ctx.save();
  for (const [x, y, r, b] of dots) { ctx.fillStyle = rgba(col, a * b * 0.8); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
  ctx.restore();
}

// —— 粒子爆发：每个底鼓从中心炸出一圈流光 ——
function burst(ctx, t, o = {}) {
  const { x = CX, y = CY, n = 90, reach = 900, col = C.gold, a = 1, beats = 1.2 } = o;
  const { k } = A.sinceBeat(t);
  for (let j = 0; j < 2; j++) {
    const kk = k - j; if (kk < 0) continue;
    const g = A.kick(A.beatT(kk) + 0.001); if (g < 0.1) continue;
    const age = (t - A.beatT(kk)) / (A.BEAT * beats); if (age > 1) continue;
    const r = mulberry32(kk * 7 + 1), segs = [];
    for (let i = 0; i < n; i++) {
      const ang = r() * 6.2832, sp = 0.35 + r() * 0.65;
      const d1 = easeOutExpo(age) * reach * sp, d0 = Math.max(0, d1 - 60 - 160 * sp * (1 - age));
      segs.push(x + Math.cos(ang) * d0, y + Math.sin(ang) * d0, x + Math.cos(ang) * d1, y + Math.sin(ang) * d1);
    }
    glowSegs(ctx, segs, col, a * g * Math.pow(1 - age, 1.3), 1.4, 0.8);
  }
}

// —— 频谱环：32 段频谱，左右镜像成 64 根 ——
function spectrumRing(ctx, t, x, y, R, L, a = 1, col = C.cyan, rot = 0) {
  if (a <= 0) return;
  const segs = [];
  for (let i = 0; i < 64; i++) {
    const band = i < 32 ? i : 63 - i;
    const v = A.spec(band, t);
    const ang = rot + (i / 64) * Math.PI * 2 - Math.PI / 2;
    const r0 = R, r1 = R + 6 + Math.pow(v, 1.6) * L;
    segs.push(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0, x + Math.cos(ang) * r1, y + Math.sin(ang) * r1);
  }
  glowSegs(ctx, segs, col, a, 3.2, 0.7);
}

// —— 激光：从画面底部射出的光束，按拍摆动 ——
function lasers(ctx, t, o = {}) {
  const { n = 6, a = 1, col = C.cyan, spread = 0.9, swing = 0.5, origin = 'bottom', flick = 1 } = o;
  const b = A.beatF(t);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const ox = origin === 'bottom' ? lerp(W * 0.15, W * 0.85, u) : CX, oy = origin === 'bottom' ? H + 20 : CY;
    // 每两拍换一次方向，按缓动扫过去
    const seg = Math.floor(b / 2), f = smooth((b / 2) - seg);
    const h = i % 2 ? 1 : -1;
    const ang0 = -Math.PI / 2 + h * spread * ((seg % 2 ? 1 : -1) * swing + (u - 0.5));
    const ang1 = -Math.PI / 2 + h * spread * ((seg % 2 ? -1 : 1) * swing + (u - 0.5));
    const ang = lerp(ang0, ang1, f);
    segs.push(ox, oy, ox + Math.cos(ang) * 2600, oy + Math.sin(ang) * 2600);
  }
  const fl = 0.55 + 0.45 * flick * A.offbeat(t, 12) + 0.4 * A.kick(t, 9);
  glowSegs(ctx, segs, col, a * fl, 2.0, 1.4);
  // 光源点
  for (let i = 0; i < n && origin === 'bottom'; i++) glow(ctx, lerp(W * 0.15, W * 0.85, n === 1 ? 0.5 : i / (n - 1)), H, 60, col, 0.6 * a);
}

// —— 曼陀罗：n 重旋转对称的光线图案，每小节换一组种子；带一道旋转残影 ——
function mandalaOnce(ctx, o, spin, alpha) {
  const { x = CX, y = CY, n = 12, R = 520, cols = [C.gold, C.white], seed = 1, pulse = 0, layers = 6 } = o;
  const r = mulberry32(seed * 911 + 3);
  const groups = [[], [], []], beads = [];
  for (let L = 0; L < layers; L++) {
    const rIn = R * (0.08 + 0.15 * L), rOut = rIn + R * (0.1 + 0.14 * r());
    const dir = L % 2 ? -1 : 1;
    const rot = spin * dir * (0.5 + 0.35 * L) + r() * 6.28;
    const kinds = [Math.floor(r() * 5), Math.floor(r() * 5)];
    const sc = 1 + pulse * (0.06 + 0.04 * L);
    const g = groups[L % 3];
    const P = (rr, aa) => [x + Math.cos(aa) * rr * sc, y + Math.sin(aa) * rr * sc];
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n, a2 = a0 + 2 * Math.PI / n, rm = (rIn + rOut) / 2;
      for (const kind of kinds) {
        let pts;
        if (kind === 0) pts = [P(rIn, a0), P(rOut, a1), P(rIn, a2)];                              // 锯齿星
        else if (kind === 1) pts = [P(rIn, a1), P(rOut, a1)];                                       // 放射线
        else if (kind === 2) pts = [P(rIn, a0), P(rOut, a0 + 0.2 * (a2 - a0)), P(rOut, a2 - 0.2 * (a2 - a0)), P(rIn, a2)];
        else if (kind === 3) pts = [P(rOut, a0), P(rm, a1), P(rOut, a2)];                           // 花瓣
        else pts = [P(rm, a0), P(rOut, a1), P(rm, a2), P(rIn, a1), P(rm, a0)];                      // 菱形
        for (let j = 0; j < pts.length - 1; j++) g.push(pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]);
      }
      if (L % 2 === 0) beads.push(P(rOut, a1));
    }
    // 环线
    if (r() < 0.5) { const c = circlePts(x, y, rOut * sc, 96); for (let j = 0; j < c.length - 1; j++) groups[2].push(c[j][0], c[j][1], c[j + 1][0], c[j + 1][1]); }
  }
  glowSegs(ctx, groups[0], cols[0], alpha, 1.8, 1.1);
  glowSegs(ctx, groups[1], cols[1], alpha * 0.9, 1.4, 1.1);
  glowSegs(ctx, groups[2], mix(cols[0], cols[1], 0.5), alpha * 0.6, 1.1, 1);
  for (const [bx, by] of beads) glow(ctx, bx, by, 10 + 16 * pulse, mix(cols[1], C.white, 0.5), alpha * (0.5 + 0.5 * pulse));
}
function mandala(ctx, t, o = {}) {
  const { a = 1, spin = 0 } = o;
  mandalaOnce(ctx, o, spin - 0.06, a * 0.3);   // 残影
  mandalaOnce(ctx, o, spin, a);
}

// —— 多面体（线框）——
const PHI = (1 + Math.sqrt(5)) / 2;
function edgesOf(V, len) {
  const E = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    const d = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
    if (Math.abs(d - len) < 1e-3) E.push([i, j]);
  }
  return E;
}
const ICO = (() => {
  const V = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) V.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]);
  const m = Math.hypot(1, PHI); return { V: V.map(v => v.map(c => c / m)), E: edgesOf(V.map(v => v.map(c => c / m)), 2 / m) };
})();
const DOD = (() => {
  const V = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) V.push([a, b, c]);
  for (const a of [-1, 1]) for (const b of [-1, 1]) V.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]);
  const m = Math.sqrt(3); const Vn = V.map(v => v.map(c => c / m));
  return { V: Vn, E: edgesOf(Vn, 2 / PHI / m) };
})();
const OCT = (() => { const V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; return { V, E: edgesOf(V, Math.SQRT2) }; })();
function poly(ctx, shape, o = {}) {
  const { x = CX, y = CY, R = 300, rx = 0, ry = 0, rz = 0, col = C.gold, a = 1, w = 1.4, vert = 1, camZ = 1400 } = o;
  const P = shape.V.map(v => proj(rot3(v.map(c => c * R), rx, ry, rz), camZ, camZ, x, y));
  const front = [], back = [];
  for (const [i, j] of shape.E) {
    const p = P[i], q = P[j]; if (!p || !q) continue;
    ((p[2] + q[2]) / 2 > 1 ? front : back).push(p[0], p[1], q[0], q[1]);
  }
  glowSegs(ctx, back, col, a * 0.45, w * 0.8, 0.7);
  glowSegs(ctx, front, col, a, w, 1);
  if (vert > 0) for (const p of P) if (p) glow(ctx, p[0], p[1], 10 * p[2], mix(col, C.white, 0.5), a * vert * clamp(p[2] - 0.5));
}

// —— 隧道：一节节环朝镜头冲来 ——
function tunnel(ctx, t, travel, o = {}) {
  const { sides = 6, R = 700, n = 22, a = 1, cols = [C.gold, C.cyan], twist = 0.25, cx = CX, cy = CY, gap = 1, rails = true } = o;
  const segsA = [], segsB = [], rail = [];
  let prev = null;
  for (let i = n - 1; i >= 0; i--) {
    const z = ((i - (travel % 1)) / n);      // 0 近 → 1 远
    const zz = 0.04 + z * 3.2;
    const s = 1 / zz;
    const ang = twist * (i + Math.floor(travel)) + t * 0.15;
    const ring = [];
    for (let k = 0; k <= sides; k++) {
      const aa = ang + (k / sides) * Math.PI * 2;
      ring.push([cx + Math.cos(aa) * R * s, cy + Math.sin(aa) * R * s * 0.9]);
    }
    const fade = clamp(z * 6) * clamp((1 - z) * 1.2);
    const target = (i + Math.floor(travel)) % 2 ? segsA : segsB;
    for (let k = 0; k < sides; k++) target.push(ring[k][0], ring[k][1], ring[k + 1][0], ring[k + 1][1], fade);
    if (rails && prev) for (let k = 0; k < sides; k++) rail.push(prev[k][0], prev[k][1], ring[k][0], ring[k][1], fade);
    prev = ring;
  }
  // 按亮度分档批量描（远处暗、近处亮）
  const draw = (arr, col, w) => {
    const buckets = [[], [], [], []];
    for (let i = 0; i < arr.length; i += 5) buckets[Math.min(3, Math.floor(arr[i + 4] * 4))].push(arr[i], arr[i + 1], arr[i + 2], arr[i + 3]);
    buckets.forEach((b, j) => glowSegs(ctx, b, col, a * (0.15 + 0.28 * j), w, 1));
  };
  draw(segsA, cols[0], 1.6); draw(segsB, cols[1], 1.6);
  draw(rail, mix(cols[0], cols[1], 0.5), 0.9);
}

// —— 标题 NEVER：逐字砸下，或整体砸下 ——
function title(ctx, t, t0, o = {}) {
  const { size = 260, y = CY + 90, a = 1, perLetter = 0, col = C.white, spacing = 0.35 } = o;
  const letters = ['N', 'E', 'V', 'E', 'R'];
  const total = size * (0.62 * 5 + spacing * 4);
  letters.forEach((ch, i) => {
    const ti = t0 + i * perLetter;
    const age = t - ti; if (age < 0) return;
    const s = 1 + 0.6 * Math.exp(-age * 9);
    const la = a * clamp(age * 12);
    const x = CX - total / 2 + i * size * (0.62 + spacing) + size * 0.31;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    glow(ctx, 0, -size * 0.32, size * 0.9, C.gold, 0.35 * la * Math.exp(-age * 2));
    text(ctx, ch, 0, 0, { size, weight: 300, color: col, alpha: la });
    ctx.restore();
  });
}

module.exports = { CX, CY, cumulative, core, shock, beatShocks, starfield, burst, spectrumRing, lasers, mandala, poly, ICO, DOD, OCT, tunnel, title };
