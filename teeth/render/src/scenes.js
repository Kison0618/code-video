// 各段画面：draw(ctx, t, S)
'use strict';
const K = require('./core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, easeOutExpo, vis, glow, glowLine, glowSegs, line, circlePts, text, mulberry32 } = K;
const A = require('./audio');
const V = require('./vis');
const FX = require('./fx');
const { CX, CY } = V;
const { beatT, BEAT } = A;
const bT = beatT;

// 喉咙隧道的前进速度、环形口的旋转，都按"速度的积分"算
function speed(t) {
  const n = A.section(t).name, h = A.hit(t, 6);
  if (n === 'verse2') return 0.18 + 1.0 * h;
  if (n === 'pre2') return lerp(0.3, 1.6, A.section(t).u);
  if (n === 'chorus2') return 1.0 + 3.0 * h;
  if (n === 'final') return 1.2 + 3.4 * h;
  return 0.12;
}
const TRAVEL = V.cumulative(speed);
const SPIN = V.cumulative(t => { const n = A.section(t).name; return (n === 'chorus' || n === 'final' || n === 'chorus2' ? 0.5 : 0.15) + 2.2 * A.hit(t, 5); });

// —— 咬合：每一下重击猛地合上，之后张开一半；重击停了才完全张开 ——
function jawOpen(t, wide = 0.95, half = 0.5) {
  const { k } = A.sinceBeat(t);
  let open = wide;
  for (let j = 0; j < 6; j++) {
    const kk = k - j; if (kk < 0 || !A.isHit(kk)) continue;
    const age = t - bT(kk);
    const o = age < BEAT ? half * easeOut(age / (BEAT * 0.75)) : lerp(half, wide, smooth((age - BEAT) / (BEAT * 2.2)));
    open = Math.min(open, o);
  }
  // 一组重击开始前的那一拍：嘴张到最大，蓄力
  if (A.cyclePos(t) === 0 && !A.isHit(k)) open = Math.max(open, lerp(open, 1.08, smooth((t - bT(k)) / BEAT)));
  return open;
}
// 最近几下重击的裂纹（位置沿咬合线随机）
function biteCracks(ctx, t, o = {}) {
  const { n = 4, a = 1, len = 520, y = CY, arms = 3 } = o;
  const { k } = A.sinceBeat(t);
  for (let j = 0; j < 10 && j < n * 3; j++) {
    const kk = k - j; if (kk < 0 || !A.isHit(kk)) continue;
    const r = mulberry32(kk * 13 + 5);
    V.crack(ctx, t - bT(kk), kk, CX + (r() - 0.5) * W * 0.8, y + (r() - 0.5) * 40, { len: len * (0.7 + 0.6 * A.hitAt(kk)), a: a * A.hitAt(kk), arms });
  }
}
// 漂浮的尘埃
const DUST = (() => { const r = mulberry32(2); return Array.from({ length: 260 }, () => ({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 12, vy: -4 - r() * 10, s: 0.6 + r() * 1.8, ph: r() * 6.28 })); })();
function dust(ctx, t, a, col = C.bone) {
  if (a <= 0) return;
  ctx.save();
  for (const d of DUST) {
    const x = ((d.x + d.vx * t) % W + W) % W, y = ((d.y + d.vy * t) % H + H) % H;
    ctx.fillStyle = rgba(col, a * (0.25 + 0.25 * Math.sin(t * 1.3 + d.ph)));
    ctx.beginPath(); ctx.arc(x, y, d.s, 0, 6.283); ctx.fill();
  }
  ctx.restore();
}

// ———————— 前奏：闭着的嘴 ————————
function intro(ctx, t, S) {
  const h = A.hit(t, 7), sub = A.env('sub', t);
  glow(ctx, CX, CY, 900, C.blood, 0.08 + 0.12 * sub + 0.15 * h);
  // 咬紧的一排小牙：每咬一下多长出一颗
  const nB = A.bitesAt(t), shown = Math.min(30, nB);
  const teeth = [];
  for (let i = 0; i < shown; i++) {
    const x = CX + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 54;
    teeth.push(V.toothPts(x - 13, CY - 30, 50, 46, Math.PI / 2, 0.05));
    teeth.push(V.toothPts(x + 14, CY + 30, 48, 44, -Math.PI / 2, 0.05));
  }
  V.drawTeeth(ctx, teeth, { a: 0.85 + 0.15 * h, edgeA: 0.5 + 0.5 * h });
  // 咬合缝
  const seam = []; for (let x = 120; x <= W - 120; x += 12) seam.push([x, CY + Math.sin(x * 0.02 + t) * 1.5 * h]);
  glowLine(ctx, seam, C.blood, 0.35 + 0.65 * h, 1.4, 1.5);
  biteCracks(ctx, t, { n: 2, len: 260, arms: 2, a: 0.8 });
  dust(ctx, t, 0.6);
  // 片名：第一下重击砸下，之后每一下都抖一下
  const firstHit = bT(1);
  V.title(ctx, t, firstHit, { size: 210, y: CY + 300, a: 0.95 * (1 - smooth(prog(t, bT(14), bT(18)))), life: 99 });
  if (S.beat > 36) V.title(ctx, t, bT(40), { size: 120, y: CY - 230, a: 0.6 * (1 - smooth(prog(t, bT(46), bT(48)))), life: 99 });
}

// ———————— 主歌：环形的口张开 ————————
function verse(ctx, t, S) {
  const h = A.hit(t, 6);
  const open = easeOutExpo(prog(S.beat, 0, 4));
  if (open < 1) { const seam = []; for (let x = 120; x <= W - 120; x += 12) seam.push([x, CY]); glowLine(ctx, seam, C.blood, 1 - open, 1.4, 1.5); }
  V.maw(ctx, t, { R: 430, rings: 3, spin: SPIN(t), bite: h, open, edge: mix(C.steel, C.blood, 0.25 + 0.5 * h), a: 1 });
  biteCracks(ctx, t, { n: 2, len: 300, y: CY + 360, arms: 2, a: 0.6 });
  dust(ctx, t, 0.7, C.ice);
}
// ———————— 预副歌：上下颚逼近，血管爬进来，最后急停 ————————
function pre(ctx, t, S, stopBeat) {
  const u = S.u;
  const stop = A.beatF(t) >= stopBeat && A.beatF(t) < stopBeat + 2;
  const rise = smooth(prog(A.beatF(t), stopBeat + 2, stopBeat + 4));
  const dim = stop ? 0.12 : 1;
  const mid = A.env('mid', t);
  V.maw(ctx, t, { R: 430, rings: 3, spin: SPIN(t) * (1 + u), bite: 0.2 * mid, edge: mix(C.steel, C.blood, u), a: dim });
  V.jaws(ctx, t, lerp(1.5, 0.78, easeInOut(u)) - 0.04 * mid, { a: stop ? 0.4 : 1, edge: C.blood });
  V.veins(ctx, lerp(0, 1.25, u), stop ? 0.3 : 0.9);
  dust(ctx, t, 0.5 * dim, C.ice);
  if (rise > 0) glow(ctx, CX, CY, 1100 * rise, C.blood, 0.6 * rise);
}

// ———————— 副歌：咬 ————————
function chorus(ctx, t, S, o = {}) {
  const { titleBeats = [], tunnel = false } = o;
  const h = A.hit(t, 7);
  if (tunnel) V.throat(ctx, t, TRAVEL(t), { a: 0.9, edge: C.blood });
  else V.maw(ctx, t, { R: 470, rings: 4, spin: SPIN(t), bite: h, edge: C.blood, a: 1 });
  biteCracks(ctx, t, { n: 4, len: 620, arms: 3 });
  const open = jawOpen(t, 0.72, 0.42);
  V.jaws(ctx, t, open, { edge: mix(C.blood, C.ember, h) });
  V.sparks(ctx, t, { y: CY, a: 0.9 });
  for (const b of titleBeats) V.title(ctx, t, bT(b), { size: 240, y: CY + 90, a: 1, life: BEAT * 3.2 });
}

// ———————— 断开：张开，低频涌起 ————————
function brk(ctx, t, S) {
  const sub = A.env('sub', t);
  glow(ctx, CX, CY, 1300, C.blood, 0.25 + 0.5 * sub);
  V.maw(ctx, t, { R: 470, rings: 4, spin: SPIN(t), bite: 0, edge: C.blood, a: 0.6 });
  V.jaws(ctx, t, lerp(0.95, 1.6, easeIn(S.u)), { edge: C.blood });
  V.crack(ctx, t - S.t0, 9001, CX, CY, { len: 1100, life: BEAT * 8, arms: 4 });
}

// ———————— 主歌 2：进入喉咙 ————————
function verse2(ctx, t, S) {
  V.throat(ctx, t, TRAVEL(t), { a: 1, edge: mix(C.steel, C.blood, 0.3 + 0.5 * A.hit(t, 6)) });
  dust(ctx, t, 0.6, C.ice);
  biteCracks(ctx, t, { n: 2, len: 280, y: CY, arms: 2, a: 0.5 });
}
function pre2(ctx, t, S) {
  const stop = A.beatF(t) >= 236 && A.beatF(t) < 238;
  const rise = smooth(prog(A.beatF(t), 238, 240));
  V.throat(ctx, t, TRAVEL(t), { a: stop ? 0.15 : 1, edge: mix(C.steel, C.blood, S.u) });
  V.jaws(ctx, t, lerp(1.5, 0.78, easeInOut(S.u)), { a: stop ? 0.4 : 1 });
  V.veins(ctx, lerp(0, 1.25, S.u), stop ? 0.3 : 0.9);
  if (rise > 0) glow(ctx, CX, CY, 1100 * rise, C.blood, 0.6 * rise);
}

// ———————— 桥段：玻璃碎裂 ————————
function bridge(ctx, t, S) {
  const b = A.beatF(t);
  const cut = (b >= 338 && b < 342) || (b >= 346 && b < 350);
  if (cut) {
    // 掐断：一片黑，只剩一颗牙的轮廓随拍闪
    const p = A.pulse(t, 4);
    V.drawTeeth(ctx, [V.toothPts(CX, CY - 90, 120, 200, Math.PI / 2, 0.1)], { a: 0.15 + 0.5 * p, fill: [20, 8, 10], edge: C.blood, edgeA: 1 });
    return;
  }
  if (b < 338) {
    // 冻结的咬合画面上裂开蛛网，碎片缓缓剥落
    V.jaws(ctx, t, 0.02, { a: 0.55 * (1 - smooth(prog(b, 328, 338))), edge: C.wine });
    V.glass(ctx, t, easeOutExpo(prog(t, bT(304), bT(306))), Math.max(0, t - bT(312)), 1, 0);
    if (b < 306) glow(ctx, CX, CY, 400, C.white, 0.5 * (1 - (b - 304) / 2));
    dust(ctx, t, 0.5, C.ice);
  } else if (b < 352) {
    // 两次掐断之后的重击：整面玻璃重新裂开，碎片向外炸飞（第二次更猛）
    const t0 = b < 346 ? bT(342) : bT(350), mult = b < 346 ? 1 : 1.8, age = t - t0;
    V.glass(ctx, t, 1, 0, 1, easeOutExpo(age / 0.9) * mult);
    glow(ctx, CX, CY, 900, C.blood, 0.7 * Math.exp(-age * 2));
    glow(ctx, CX, CY, 300, C.white, 0.8 * Math.exp(-age * 5));
    V.crack(ctx, age, Math.round(t0 * 10), CX, CY, { len: 900, arms: 5, life: 2 });
  } else {
    // 352–368：口重新长出来，越转越快
    const u = prog(b, 352, 368);
    V.maw(ctx, t, { R: 470, rings: 4, spin: SPIN(t) * (1 + 2 * u), bite: A.hit(t, 6), open: easeOut(u * 1.5), edge: C.blood });
    V.jaws(ctx, t, lerp(1.5, 0.8, u), {});
    V.veins(ctx, lerp(0.3, 1.25, u), 0.9);
    biteCracks(ctx, t, { n: 3, len: 420 });
  }
}

// ———————— 最后的副歌：全部叠加 ————————
function finalScene(ctx, t, S) {
  const b = A.beatF(t);
  V.throat(ctx, t, TRAVEL(t), { a: 0.8, edge: C.blood });
  V.maw(ctx, t, { R: 380, rings: 3, spin: SPIN(t) * 1.4, bite: A.hit(t, 7), edge: C.ember, a: 0.9 });
  biteCracks(ctx, t, { n: 5, len: 720, arms: 4 });
  V.jaws(ctx, t, jawOpen(t, 1.0, 0.45), { edge: mix(C.blood, C.ember, A.hit(t, 7)) });
  V.sparks(ctx, t, { y: CY, a: 1, n: 100 });
  for (const tb of [369, 401, 433]) V.title(ctx, t, bT(tb), { size: 250, y: CY + 90, life: BEAT * 3.2 });
  // 最后一组：最后一下咬死
  if (b >= 460) glow(ctx, CX, CY, 1400 * smooth(prog(b, 460, 464)), C.blood, 0.5);
}
function outro(ctx, t, S) {
  const age = t - S.t0;
  V.jaws(ctx, t, 0.0, { a: Math.exp(-age * 1.2) });
  glow(ctx, CX, CY, 600, C.blood, 0.25 * Math.exp(-age * 0.6));
  V.title(ctx, t, S.t0 + 0.6, { size: 120, y: CY + 260, a: 0.8 * (1 - smooth(prog(age, 3.2, 4.2))), life: 99 });
}

const DRAW = {
  intro, verse, pre: (c, t, S) => pre(c, t, S, 108), chorus: (c, t, S) => chorus(c, t, S, { titleBeats: [113, 145] }),
  break: brk, verse2, pre2, chorus2: (c, t, S) => chorus(c, t, S, { titleBeats: [241, 273], tunnel: true }), bridge, final: finalScene, outro,
};
module.exports = { DRAW, jawOpen };
