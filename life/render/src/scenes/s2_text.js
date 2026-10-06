// 第二幕 文字：双螺旋、复制、抄错、错误写出万物（96–166 秒）
'use strict';
const K = require('../core');
const { W, H, C, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, vis, glow, glowLine, line, partial, text, fmt, mulberry32, rgba, mix } = K;
const TL = require('../timeline');
const UI = require('../ui');
const S1 = require('./s1_thread');

const events = [];
const X0 = 120, X1 = 1800;
const A0 = 95, KW = (2 * Math.PI) / 560;
const RUNG = 30;
const NR = Math.floor((X1 - X0) / RUNG) + 1;
const BASES = 'ATCG', COMP = { A: 'T', T: 'A', C: 'G', G: 'C' };
const SEQ = (() => { const r = mulberry32(42); return Array.from({ length: NR }, () => BASES[Math.floor(r() * 4)]); })();
const BASE_COL = { A: C.gold, T: C.gold, C: C.cyan, G: C.cyan };

const phase = t => -t * 0.75;

// 画一段双螺旋。opt: cy, amp, a, newCol（新链颜色，复制时用）, rungA, x0, x1, ys(x)->[y1,y2,depth]
function helix(ctx, t, o) {
  const { cy = 540, amp = A0, a = 1, x0 = X0, x1 = X1, strandCol1 = C.gold, strandCol2 = C.ivory, rungA = 1, mutate = null, xmask = null } = o;
  if (a <= 0.002) return;
  const ph = phase(t) + (o.phOff || 0);
  // 横档（碱基对），按前后深度变暗
  ctx.save();
  ctx.lineCap = 'round';
  for (let n = 0; n < NR; n++) {
    const x = X0 + n * RUNG;
    if (x < x0 || x > x1) continue;
    const m = xmask ? xmask(x) : 1;
    if (m <= 0.01) continue;
    const th = KW * x + ph;
    const y1 = cy + amp * Math.sin(th), y2 = cy - amp * Math.sin(th);
    const depth = Math.cos(th);
    const ra = (0.16 + 0.22 * Math.abs(Math.sin(th))) * a * rungA * m;
    let col = BASE_COL[SEQ[n]];
    let extra = 0;
    if (mutate && mutate.n === n) { col = mix(col, C.rose, mutate.k); extra = mutate.k; }
    ctx.strokeStyle = rgba(col, ra + 0.6 * extra);
    ctx.lineWidth = 2.2 + 1.5 * extra;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    if (extra > 0.01) glow(ctx, x, cy, 60 * extra + 10, C.rose, 0.8 * extra);
  }
  ctx.restore();
  // 两条主链：分前后两层，后层暗
  for (const [sgn, col] of [[1, strandCol1], [-1, strandCol2]]) {
    let seg = [], front = null;
    const flush = () => {
      if (seg.length > 1) {
        const m = xmask ? xmask(seg[Math.floor(seg.length / 2)][0]) : 1;
        if (front) glowLine(ctx, seg, col, a * m, 1.8);
        else line(ctx, seg, col, 0.32 * a * m, 1.4);
      }
    };
    for (let x = x0; x <= x1; x += 5) {
      const th = KW * x + ph;
      const y = cy + sgn * amp * Math.sin(th);
      const f = sgn * Math.cos(th) > 0;
      if (front === null) front = f;
      if (f !== front) { seg.push([x, y]); flush(); seg = [[x, y]]; front = f; }
      else seg.push([x, y]);
    }
    flush();
  }
}

// —— 线团（细胞核里的 DNA）——
const KNOT = (() => {
  const r = mulberry32(8), N = 700, out = [];
  const fr = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => [1 + r() * 23, r() * 6.28, 0.3 + r()]));
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const p = fr.map(axis => axis.reduce((acc, [f, ph, amp]) => acc + amp * Math.sin(f * s * 6.28 + ph), 0));
    out.push(p);
  }
  // 归一化到球内
  let m = 0; for (const p of out) m = Math.max(m, Math.hypot(...p));
  return out.map(p => p.map(v => v / m));
})();
function knotPts(t, cx, cy, R) {
  const a = t * 0.35, ca = Math.cos(a), sa = Math.sin(a);
  return KNOT.map(([x, y, z]) => [cx + R * (x * ca + z * sa), cy + R * y]);
}
function linePts(cy) { return KNOT.map((_, i) => [lerp(X0, X1, i / (KNOT.length - 1)), cy]); }

