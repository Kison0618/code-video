// 九段画面。每段一个函数 draw(ctx, t, S)，S = 当前段落信息
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, easeOutExpo, vis, glow, glowLine, glowSegs, line, partial, circlePts, text, rot3, proj, mulberry32, hash } = K;
const A = require('./audio');
const V = require('./vis');
const FX = require('./fx');
const { CX, CY } = V;
const { barT, beatT, BEAT, BAR } = A;

// —— 前进速度（星空/隧道），积分成"走了多远" ——
function speed(t) {
  const b = A.barF(t), k = A.kick(t, 5);
  if (b < 0) return 0;
  if (b < 16) return 0.06 + 0.35 * k;
  if (b < 24) return 0.025;
  if (b < 40) return lerp(0.03, 0.14, (b - 24) / 16) + 0.2 * k;
  if (b < 45) return lerp(0.3, 1.4, (b - 40) / 5) + 0.6 * k;
  if (b < 47) return 0.04;
  if (b < 48) return lerp(0.6, 4.0, Math.pow(b - 47, 2));
  if (b < 64) return 0.9 + 1.4 * k;
  if (b < 72) return 0.015;
  if (b < 88) return lerp(0.04, 0.35, (b - 72) / 16) + 0.3 * k;
  if (b < 93) return lerp(0.5, 1.8, (b - 88) / 5) + 0.7 * k;
  if (b < 95) return 0.04;
  if (b < 96) return lerp(0.6, 4.5, Math.pow(b - 95, 2));
  if (b < 128) return 1.1 + 1.6 * k + (b >= 120 ? 0.6 : 0);
  return Math.max(0, 1.5 - (t - barT(128)) * 2);
}
const TRAVEL = V.cumulative(speed);
const TUN = V.cumulative(t => speed(t) * 2.2);
const SPIN = V.cumulative(t => 0.25 + 1.6 * A.kick(t, 4) * (A.barF(t) >= 48 ? 1 : 0.3));

// 每 4 小节一组配色（drop 里用）
const PALETTES = [[C.gold, C.white], [C.cyan, C.ice], [C.rose, C.gold], [C.white, C.violet]];
const palette = b => PALETTES[Math.floor(b / 4) % PALETTES.length];

// ———————————— 1. 开场：核心点燃 ————————————
function orbit(i) {
  const r = mulberry32(i * 13 + 5);
  return { R: 150 + i * 30, rx: 1.05 + (r() - 0.5) * 0.7, ry: (r() - 0.5) * 0.6, dir: i % 2 ? 1 : -1, col: i % 3 === 2 ? C.cyan : C.gold, ph: r() * 6.28 };
}
function drawRings(ctx, t, nRings, collapse, a = 1, camTilt = 0) {
  const bf = A.beatF(t);
  for (let i = 0; i < nRings; i++) {
    const o = orbit(i), born = barT(i);
    const ga = a * smooth(prog(t, born, born + BEAT)) * (i === nRings - 1 ? 1 : 1);
    if (ga <= 0) continue;
    const R = o.R * (1 - collapse);
    const rz = o.dir * t * 0.12 + i * 0.37, rx = o.rx + camTilt;
    const pts = [];
    for (let k = 0; k <= 96; k++) {
      const ang = (k / 96) * Math.PI * 2;
      const p = proj(rot3([Math.cos(ang) * R, Math.sin(ang) * R, 0], rx, o.ry, rz), 1600, 1600);
      pts.push([p[0], p[1]]);
    }
    const pop = Math.exp(-Math.max(0, t - born) * 3);
    glowLine(ctx, pts, o.col, ga * (0.55 + 0.6 * pop), 1.2 + 1.5 * pop, 1);
    // 光珠：每小节绕一圈，拍点上变亮
    const ang = (bf / 4) * Math.PI * 2 * o.dir + o.ph;
    const p = proj(rot3([Math.cos(ang) * R, Math.sin(ang) * R, 0], rx, o.ry, rz), 1600, 1600);
    V.core(ctx, p[0], p[1], 5 * p[2], ga, mix(o.col, C.white, 0.4), A.pulse(t, 8) * 0.4);
  }
}
function intro(ctx, t, S) {
  const k = A.kick(t), sub = A.env('sub', t);
  V.starfield(ctx, t, TRAVEL(t), speed(t), 0.8, C.ivory);
  const nRings = Math.min(16, Math.floor(S.bar) + 1);
  const collapse = easeIn(prog(t, barT(15), barT(16)));
  const tilt = 0.25 * Math.sin(Math.floor(S.bar / 4) * 1.7) * smooth(prog(S.bar % 4, 0, 0.6));
  drawRings(ctx, t, nRings, collapse, 1 - 0.3 * collapse, tilt);
  V.beatShocks(ctx, t, CX, CY, { rMax: 1000, col: C.gold, a: 0.8 * (1 - collapse) });
  V.burst(ctx, t, { n: 50, reach: 620, col: C.ivory, a: 0.6 * (1 - collapse) });
  V.core(ctx, CX, CY, 16 + 22 * k + 10 * sub + 30 * collapse, 1, C.gold, k + collapse);
  // 片头：N-E-V-E-R 每拍一个字母
  const ta = 1 - smooth(prog(t, barT(1.5), barT(2.2)));
  if (ta > 0) V.title(ctx, t, beatT(0), { perLetter: BEAT, a: ta, size: 250 });
}

