// 桥段（131.6–159.2 秒）：筛
//  一面网筛横在画面中间。人像雨一样落下来，大多数穿过网眼掉出画面，只有少数（金色的）被留在筛子上。
//  两次掐断：画面冻住、变暗，只出现一个字——「筛」「选」。掐断结束：留下来的人一起亮起来
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, glow, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');

const T0 = A.beatT(304), C1 = A.beatT(338), C1e = A.beatT(342), C2 = A.beatT(346), C2e = A.beatT(350), T1 = A.beatT(368);
const RAIN0 = A.beatT(306);
// 网筛：一个有透视的平面
const FY = 760, BY = 520, FX0 = 40, FX1 = 1880, BX0 = 500, BX1 = 1420;
const plane = (u, d) => [lerp(lerp(FX0, BX0, d), lerp(FX1, BX1, d), u), lerp(FY, BY, d)];
const DROPS = (() => {
  const r = mulberry32(12), out = [];
  for (let i = 0; i < 2600; i++) {
    const keep = r() < 0.14;
    out.push({ u: r(), d: r(), ts: RAIN0 + Math.pow(r(), 0.9) * 13, keep, v: 0.8 + r() * 0.5, jit: (r() - 0.5), sz: 2 + r() * 2 });
  }
  return out;
})();
// 物理时间：掐断时停住
function phys(t) {
  let e = t;
  if (t > C1) e -= Math.min(t, C1e) - C1;
  if (t > C2) e -= Math.min(t, C2e) - C2;
  return e;
}
const cut = t => (t >= C1 && t < C1e) || (t >= C2 && t < C2e);

function draw(ctx, t) {
  const on = smooth(prog(t, T0, T0 + 1));
  const te = phys(t);
  const lit = smooth(prog(t, C2e, C2e + 1.2));
  // 网筛
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(mix([120, 130, 150], C.gold, 0.6 * lit), (0.4 + 0.3 * lit) * on); ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) { const a = plane(i / 64, 0), b = plane(i / 64, 1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  for (let j = 0; j <= 16; j++) { const a = plane(0, j / 16), b = plane(1, j / 16); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  ctx.restore();
  UI.note(ctx, 'FILTER · 筛', FX0, FY + 40, { alpha: 0.6 * on });
  // 雨
  let kept = 0, fell = 0;
  const pass = [], stay = [];
  for (const p of DROPS) {
    const age = te - (p.ts - (p.ts > C1 ? 0 : 0));
    const a0 = te - phys(p.ts);
    if (a0 < 0) continue;
    const [lx, ly] = plane(p.u, p.d);
    const y = -40 + 300 * a0 * p.v + 520 * a0 * a0 * p.v;
    const x = lx + p.jit * 30 * (1 - clamp(y / ly));
    if (y < ly) { (p.keep ? stay : pass).push(x, y, p.sz, 1); continue; }
    if (p.keep) { kept++; const sett = clamp((y - ly) / 200); stay.push(lx + p.jit * 4, ly - 2 - 3 * Math.abs(Math.sin((y - ly) * 0.05)) * (1 - sett), p.sz + 0.6, 1); }
    else { fell++; const yy = ly + (y - ly) * 1.15; if (yy < H + 20) pass.push(x + p.jit * 20, yy, p.sz, clamp(1 - (yy - ly) / 380)); }
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba([165, 175, 200], 0.75 * on); ctx.beginPath();
  for (let i = 0; i < pass.length; i += 4) if (pass[i + 3] > 0.05) ctx.rect(pass[i] - pass[i + 2] / 2, pass[i + 1] - pass[i + 2] * 6, pass[i + 2] * 0.8, pass[i + 2] * 7 * pass[i + 3]);
  ctx.fill();
  ctx.fillStyle = rgba(mix([200, 190, 160], C.gold, 0.5 + 0.5 * lit), 0.95 * on); ctx.beginPath();
  for (let i = 0; i < stay.length; i += 4) ctx.rect(stay[i] - stay[i + 2] / 2, stay[i + 1] - stay[i + 2] / 2, stay[i + 2], stay[i + 2]);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < stay.length; i += 8) glow(ctx, stay[i], stay[i + 1], 14 + 14 * lit, C.gold, 0.18 + 0.3 * lit);
  // 计数
  const ca = smooth(prog(t, RAIN0 + 1, RAIN0 + 2)) * on;
  UI.note(ctx, 'PASSED THROUGH · 穿过', W - 120, 300, { align: 'right', alpha: ca });
  text(ctx, String(fell), W - 120, 344, { family: 'Mono', size: 34, color: C.dim, alpha: ca, align: 'right' });
  UI.note(ctx, 'STAYED · 留下', W - 120, 400, { align: 'right', alpha: ca, color: C.gold });
  text(ctx, String(kept), W - 120, 444, { family: 'Mono', size: 34, color: C.gold, alpha: ca, align: 'right' });
  // 掐断：冻住、变暗，一个字
  if (cut(t)) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); }
  T.glitch(ctx, t, '筛', { t0: C1 + 0.05, y: H / 2 + 90, size: 300, color: C.bone, out: C1e - 0.25, settle: 0.6 });
  T.glitch(ctx, t, '选', { t0: C2 + 0.05, y: H / 2 + 90, size: 300, color: C.gold, out: C2e - 0.25, settle: 0.6 });

  // —— 文案 ——
  if (!cut(t)) {
    T.decode(ctx, t, '做你最舒服的，', { t0: T0 + 0.4, y: 150, size: 48, cps: 10, out: A.beatT(332) });
    T.decode(ctx, t, '效率最高的。', { t0: T0 + 2.6, y: 230, size: 48, cps: 10, out: A.beatT(332) });
    T.slam(ctx, t, '筛选那群喜欢你的。', { t0: C2e, y: 200, size: 72, hl: { '喜欢你的': C.gold }, out: T1 - 0.2, en: 'Filter for the ones who like you.' });
  }
}
module.exports = { draw, t0: T0, t1: T1 };