// —— 线描：眼睛、翅膀、花 ——
function quad(p0, c, p1, n = 30) { const o = []; for (let k = 0; k <= n; k++) { const u = k / n; o.push([(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]]); } return o; }
function circle(cx, cy, r, n = 48, a0 = -Math.PI / 2) { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + k / n * 6.2832; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
function eyeShape(cx, cy) {
  const w = 120, h = 95;
  const up = quad([cx - w, cy], [cx, cy - h], [cx + w, cy]);
  const lo = quad([cx - w, cy], [cx, cy + h * 0.78], [cx + w, cy]);
  const lashes = [];
  for (let k = 1; k <= 7; k++) {
    const u = k / 8, p = up[Math.round(u * 30)];
    const ang = -Math.PI / 2 + (u - 0.5) * 1.6;
    lashes.push([p, [p[0] + 18 * Math.cos(ang), p[1] + 18 * Math.sin(ang)]]);
  }
  return [up, lo, circle(cx, cy - 2, 38), circle(cx, cy - 2, 15, 32), ...lashes];
}
function leaf(bx, by, ang, L, Wd, n = 22) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u, Wd * Math.sin(Math.PI * Math.pow(u, 0.8))]); }
  for (let i = n; i >= 0; i--) { const u = i / n; pts.push([u, -Wd * 0.55 * Math.sin(Math.PI * Math.pow(u, 0.8))]); }
  return pts.map(([u, v]) => [bx + u * L * Math.cos(ang) - v * Math.sin(ang), by + u * L * Math.sin(ang) + v * Math.cos(ang)]);
}
function wingShape(cx, cy) {
  const out = [];
  // 前缘：肩 → 腕 → 翼尖
  const edge = quad([cx - 135, cy + 40], [cx - 70, cy - 105], [cx + 70, cy - 95], 40);
  out.push(edge);
  // 飞羽：沿前缘挂下，越靠翼尖越长、越向后掠
  const N = 12;
  for (let k = 0; k < N; k++) {
    const u = k / (N - 1);
    const p = edge[Math.round(u * 40)];
    const ang = lerp(1.55, 0.3, Math.pow(u, 0.9));
    const L = lerp(60, 150, Math.pow(u, 1.2));
    out.push(leaf(p[0], p[1], ang, L, 0.11 * L));
  }
  // 覆羽
  for (let k = 0; k < 7; k++) {
    const u = 0.08 + k / 9;
    const p = edge[Math.round(u * 40)];
    out.push(leaf(p[0], p[1], lerp(1.5, 0.75, u), 46, 7));
  }
  return out;
}
function flowerShape(cx, cy, s = 1) {
  const out = [];
  const P = 13;
  for (let k = 0; k < P; k++) {
    const ang = k / P * 6.2832 + 0.2;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, side = 1;
      pts.push([u, side * 0.26 * Math.sin(Math.PI * u)]);
    }
    for (let i = 24; i >= 0; i--) { const u = i / 24; pts.push([u, -0.26 * Math.sin(Math.PI * u)]); }
    const L = 92 * s, r0 = 36 * s;
    out.push(pts.map(([u, v]) => {
      const rr = r0 + u * L, w = v * L;
      return [cx + rr * Math.cos(ang) - w * Math.sin(ang), cy + rr * Math.sin(ang) + w * Math.cos(ang)];
    }));
  }
  out.push(circle(cx, cy, 34 * s, 48));
  return out;
}
function drawShape(ctx, polys, f, col, a, w = 1.4) {
  if (a <= 0.002 || f <= 0) return;
  const n = polys.length;
  polys.forEach((p, i) => {
    const fi = clamp(f * n - i * 0.55, 0, 1);
    if (fi > 0) glowLine(ctx, partial(p, easeInOut(fi)), col, a, w, 0.7);
  });
}
const FLOWER_AT = [1360, 340];
function flowerXform(t) {
  // 161.5 秒后花移到画面中央并放大，交给第三幕的向日葵
  const u = easeInOut(prog(t, 161.2, 165.0));
  return { x: lerp(FLOWER_AT[0], 960, u), y: lerp(FLOWER_AT[1], 500, u), s: lerp(1, 4.6, u) };
}