// ———————————— 2. 漂流：星云 ————————————
const NEB = (() => { const r = mulberry32(21); return Array.from({ length: 2600 }, () => { const u = r(), v = r(), rr = 300 + Math.pow(r(), 0.7) * 900; const th = u * 6.283, ph = Math.acos(2 * v - 1); return { p: [rr * Math.sin(ph) * Math.cos(th), rr * Math.sin(ph) * Math.sin(th) * 0.55, rr * Math.cos(ph)], c: r(), tw: r() * 6.28, s: 0.6 + r() * 1.6 }; }); })();
function nebulaPts(t) {
  const ay = t * 0.06, ax = 0.35 + 0.1 * Math.sin(t * 0.07);
  return NEB.map(n => { const q = proj(rot3(n.p, ax, ay, 0), 1500, 1100); return q; });
}
function drift(ctx, t, S, aIn = 1) {
  const mid = A.env('mid', t), hi = A.env('high', t);
  // 大团柔光
  glow(ctx, CX - 300, CY - 80, 700, C.violet, 0.07 * aIn);
  glow(ctx, CX + 360, CY + 60, 650, C.cyan, 0.08 * aIn);
  glow(ctx, CX, CY, 420, C.gold, (0.06 + 0.06 * A.env('sub', t)) * aIn);
  const P = nebulaPts(t);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < NEB.length; i++) {
    const q = P[i]; if (!q) continue;
    const n = NEB[i];
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + n.tw);
    const a = aIn * clamp(q[2] * 1.1) * (0.4 + 0.6 * mid * tw);
    const col = n.c < 0.6 ? C.ice : n.c < 0.85 ? C.gold : C.violet;
    ctx.fillStyle = rgba(col, a);
    const s = n.s * q[2] * 2.6;
    ctx.beginPath(); ctx.arc(q[0], q[1], s, 0, 6.283); ctx.fill();
    if (i % 9 === 0) { ctx.globalAlpha = clamp(a * 0.7); ctx.drawImage(K.glowSprite(col), q[0] - s * 5, q[1] - s * 5, s * 10, s * 10); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  // 高频起音：随机星点闪亮
  for (const [ot, st] of A.hiOnsetsBetween(t - 0.6, t)) {
    const r = mulberry32(Math.round(ot * 1000)), i = Math.floor(r() * NEB.length), q = P[i];
    if (q) glow(ctx, q[0], q[1], 26 + 40 * st, C.ice, (1 - (t - ot) / 0.6) * aIn * (0.5 + st));
  }
  V.core(ctx, CX, CY, 9 + 8 * A.env('sub', t), 0.7 * aIn, C.gold);
}

