// 定律 05 · 社会比较（1954，费斯廷格）  58.54–67.04 秒
//  左：你的能力（金线）一直在涨；你的"参照系"（青线）涨得更快——从同桌、同学、同事，一路换成全网最好的 0.1%。
//  两条线之间的差被涂成红色。右：满意度 = 现实 − 期待，一路往下掉
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, glowLine, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(110), T1 = B(126);
const X0 = 180, X1 = 1140, Y0 = 330, Y1 = 780;
const TA = T0 + 0.5, TB = T0 + 6.6;
const youV = u => 18 + 34 * u + 2.5 * noise1(u * 14, 3);                      // 稳稳往上
const refV = u => 22 + 74 * Math.pow(u, 2.2);                                // 越来越快
const REFS = [[0, '同桌'], [0.25, '同学'], [0.45, '同事'], [0.62, '博主'], [0.8, '全网 0.1%']];
const yOf = v => lerp(Y1, Y0, v / 100);

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1954, prev: 1973, who: 'L. 费斯廷格 · 明尼苏达大学', no: '05', law: '社会比较', en: 'Social Comparison Theory', paper: 'A Theory of Social Comparison Processes', paperCn: '《社会比较过程理论》' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  UI.axes(ctx, [X0, Y0, X1, Y1], a, { nx: 6, ny: 5 });
  ['2015', '2016', '2017', '2018', '2019', '2020'].forEach((y, i) => UI.note(ctx, y, lerp(X0, X1, i / 5), Y1 + 36, { size: 20, alpha: a, align: 'center' }));
  const up = prog(t, TA, TB);
  const P = (f) => { const o = []; for (let i = 0; i <= 200; i++) { const u = i / 200 * up; o.push([lerp(X0, X1, u), yOf(f(u))]); } return o; };
  const py = P(youV), pr = P(refV);
  // 差距：红色区域
  ctx.save(); ctx.beginPath();
  py.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  for (let i = pr.length - 1; i >= 0; i--) ctx.lineTo(pr[i][0], Math.min(pr[i][1], py[i][1]));
  ctx.closePath(); ctx.fillStyle = rgba(C.red, 0.28 * a); ctx.fill(); ctx.restore();
  glowLine(ctx, pr, C.cyan, a, 2);
  glowLine(ctx, py, C.gold, a, 2.6);
  const ey = py[py.length - 1], er = pr[pr.length - 1];
  glow(ctx, ey[0], ey[1], 30, C.gold, a); glow(ctx, er[0], er[1], 30, C.cyan, a);
  text(ctx, '你的能力', ey[0] + 16, ey[1] + 10, { family: 'Song', size: 26, weight: 700, color: C.gold, alpha: a, align: 'left' });
  const ref = REFS.filter(r => r[0] <= up).pop()[1];
  text(ctx, '你比较的对象：' + ref, er[0] - 14, er[1] - 22, { family: 'Song', size: 26, weight: 700, color: C.cyan, alpha: a, align: 'right' });
  // 公式与满意度
  const RX = 1420;
  const fa = smooth(prog(t, T0 + 0.8, T0 + 1.2)) * a;
  text(ctx, '满意度 = 现实 − 期待', RX, 380, { family: 'Song', size: 34, color: C.bone, alpha: fa, align: 'left' });
  const sat = clamp(0.55 + (youV(up) - refV(up)) / 70, 0.02, 1);
  UI.note(ctx, 'SATISFACTION', RX, 470, { size: 20, alpha: fa });
  text(ctx, Math.round(sat * 100) + '%', RX, 580, { family: 'Mono', size: 96, color: mix(C.red, C.gold, sat), alpha: fa, align: 'left' });
  ctx.fillStyle = rgba(C.line, fa); ctx.fillRect(RX, 620, 360, 10);
  ctx.fillStyle = rgba(mix(C.red, C.gold, sat), fa); ctx.fillRect(RX, 620, 360 * sat, 10);
  UI.note(ctx, '你的能力：+' + Math.round(youV(up) - youV(0)), RX, 690, { size: 22, color: C.gold, alpha: fa });
  UI.note(ctx, '你的期待：+' + Math.round(refV(up) - refV(0)), RX, 730, { size: 22, color: C.cyan, alpha: fa });

  T.seq(ctx, t, [
    { t: B(110.6), s: '幸福感，来自比较。', hl: { '比较': C.gold }, en: 'Happiness is a comparison.' },
    { t: B(113), s: '以前比的，是身边的人；', en: 'We used to compare with the people around us;' },
    { t: B(115.6), s: '现在比的，是全网最好的 0.1%。', hl: { '0.1%': C.cyan }, en: 'now, with the top 0.1% of the internet.' },
    { t: B(118.6), s: '你明明在进步——', hl: { '进步': C.gold } },
    { t: B(121), s: '却觉得自己是个废物。', fx: 'slam', size: 72, hl: { '废物': C.red }, en: 'You are getting better — and feel worthless.' },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