// —— 突变位置 ——
const MUTS = (() => { const r = mulberry32(64); return Array.from({ length: 64 }, (_, i) => ({ x: lerp(X0 + 20, X1 - 20, r()), tIn: 136.0 + (i / 64) * 5.6 + r() * 0.3 })); })();
MUTS.forEach((m, i) => { if (i % 3 === 0) events.push({ t: m.tIn, type: 'mut' }); });
const MUT_N = Math.round((1150 - X0) / RUNG);
events.push({ t: 131.2, type: 'error' });
[104.6, 105.3, 106.0, 106.7].forEach(t => events.push({ t, type: 'letter' }));
const BLOOM = [[560, 'EYE', eyeShape], [960, 'WING', wingShape], [1360, 'FLOWER', null]];
BLOOM.forEach((b, i) => events.push({ t: 151.2 + i * 0.5, type: 'bloom' }));

function draw(ctx, t) {
  if (t < 96 || t > 166) return;

  // —— 97–110 双螺旋 + 字母 ——
  const hA = smooth(prog(t, 96.4, 98.4));
  // 110–118：收成线 → 缠成线团 → 拉直成两米 → 回到螺旋
  const flat = smooth(prog(t, 110.0, 110.9)) * (1 - smooth(prog(t, 116.6, 117.6)));
  const toKnot = easeInOut(prog(t, 110.8, 112.6)) * (1 - easeInOut(prog(t, 113.6, 116.2)));
  const inKnotPhase = t > 110.8 && t < 116.7;
  // 118–124 复制叉
  const fork = lerp(X0 - 240, X1 + 260, easeInOut(prog(t, 118.2, 123.8)));
  const repl = t >= 118.2;
  // 135.5 起两条螺旋收拢成一条细线（"你"的基因组）
  const toGenome = easeInOut(prog(t, 135.6, 137.4));

  if (t < 118.2) {
    if (!inKnotPhase) helix(ctx, t, { amp: A0 * (1 - flat), a: hA });
    else {
      const pts = knotPts(t, 960, 540, 88).map((p, i) => { const l = linePts(540)[i]; return [lerp(l[0], p[0], toKnot), lerp(l[1], p[1], toKnot)]; });
      glowLine(ctx, pts, C.gold, 0.9, 1.2, 0.6);
      const ka = vis(t, 112.2, 114.0, 0.4, 0.4);
      text(ctx, '细胞核  ≈ 6 μm', 960, 676, { size: 20, weight: 300, alpha: 0.8 * ka, spacing: 0.15 });
      ctx.save(); ctx.strokeStyle = rgba(C.cyan, 0.35 * ka); ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(960, 540, 104, 0, 6.283); ctx.stroke(); ctx.restore();
      const la = vis(t, 115.4, 117.4, 0.5, 0.5);
      if (la > 0) {
        line(ctx, [[X0, 600], [X1, 600]], C.cyan, 0.4 * la, 1);
        line(ctx, [[X0, 590], [X0, 610]], C.cyan, 0.5 * la, 1);
        line(ctx, [[X1, 590], [X1, 610]], C.cyan, 0.5 * la, 1);
        text(ctx, '≈ 2 米', 960, 640, { size: 22, weight: 300, alpha: 0.85 * la, color: C.gold, spacing: 0.2 });
      }
    }
    // 序列文字
    const sa = hA * vis(t, 98.2, 110.3, 1.2, 0.5);
    if (sa > 0) {
      ctx.save();
      const scroll = (t - 97) * 26;
      for (let n = 0; n < NR; n++) {
        const x = X0 + ((n * RUNG - scroll) % (X1 - X0) + (X1 - X0)) % (X1 - X0);
        const edge = Math.min(smooth((x - X0) / 120), smooth((X1 - x) / 120));
        const b = SEQ[n];
        text(ctx, b, x, 736, { size: 17, family: 'Mono', weight: 400, alpha: 0.75 * sa * edge, color: BASE_COL[b] });
        text(ctx, COMP[b], x, 764, { size: 17, family: 'Mono', weight: 300, alpha: 0.35 * sa * edge, color: BASE_COL[COMP[b]] });
      }
      ctx.restore();
    }
    // 四个字母
    const la = vis(t, 104.4, 110.2, 0.5, 0.6);
    if (la > 0) {
      ['A', 'T', 'C', 'G'].forEach((b, i) => {
        const a = la * smooth(prog(t, 104.6 + i * 0.7, 105.2 + i * 0.7));
        const x = 960 + (i - 1.5) * 150;
        text(ctx, b, x, 300, { size: 64, family: 'Garamond', weight: 300, alpha: a, color: BASE_COL[b], glowA: 0.25 });
      });
      const pa = la * smooth(prog(t, 107.4, 108.4));
      for (const [i, j] of [[0, 1], [2, 3]]) {
        const xa = 960 + (i - 1.5) * 150, xb = 960 + (j - 1.5) * 150;
        const arc = quad([xa, 320], [(xa + xb) / 2, 360], [xb, 320], 20);
        line(ctx, arc, C.ivory, 0.45 * pa, 1);
      }
      text(ctx, 'A — T     C — G', 960, 392, { size: 14, family: 'Mono', alpha: 0.5 * pa, spacing: 0.3 });
    }
  } else if (toGenome < 1) {
    // 复制：叉口左侧分成上下两条新螺旋
    const ga = 1 - toGenome;
    const sep = 180 * (1 - toGenome);
    const ph = phase(t);
    const blend = x => smooth((fork - x) / 240);
    // 原螺旋（叉口右侧）
    helix(ctx, t, { a: ga, x0: Math.max(X0, fork - 10), x1: X1, xmask: x => 1 - blend(x) });
    for (const dir of [-1, 1]) {
      const cy = 540 + dir * sep;
      // 旧链从原位置平滑过渡到子螺旋
      const old = [], neu = [];
      for (let x = X0; x <= Math.min(X1, fork); x += 5) {
        const th = KW * x + ph, b = blend(x);
        const yOld = 540 + dir * A0 * Math.sin(th);
        old.push([x, lerp(yOld, cy + dir * A0 * Math.sin(th), b)]);
        if (b > 0.35) neu.push([x, cy - dir * A0 * Math.sin(th)]);
      }
      glowLine(ctx, old, dir < 0 ? C.gold : C.ivory, 0.95 * ga, 1.8);
      glowLine(ctx, neu, C.cyan, 0.85 * ga, 1.6);
      // 新的横档
      ctx.save();
      for (let n = 0; n < NR; n++) {
        const x = X0 + n * RUNG;
        if (x > fork - 60) continue;
        const b = blend(x); if (b < 0.4) continue;
        const th = KW * x + ph;
        const y1 = cy + dir * A0 * Math.sin(th), y2 = cy - dir * A0 * Math.sin(th);
        let col = BASE_COL[SEQ[n]], ra = (0.16 + 0.22 * Math.abs(Math.sin(th))) * ga * b;
        let mk = 0;
        if (dir < 0 && n === MUT_N && t > 131.0) mk = smooth(prog(t, 131.0, 131.5)) * (1 - 0.3 * smooth(prog(t, 133, 135)));
        if (mk > 0) { col = mix(col, C.rose, mk); ra += 0.6 * mk; glow(ctx, x, cy, 30 + 60 * mk * (1 + 0.4 * Math.sin(t * 6)), C.rose, 0.7 * mk * ga); }
        ctx.strokeStyle = rgba(col, ra); ctx.lineWidth = 2.2 + 1.6 * mk;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        if (mk > 0 && dir < 0) {
          text(ctx, `${SEQ[n]} → ${SEQ[n] === 'G' ? 'A' : 'G'}`, x, cy - A0 - 34, { size: 18, family: 'Mono', color: C.rose, alpha: 0.9 * mk * ga, spacing: 0.2 });
        }
      }
      ctx.restore();
    }
  }
  // —— 你的基因组：一条线 + 新字母 ——
  if (toGenome > 0) {
    const gray = smooth(prog(t, 144.0, 146.0)) * (1 - smooth(prog(t, 150.8, 151.2)));
    const col = mix(C.gold, C.dim, gray);
    const pts = []; for (let x = X0; x <= X1; x += 10) pts.push([x, 540 + (1 - gray) * 2 * Math.sin(x * 0.02 - t)]);
    glowLine(ctx, pts, col, toGenome * (1 - 0.45 * gray) * (1 - smooth(prog(t, 164.0, 165.6))), 1.6);
    // 新字母（突变）
    const retract = smooth(prog(t, 143.8, 145.0)) * (1 - smooth(prog(t, 150.9, 151.2)));
    const back = t >= 151 ? Math.exp(-(t - 151) * 2.2) : 0;
    let count = 0;
    for (const m of MUTS) {
      const on = smooth(prog(t, m.tIn, m.tIn + 0.25));
      if (on > 0.5) count++;
      const a = on * (1 - retract) * (1 - smooth(prog(t, 157.0, 159.0)));
      if (a <= 0.01) continue;
      const pop = Math.exp(-Math.max(0, t - m.tIn) * 4) + back;
      glow(ctx, m.x, 540, 9 + 20 * pop, C.rose, 0.9 * a);
      line(ctx, [[m.x, 528], [m.x, 552]], C.rose, 0.6 * a, 1);
    }
    UI.hud(ctx, vis(t, 135.8, 143.4, 0.6, 0.6), { label: '父母都没有的新字母', en: 'NEW LETTERS, YOURS ALONE', value: `${count} 个`, valueEn: 'DE NOVO MUTATIONS', valueColor: C.rose });
    const pa = vis(t, 145.0, 150.6, 0.8, 0.4);
    text(ctx, '第 一 页', X0, 506, { size: 18, weight: 300, alpha: 0.55 * pa, align: 'left', spacing: 0.3 });
    text(ctx, 'PAGE 1', X0, 584, { size: 12, family: 'Mono', alpha: 0.4 * pa, align: 'left', spacing: 0.4 });
    UI.hud(ctx, pa, { label: '变化', en: 'CHANGE', value: '0', valueEn: 'NOTHING NEW', valueColor: C.dim });

    // 错误长出：眼睛、翅膀、花
    BLOOM.forEach(([x, en, fn], i) => {
      const t0 = 151.2 + i * 0.5;
      const f = prog(t, t0, t0 + 3.2);
      if (f <= 0) return;
      const fadeOther = fn ? 1 - smooth(prog(t, 157.2, 159.0)) : 1;
      const stem = partial([[x, 540], [x, 508]], easeOut(prog(t, t0, t0 + 0.6)));
      line(ctx, stem, C.rose, 0.5 * fadeOther * (1 - smooth(prog(t, 157.2, 159))), 1);
      glow(ctx, x, 540, 26, C.rose, 0.8 * Math.exp(-(t - t0) * 1.5));
      const cy = 340;
      if (fn) drawShape(ctx, fn(x, cy), f, C.ivory, 0.9 * fadeOther, 1.3);
      else {
        const X = flowerXform(t);
        const fa = 1 - smooth(prog(t, 164.0, 166.0));
        drawShape(ctx, flowerShape(X.x, X.y, X.s), f, C.gold, 0.9 * fa, 1.3);
      }
      const la = smooth(prog(t, t0 + 1.2, t0 + 2.2)) * (1 - smooth(prog(t, 156.6, 158.0)));
      text(ctx, en, x, 500, { size: 12, family: 'Mono', alpha: 0.5 * la, spacing: 0.4 });
    });
    // 你
    const ya = vis(t, 157.6, 163.4, 0.8, 1.0);
    if (ya > 0) {
      S1.drawHead(ctx, 960, 540, t, ya, 0.8);
      text(ctx, '你', 960, 600, { size: 28, alpha: 0.85 * ya });
    }
  }
  // HUD
  UI.hud(ctx, vis(t, 110.2, 117.6, 0.6, 0.6), { label: '每个细胞里', en: 'IN EVERY CELL', value: '≈ 3,000,000,000 对', valueEn: 'BASE PAIRS  ·  ~2 m' });
  UI.hud(ctx, vis(t, 124.5, 134.8, 0.6, 0.6), { label: '抄错的概率', en: 'COPYING ERROR RATE', value: '≈ 1 / 1,000,000,000', valueEn: 'PER LETTER, PER COPY' });
  UI.hud(ctx, vis(t, 98.0, 109.8, 0.8, 0.6), { label: '生命的文字', en: 'THE TEXT OF LIFE', value: 'A · T · C · G', valueEn: 'FOUR LETTERS' });
}

module.exports = { start: 96, end: 166, draw, events, flowerShape, flowerXform };
