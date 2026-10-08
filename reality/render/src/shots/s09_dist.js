// 9 · 副歌 2（全片核心）：人群对你的感受画成分布。你没有立场时，所有人都挤在正中"无感"那一根柱子上；
// 你表明立场，分布从中间裂成两座山：左边暗红（恨你的），右边金色（爱你的）。"爱你的人"从 0 滚上去
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow } = K;
const A = require('../audio');
const U = require('../ui');
const { PEOPLE } = require('../pop');

const T0 = A.beatT(240), TS = A.beatT(256), T1 = A.beatT(304);
const BOX = [260, 260, 1660, 760], NB = 61;

function draw(ctx, t) {
  const split = easeInOut(prog(t, TS, TS + 6));
  const ax = smooth(prog(t, T0, T0 + 1));
  // 每个人当前的感受值：从"无感"移向自己真正的感受
  const bins = new Float32Array(NB), lv = new Float32Array(NB), hv = new Float32Array(NB);
  let love = 0, hate = 0;
  for (const p of PEOPLE) {
    const v = lerp(p.calm, p.felt, clamp(split * 1.2 - p.ord * 0.2));
    const b = clamp(Math.round((v + 1) / 2 * (NB - 1)), 0, NB - 1);
    bins[b]++;
    if (v > 0.3) love++; else if (v < -0.3) hate++;
  }
  const maxB = 260;
  U.axes(ctx, BOX, ax, { nx: 12, ny: 4 });
  // 中线
  ctx.strokeStyle = rgba(C.dim, 0.4 * ax); ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(W / 2 - 0, BOX[1]); ctx.lineTo(W / 2, BOX[3]); ctx.stroke(); ctx.setLineDash([]);
  // 柱子
  const bw = (BOX[2] - BOX[0]) / NB;
  for (let i = 0; i < NB; i++) {
    const v = i / (NB - 1) * 2 - 1, h = Math.min(1, bins[i] / maxB) * (BOX[3] - BOX[1]) * ax;
    const col = v < -0.25 ? C.red : v > 0.25 ? C.gold : C.dim;
    const x = BOX[0] + i * bw;
    ctx.fillStyle = rgba(col, v < -0.25 || v > 0.25 ? 0.85 : 0.6);
    ctx.fillRect(x + 2, BOX[3] - h, bw - 4, h);
    if (bins[i] > maxB) U.note(ctx, '▲ ' + bins[i], x + bw / 2, BOX[1] - 10, { align: 'center', size: 12 });
  }
  // "没有立场时"的那根柱子：分开之后留一个虚线的影子作对比
  if (split > 0.3) {
    const x = BOX[0] + Math.floor(NB / 2) * bw;
    ctx.strokeStyle = rgba(C.dim, 0.5 * smooth((split - 0.3) / 0.4)); ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 2, BOX[1], bw - 4, BOX[3] - BOX[1]); ctx.setLineDash([]);
    U.note(ctx, '没有立场时', x + bw / 2, BOX[1] - 30, { align: 'center', alpha: 0.7 * split });
  }
  U.note(ctx, '← 恨你  HATE', BOX[0], BOX[3] + 40, { color: C.red, alpha: ax });
  U.note(ctx, '无感  0', W / 2, BOX[3] + 40, { align: 'center', alpha: ax });
  U.note(ctx, 'LOVE  爱你 →', BOX[2], BOX[3] + 40, { align: 'right', color: C.gold, alpha: ax });
  // 计数
  K.text(ctx, String(hate), BOX[0] + 160, BOX[1] + 40, { family: 'Mono', size: 34, color: C.red, alpha: ax });
  U.note(ctx, '恨你的人', BOX[0] + 160, BOX[1] + 66, { align: 'center', alpha: ax });
  K.text(ctx, String(love), BOX[2] - 160, BOX[1] + 40, { family: 'Mono', size: 34, color: C.gold, alpha: ax });
  U.note(ctx, '爱你的人', BOX[2] - 160, BOX[1] + 66, { align: 'center', alpha: ax });
  // 文案：前半句在分裂前，后半句在分裂后
  U.caption(ctx, t, '谁都不恨你，', { t0: T0 + 1.5, y: 140, size: 50, cps: 8, hl: { '恨': C.red } });
  U.caption(ctx, t, '那就必然谁都不爱你。', { t0: TS - 2.5, y: 920, size: 50, cps: 8, hl: { '爱': C.gold }, en: 'If no one hates you, no one loves you.' });
}
module.exports = { draw, t0: T0, t1: T1 };
