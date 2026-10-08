// 3 · 预副歌（没有鼓）：散点图。横轴"牵涉的利益"，纵轴"滋生的恶意"。点一个个落下，拟合出一条指数曲线。
// 108 拍急停：画面冻住，只剩曲线最右端的那个点和一个红色的"恶"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, glow, glowLine, mulberry32 } = K;
const A = require('../audio');
const U = require('../ui');
const { gauss } = require('../pop');

const T0 = A.beatT(80), TSTOP = A.beatT(108), T1 = A.beatT(112);
const BOX = [300, 230, 1620, 820];
const f = x => 0.04 * (Math.exp(3.1 * x) - 1);                       // 恶意 ∝ e^(k·利益)
const PTS = (() => { const r = mulberry32(8), out = []; for (let i = 0; i < 260; i++) { const x = Math.pow(r(), 0.85); out.push({ x, y: clamp(f(x) * (1 + gauss(r) * 0.22) + gauss(r) * 0.02, 0, 1.05), t: T0 + 1 + (i / 260) * (TSTOP - T0 - 3.5) * (0.7 + 0.3 * r()) }); } return out; })();
const MAP = (x, y) => [lerp(BOX[0], BOX[2], x), lerp(BOX[3], BOX[1], y)];

function draw(ctx, t) {
  const frozen = t >= TSTOP;
  const tt = Math.min(t, TSTOP);
  const dim = frozen ? 1 - 0.8 * smooth(prog(t, TSTOP, TSTOP + 0.25)) : 1;
  const ax = smooth(prog(t, T0, T0 + 1.2));
  ctx.save(); ctx.globalAlpha = dim;
  U.axes(ctx, BOX, ax, { nx: 10, ny: 5 });
  U.note(ctx, '牵涉的利益  INTEREST AT STAKE →', BOX[2], BOX[3] + 40, { align: 'right', alpha: 0.75 * ax });
  U.note(ctx, '↑ 滋生的恶意  MALICE', BOX[0], BOX[1] - 22, { alpha: 0.75 * ax });
  for (let i = 0; i <= 10; i++) U.note(ctx, String(i * 10), lerp(BOX[0], BOX[2], i / 10), BOX[3] + 22, { align: 'center', alpha: 0.4 * ax, size: 11 });
  // 散点：落下时有一个小小的"着陆"
  let n = 0;
  for (const p of PTS) {
    if (p.t > tt) continue; n++;
    const age = tt - p.t, [x, y] = MAP(p.x, p.y);
    const hot = clamp((p.y - 0.25) / 0.6);
    const col = mix(C.dim, C.red, hot);
    ctx.fillStyle = rgba(col, 0.85);
    ctx.beginPath(); ctx.arc(x, y - 30 * Math.exp(-age * 9), 2.6 + 1.5 * hot, 0, 6.2832); ctx.fill();
    if (age < 0.4) glow(ctx, x, y, 20, col, 0.5 * (1 - age / 0.4));
  }
  U.note(ctx, `n = ${n}`, BOX[2], BOX[1] - 22, { align: 'right', alpha: 0.7 * ax });
  // 拟合曲线：样本够了才画出来
  const fit = smooth(prog(tt, T0 + 5, TSTOP - 1));
  if (fit > 0) {
    const pts = [];
    for (let i = 0; i <= 120 * fit; i++) { const x = i / 120; if (f(x) > 1.05) break; pts.push(MAP(x, f(x))); }
    glowLine(ctx, pts, C.red, 0.9, 2.2, 1.2);
    U.note(ctx, 'malice ∝ e^(k · interest)', MAP(0.62, 0.6)[0], MAP(0.62, 0.6)[1], { color: C.red, alpha: 0.85 * fit, size: 15 });
  }
  ctx.restore();
  // 急停之后：曲线最右端那一点，一个红色的"恶"
  if (frozen) {
    const [x, y] = MAP(0.985, f(0.985));
    const a = smooth(prog(t, TSTOP + 0.15, TSTOP + 0.6));
    glow(ctx, x, y, 90, C.red, 0.5 * a);
    ctx.fillStyle = rgba(C.red, a); ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill();
    K.text(ctx, '恶', W / 2, H / 2 + 60, { family: 'Song', size: 220, weight: 700, color: C.red, alpha: 0.9 * a });
  }
  // 文案
  if (!frozen) U.caption(ctx, t, '不要低估一个人维护自己利益时，', { t0: T0 + 2, y: 120, size: 42, cps: 12 });
  if (!frozen) U.caption(ctx, t, '能滋生出来的恶。', { t0: T0 + 5.2, y: 176, size: 42, cps: 10, hl: { '恶': C.red }, en: 'Never underestimate the evil a person grows while guarding their own interests.' });
}
module.exports = { draw, t0: T0, t1: T1 };