// ———————————— 3. 星座：生命之花 + 麦塔特隆立方体 ————————————
const FOL = (() => {
  const c = [[0, 0]];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.push([Math.cos(a), Math.sin(a)]); }
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.push([2 * Math.cos(a), 2 * Math.sin(a)]); }
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; c.push([Math.sqrt(3) * Math.cos(a), Math.sqrt(3) * Math.sin(a)]); }
  return c;
})();
const MET = (() => { const L = []; for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) L.push([i, j]); const r = mulberry32(5); return L.sort(() => r() - 0.5); })();
function flower(ctx, t, o) {
  const { x = CX, y = CY, r0 = 120, rot = 0, a = 1, revealBeat0 = 96, metBeat0 = 128, scale = 1 } = o;
  const bf = A.beatF(t);
  const P = FOL.map(([u, v]) => { const c = Math.cos(rot), s = Math.sin(rot); return [x + (u * c - v * s) * r0 * scale, y + (u * s + v * c) * r0 * scale]; });
  const pu = A.pulse(t, 7);
  FOL.forEach((_, j) => {
    const b0 = revealBeat0 + j * 3, f = easeInOut((bf - b0) / 2);
    if (f <= 0) return;
    const pop = Math.exp(-Math.max(0, bf - b0 - 2) * 0.8);
    glowLine(ctx, partial(circlePts(P[j][0], P[j][1], r0 * scale, 120, rot + j), f), j === 0 ? C.white : j < 7 ? C.gold : C.cyan, a * (0.55 + 0.45 * pop), 1.3, 1);
    if (f >= 1) glow(ctx, P[j][0], P[j][1], 14 + 24 * pu, C.gold, a * (0.4 + 0.6 * pu));
  });
  // 麦塔特隆立方体：每拍连出两三条线
  const segs = [];
  MET.forEach(([i, j], n) => {
    const b0 = metBeat0 + n * 0.41; if (bf < b0) return;
    const f = easeOut((bf - b0) / 0.5);
    const p = P[i], q = P[j];
    segs.push(p[0], p[1], lerp(p[0], q[0], f), lerp(p[1], q[1], f));
    const age = bf - b0; if (age < 1) glow(ctx, lerp(p[0], q[0], f), lerp(p[1], q[1], f), 20, C.white, a * (1 - age));
  });
  glowSegs(ctx, segs, C.ice, a * 0.75, 1.1, 0.9);
}
function constel(ctx, t, S) {
  const b = S.bar;
  // 星云渐隐、收拢
  const nebA = 1 - smooth(prog(b, 0, 4));
  if (nebA > 0) drift(ctx, t, S, nebA);
  V.starfield(ctx, t, TRAVEL(t), speed(t), 0.5, C.ivory);
  const rot = t * 0.04, scale = 1 + 0.03 * A.env('sub', t) + 0.05 * A.kick(t);
  flower(ctx, t, { rot, scale, a: smooth(prog(b, 0, 1)) });
  if (b >= 8) V.beatShocks(ctx, t, CX, CY, { rMax: 900, col: C.cyan, a: 0.5 });
  if (b >= 12) V.spectrumRing(ctx, t, CX, CY, 470 * scale, 140, smooth(prog(b, 12, 14)) * 0.8, C.gold, rot);
  V.core(ctx, CX, CY, 12 + 16 * A.kick(t) + 8 * A.env('sub', t), 1, C.gold, A.kick(t) * 0.5);
}

// ———————————— 4. 隧道（两次蓄力共用）————————————
function rollStrobe(t, barStart) {
  // 最后一小节：前两拍八分音符、后两拍十六分音符闪白，越来越亮；drop 前 1/8 拍全黑
  const bf = A.beatF(t) - barStart * 4;
  if (bf < 0 || bf >= 4) return { flash: 0, black: 0 };
  const div = bf < 2 ? 2 : 4;
  const ph = (bf * div) % 1;
  const ramp = 0.25 + 0.6 * (bf / 4);
  return { flash: ramp * Math.exp(-ph * 5), black: bf > 3.85 ? 1 : 0 };
}
function tunnelScene(ctx, t, S, o) {
  const { cutA, cutB, rollBar, sides, cols, centerFn } = o;
  const b = A.barF(t);
  const inCut = b >= cutA && b < cutB, inRoll = b >= rollBar;
  const cutK = inCut ? smooth(prog(b, cutA, cutA + 0.3)) : 0;
  const intensity = inRoll ? 1 + (b - rollBar) : 1 - 0.7 * cutK;
  V.starfield(ctx, t, TRAVEL(t), speed(t), 0.7 * intensity, C.ivory);
  V.tunnel(ctx, t, TUN(t), { sides, cols, a: (0.85 - 0.55 * cutK) * smooth(prog(S.bar, 0, 1)), twist: inRoll ? 0.5 : 0.22, R: 760 });
  if (centerFn) centerFn(ctx, t, intensity, cutK);
  if (!inCut) V.beatShocks(ctx, t, CX, CY, { rMax: 900, col: cols[0], a: 0.6 });
  // 低音抽空：屏住呼吸，只剩一个随拍呼吸的白环
  if (cutK > 0) {
    const pu = A.pulse(t, 3);
    glowLine(ctx, circlePts(CX, CY, 90 + 40 * pu, 128), C.white, cutK * (0.5 + 0.5 * pu), 1.5, 1.4);
  }
}
function tunnel1(ctx, t, S) {
  tunnelScene(ctx, t, S, {
    cutA: 45, cutB: 47, rollBar: 47, sides: 6, cols: [C.gold, C.cyan],
    centerFn: (c, tt, I, cut) => {
      // 生命之花缩小，成为隧道尽头
      const sc = lerp(1, 0.32, easeInOut(prog(A.barF(tt), 40, 42)));
      flower(c, tt, { scale: sc, rot: tt * 0.3, a: 1 - 0.5 * cut, revealBeat0: -100, metBeat0: -100 });
      V.core(c, CX, CY, 14 + 20 * A.kick(tt) + 20 * Math.max(0, I - 1), 1, C.gold, Math.max(0, I - 1));
    },
  });
}

// ———————————— 5. drop：曼陀罗爆发 ————————————
function dropCore(ctx, t, o) {
  const { bar, palIdx = null, mandalaR = 620, laserN = 6, tunnelOn = false, seedBase = 0, layers = 6 } = o;
  const k = A.kick(t);
  const pal = palIdx !== null ? PALETTES[palIdx % PALETTES.length] : palette(bar);
  V.starfield(ctx, t, TRAVEL(t), speed(t), 0.9, pal[1]);
  if (tunnelOn) V.tunnel(ctx, t, TUN(t), { sides: 12, cols: pal, a: 0.55, twist: 0.35, R: 820 });
  V.lasers(ctx, t, { n: laserN, col: pal[0], a: 0.8, spread: 0.55, swing: 0.45 });
  V.mandala(ctx, t, { R: mandalaR, n: 12, cols: pal, seed: seedBase + Math.floor(A.barF(t)), spin: SPIN(t), pulse: k, layers });
  V.beatShocks(ctx, t, CX, CY, { rMax: 1300, col: pal[1], a: 0.9 });
  V.burst(ctx, t, { n: 110, reach: 1100, col: pal[0], a: 0.9 });
  V.core(ctx, CX, CY, 20 + 40 * k, 1, pal[0], k);
}
function drop1(ctx, t, S) {
  const b = A.barF(t);
  dropCore(ctx, t, { bar: S.bar, seedBase: 0 });
  // drop 开头：NEVER 整体砸下
  const ta = 1 - smooth(prog(t, barT(48) + BEAT * 2.2, barT(48) + BEAT * 3.6));
  if (ta > 0) V.title(ctx, t, barT(48), { a: ta, size: 300, y: CY + 110 });
}

// ———————————— 6. 水晶：碎片悬浮 ————————————
const SHARDS = (() => {
  const r = mulberry32(64);
  return Array.from({ length: 240 }, () => ({
    p: [(r() - 0.5) * 2600, (r() - 0.5) * 1500, (r() - 0.2) * 1800],
    s: 18 + Math.pow(r(), 2) * 80, a: [r() * 6.28, r() * 6.28, r() * 6.28], w: [(r() - 0.5) * 0.6, (r() - 0.5) * 0.6, (r() - 0.5) * 0.6],
    col: r() < 0.7 ? C.ice : r() < 0.8 ? C.gold : C.violet,
  }));
})();
function crystal(ctx, t, S) {
  const t0 = barT(64), age = t - t0;
  // 开头 1 拍：从中心炸散，之后慢动作漂浮
  const spread = easeOutExpo(age / (BEAT * 2));
  const ay = t * 0.03;
  for (const sh of SHARDS) {
    const c3 = [sh.p[0] * spread, sh.p[1] * spread, sh.p[2] * spread];
    const tri = [0, 1, 2].map(i => {
      const ang = i * 2.094;
      const v = rot3([Math.cos(ang) * sh.s, Math.sin(ang) * sh.s, 0], sh.a[0] + sh.w[0] * t, sh.a[1] + sh.w[1] * t, sh.a[2] + sh.w[2] * t);
      return proj(rot3([c3[0] + v[0], c3[1] + v[1], c3[2] + v[2] - age * 6], 0.1, ay, 0), 1400, 1100);
    });
    if (tri.some(q => !q)) continue;
    const depth = tri[0][2];
    const a = clamp(depth * 1.2) * (0.55 + 0.3 * A.env('mid', t));
    ctx.fillStyle = rgba(sh.col, 0.05 * a);
    ctx.beginPath(); ctx.moveTo(tri[0][0], tri[0][1]); ctx.lineTo(tri[1][0], tri[1][1]); ctx.lineTo(tri[2][0], tri[2][1]); ctx.closePath(); ctx.fill();
    glowLine(ctx, tri.map(q => [q[0], q[1]]), sh.col, a * 0.8, 1, 0.6, true);
  }
  for (const [ot, st] of A.hiOnsetsBetween(t - 0.5, t)) {
    const r = mulberry32(Math.round(ot * 997)), sh = SHARDS[Math.floor(r() * SHARDS.length)];
    const q = proj(rot3(sh.p, 0.1, ay, 0), 1400, 1100);
    if (q) glow(ctx, q[0], q[1], 40 + 60 * st, C.white, (1 - (t - ot) / 0.5) * 0.8);
  }
  V.core(ctx, CX, CY, 8 + 6 * A.env('sub', t), 0.8, C.ice);
  if (age < 0.35) FX.flash(ctx, 0.55 * Math.pow(1 - age / 0.35, 2), C.ice);
}

// ———————————— 7. 上升：嵌套多面体 ————————————
const RISE = (() => { const r = mulberry32(72); return Array.from({ length: 420 }, () => ({ x: r() * W, y0: r(), sp: 0.4 + r() * 0.8, l: 20 + r() * 80, c: r() })); })();
function polyStack(ctx, t, b, I = 1, scale = 1) {
  const k = A.kick(t), pu = A.pulse(t, 6);
  const rot = t * (0.25 + 0.05 * b);
  const lay = [
    [V.ICO, 0, 230, C.gold], [V.DOD, 4, 330, C.cyan], [V.OCT, 8, 430, C.ice], [V.ICO, 12, 560, C.rose],
  ];
  for (const [shape, from, R, col] of lay) {
    const a = smooth(prog(b, from, from + 1)) * I;
    if (a <= 0) continue;
    const pop = Math.exp(-Math.max(0, b - from) * 1.5);
    poly(ctx, shape, R * scale * (1 + 0.06 * k + 0.6 * pop * 0), rot * (from % 8 ? -1 : 1) + from, rot * 0.7 + from * 0.3, col, a * (0.7 + 0.3 * pu));
  }
}
function poly(ctx, shape, R, ax, ay, col, a) { V.poly(ctx, shape, { R, rx: ax, ry: ay, rz: ax * 0.3, col, a, w: 1.5 }); }
function ascent(ctx, t, S) {
  const b = S.bar;
  const energy = 0.3 + 0.7 * (b / 16);
  // 上升的光线
  const segs = [];
  for (const p of RISE) {
    const y = H + 100 - (((p.y0 + t * p.sp * 0.35 * energy) % 1) * (H + 200));
    segs.push(p.x, y, p.x, y + p.l * energy);
  }
  glowSegs(ctx, segs, C.gold, 0.35 * energy, 1, 0.6);
  polyStack(ctx, t, b);
  if (b >= 8) {
    V.spectrumRing(ctx, t, CX, CY, 600, 160, smooth(prog(b, 8, 9)), C.cyan, t * 0.1);
    V.beatShocks(ctx, t, CX, CY, { rMax: 1000, col: C.gold, a: 0.6 });
  }
  V.core(ctx, CX, CY, 10 + 18 * A.kick(t) + 6 * A.env('sub', t), 1, C.white, A.kick(t) * 0.6);
  // 开头从水晶碎片里"聚拢"
  if (b < 0.25) FX.flash(ctx, 0.15 * Math.pow(1 - b / 0.25, 2), C.ice);
}
function tunnel2(ctx, t, S) {
  tunnelScene(ctx, t, S, {
    cutA: 93, cutB: 95, rollBar: 95, sides: 12, cols: [C.cyan, C.rose],
    centerFn: (c, tt, I, cut) => { polyStack(c, tt, 16, (1 - 0.6 * cut), 0.45 + 0.1 * Math.max(0, I - 1)); V.core(c, CX, CY, 12 + 18 * A.kick(tt) + 30 * Math.max(0, I - 1), 1, C.white, Math.max(0, I - 1)); },
  });
}

// ———————————— 8. 终极 drop：32 小节四句 ————————————
// 透视光栅：上下两个平面朝镜头移动
function grid(ctx, t, col, a) {
  const tr = TUN(t) * 0.5, kk = A.kick(t);
  const buckets = [[], [], [], []];
  for (const side of [1]) {
    const yH = side * 300;
    // 横线：越远越暗，近处最亮
    for (let i = 0; i < 18; i++) {
      const z = 0.1 + ((i + 1 - (tr % 1)) / 18) * 2.6;
      const y = CY + yH / z;
      if (Math.abs(y - CY) > H / 2 + 40) continue;
      buckets[Math.min(3, Math.floor(4 * (1 - z / 2.7)))].push(0, y, W, y);
    }
    // 纵线：汇向中心的消失点
    for (let x = -12; x <= 12; x++) {
      const xs = x * 190;
      buckets[1].push(CX + xs / 0.1, CY + yH / 0.1, CX + xs / 2.7, CY + yH / 2.7);
    }
  }
  buckets.forEach((bk, j) => glowSegs(ctx, bk, col, a * (0.12 + 0.22 * j) * (0.7 + 0.5 * kk), 1.2, 0.8));
  // 地平线辉光
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, CY - 60, 0, CY + 160);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, rgba(col, 0.18 * a * (0.6 + 0.6 * kk))); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, CY - 60, W, 220);
  ctx.restore();
}
// 万花筒：把一层画面切成 8 个楔形，交替镜像、整体旋转
const KA = new Canvas(W, H), kx = KA.getContext('2d'), KB = new Canvas(W, H);
function kaleido(ctx, t, drawFn, n = 8, rot = 0) {
  kx.reset();
  drawFn(kx, t);
  FX.flatten(KA, KB);   // 先拍扁，8 个楔形都只是贴图
  const R = Math.hypot(W, H) / 2 + 20;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(rot + (i / n) * Math.PI * 2);
    if (i % 2) ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -Math.PI / n - 0.003, Math.PI / n + 0.003); ctx.closePath(); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(KB, -CX, -CY);
    ctx.restore();
  }
}
function finalDrop(ctx, t, S) {
  const b = S.bar, k = A.kick(t);
  const phrase = Math.floor(b / 8);
  if (phrase === 0) {
    dropCore(ctx, t, { bar: b, tunnelOn: true, palIdx: 0, seedBase: 300 });
    const ta = 1 - smooth(prog(t, barT(96) + BEAT * 2.2, barT(96) + BEAT * 3.6));
    if (ta > 0) V.title(ctx, t, barT(96), { a: ta, size: 300, y: CY + 110 });
  } else if (phrase === 1) {
    grid(ctx, t, C.cyan, 0.9);
    V.starfield(ctx, t, TRAVEL(t), speed(t), 0.7, C.ice);
    V.lasers(ctx, t, { n: 8, col: C.ice, a: 0.85, spread: 0.6, swing: 0.5 });
    V.mandala(ctx, t, { R: 380, n: 16, cols: [C.cyan, C.white], seed: 500 + Math.floor(b), spin: SPIN(t), pulse: k, layers: 3 });
    V.beatShocks(ctx, t, CX, CY, { rMax: 1200, col: C.ice, a: 0.9 });
    V.burst(ctx, t, { n: 100, reach: 1100, col: C.white, a: 0.8 });
    V.core(ctx, CX, CY, 18 + 36 * k, 1, C.cyan, k);
  } else if (phrase === 2) {
    V.starfield(ctx, t, TRAVEL(t), speed(t), 0.6, C.rose);
    kaleido(ctx, t, (c, tt) => {
      V.mandala(c, tt, { R: 620, n: 6, cols: [C.rose, C.gold], seed: 700 + Math.floor(b), spin: SPIN(tt) * 1.3, pulse: A.kick(tt), layers: 5 });
      polyStack(c, tt, 16, 0.8, 0.7);
      V.burst(c, tt, { n: 80, reach: 1000, col: C.violet, a: 0.9 });
    }, 8, t * 0.2 + 0.4 * SPIN(t) * 0.1);
    V.beatShocks(ctx, t, CX, CY, { rMax: 1300, col: C.gold, a: 0.9 });
    V.core(ctx, CX, CY, 14 + 22 * k, 0.85, C.rose, 0.4 * k);
  } else {
    // 最后 8 小节：所有元素叠到最满，每小节换色
    const pal = PALETTES[Math.floor(b) % 4];
    V.starfield(ctx, t, TRAVEL(t), speed(t), 1, pal[1]);
    V.tunnel(ctx, t, TUN(t), { sides: 12, cols: pal, a: 0.6, twist: 0.4, R: 860 });
    grid(ctx, t, pal[1], 0.4);
    V.lasers(ctx, t, { n: 8, col: pal[0], a: 0.9, spread: 0.65, swing: 0.55 });
    V.mandala(ctx, t, { R: 600, n: 12, cols: pal, seed: 900 + Math.floor(b), spin: SPIN(t), pulse: k, layers: 5 });
    V.mandala(ctx, t, { R: 360, n: 8, cols: [pal[1], pal[0]], seed: 950 + Math.floor(b), spin: -SPIN(t) * 1.4, pulse: k, layers: 3 });
    polyStack(ctx, t, 16, 0.9, 0.55);
    V.spectrumRing(ctx, t, CX, CY, 700, 180, 0.9, pal[1], -t * 0.2);
    V.beatShocks(ctx, t, CX, CY, { rMax: 1400, col: pal[1], a: 1 });
    V.burst(ctx, t, { n: 140, reach: 1200, col: pal[0], a: 1 });
    // 最后一小节：全部向中心收缩
    const col = easeIn(prog(b, 31, 32));
    V.core(ctx, CX, CY, 14 + 22 * k + 80 * col, 0.85, pal[0], 0.4 * k + 2 * col);
    if (b >= 24 && b < 24.5) V.title(ctx, t, barT(120), { a: 1 - smooth(prog(t, barT(120) + BEAT * 1.5, barT(120) + BEAT * 2.2)), size: 300, y: CY + 110 });
  }
}

// ———————————— 9. 尾声 ————————————
function outro(ctx, t, S) {
  const age = t - barT(128);
  V.core(ctx, CX, CY, 10 * Math.exp(-age * 0.8) + 3, 1 - smooth(prog(age, 1.5, 2.4)), C.gold);
  glowLine(ctx, circlePts(CX, CY, 120 + age * 600, 160), C.white, Math.exp(-age * 2.5), 2, 1.5);
  const ta = vis(age, 0.2, 2.45, 0.4, 0.6);
  text(ctx, 'N E V E R', CX, CY + 160, { size: 46, weight: 300, alpha: 0.85 * ta, spacing: 0.25 });
}

function driftScene(c, t, S) {
  drift(c, t, S, smooth(prog(S.bar, 0, 0.5)));
  // 开场收缩成的亮核，在安静段的第一拍里慢慢熄灭
  const age = t - S.t0;
  if (age < 1.6) V.core(c, CX, CY, 9 + 46 * Math.exp(-age * 2.2), Math.exp(-age * 1.6), C.gold, Math.exp(-age * 3));
}
const DRAW = { intro, drift: driftScene, constel, tunnel: tunnel1, drop1, crystal, ascent, tunnel2, final: finalDrop, outro };
module.exports = { DRAW, speed, rollStrobe, palette, PALETTES };
