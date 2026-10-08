// 预副歌 2（90.2–104 秒）：献祭顺序
//  一张排序表：出了事，谁最先被推出去？按"会有人站出来保护他的概率"从低到高排。
//  "你"没有立场 → 支持你的人一个个归零 → 你在表里一路往上升，直到第一行，被红框框住。102.3 秒急停，画面冻住
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');

const T0 = A.beatT(208), TS = A.beatT(236), T1 = A.beatT(240);
const GROUPS = ['家人', '朋友', '老板', '同事', '网友', '陌生人', '对手', '旁观者'];
const ROWS = (() => {
  const r = mulberry32(44), out = [];
  for (let i = 0; i < 60; i++) {
    const sup = Math.floor(3 + Math.pow(r(), 1.6) * 420);
    out.push({ id: '#' + Math.floor(r() * 0xffff).toString(16).toUpperCase().padStart(4, '0'), g: GROUPS[Math.floor(r() * 8)], sup, p: 1 - Math.exp(-sup / 90) });
  }
  return out.sort((a, b) => a.p - b.p);
})();
const X0 = 330, X1 = 1590, Y0 = 300, RH = 54, VIS = 10;

function draw(ctx, t) {
  const on = smooth(prog(t, T0, T0 + 0.6));
  const frozen = t >= TS;
  const tt = Math.min(t, TS);
  // 你的支持者归零
  const mySup = Math.round(lerp(380, 0, easeInOut(prog(tt, T0 + 0.8, A.beatT(222)))));
  const myP = 1 - Math.exp(-mySup / 90);
  // 你在表里的连续名次
  let rank = ROWS.findIndex(r => r.p > myP); if (rank < 0) rank = ROWS.length;
  const lo = rank > 0 ? ROWS[rank - 1].p : 0, hi = rank < ROWS.length ? ROWS[rank].p : 1;
  const fr = rank + (hi > lo ? (myP - lo) / (hi - lo) : 0) - 1;  // 0 = 第一行
  const myRank = Math.max(0, fr);
  const scroll = Math.max(0, myRank - VIS + 3);                   // 表跟着你滚
  // 表头
  const cols = [['#', X0], ['ID', X0 + 90], ['身份', X0 + 280], ['支持者', X0 + 520], ['被保护的概率', X0 + 780]];
  cols.forEach(([s, x]) => text(ctx, s, x, Y0 - 30, { family: 'Song', size: 20, color: C.dim, alpha: on, align: 'left' }));
  UI.note(ctx, 'ORDER OF SACRIFICE · 出事时被推出去的顺序', X0, Y0 - 76, { alpha: 0.75 * on });
  ctx.strokeStyle = rgba(C.dim, 0.5 * on); ctx.beginPath(); ctx.moveTo(X0, Y0 - 16); ctx.lineTo(X1, Y0 - 16); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(X0 - 20, Y0 - 12, X1 - X0 + 40, RH * VIS + 4); ctx.clip();
  // 其他人（你插在 myRank 的位置，其他人让出一行）
  ROWS.forEach((r, i) => {
    const slot = i < myRank ? i : i + 1;
    const y = Y0 + (slot - scroll) * RH + 28 - (i >= Math.floor(myRank) ? 0 : 0);
    if (y < Y0 - 20 || y > Y0 + RH * VIS + 20) return;
    const a = on * (frozen ? 0.35 : 0.85);
    UI.note(ctx, String(slot + 1).padStart(2, '0'), X0, y, { size: 19, alpha: a });
    UI.note(ctx, r.id, X0 + 90, y, { size: 19, alpha: a, color: C.bone });
    text(ctx, r.g, X0 + 280, y + 2, { family: 'Song', size: 21, color: C.dim, alpha: a, align: 'left' });
    UI.note(ctx, String(r.sup), X0 + 520, y, { size: 19, alpha: a, color: C.bone });
    ctx.fillStyle = rgba(C.line, a); ctx.fillRect(X0 + 780, y - 10, 300, 8);
    ctx.fillStyle = rgba(C.dim, a); ctx.fillRect(X0 + 780, y - 10, 300 * r.p, 8);
    UI.note(ctx, (r.p * 100).toFixed(1) + '%', X0 + 1110, y, { size: 17, alpha: a });
  });
  // 你这一行
  const y = Y0 + (myRank - scroll) * RH + 28;
  const top = myRank < 0.05;
  ctx.fillStyle = rgba(top ? [60, 10, 14] : [40, 30, 14], 0.85 * on); ctx.fillRect(X0 - 16, y - 30, X1 - X0 + 32, RH - 2);
  UI.note(ctx, String(Math.round(myRank) + 1).padStart(2, '0'), X0, y, { size: 19, color: top ? C.red : C.gold, alpha: on });
  text(ctx, '你', X0 + 90, y + 2, { family: 'Song', size: 22, weight: 700, color: C.gold, alpha: on, align: 'left' });
  text(ctx, '无立场', X0 + 280, y + 2, { family: 'Song', size: 18, color: C.gold, alpha: on, align: 'left' });
  UI.note(ctx, String(mySup), X0 + 520, y, { size: 19, color: C.gold, alpha: on });
  ctx.fillStyle = rgba(C.line, on); ctx.fillRect(X0 + 780, y - 10, 300, 8);
  ctx.fillStyle = rgba(C.gold, on); ctx.fillRect(X0 + 780, y - 10, 300 * myP, 8);
  UI.note(ctx, (myP * 100).toFixed(1) + '%', X0 + 1110, y, { size: 17, alpha: on, color: C.gold });
  ctx.restore();
  // 到第一行：红框
  if (top) {
    const k = smooth(prog(t, A.beatT(222), A.beatT(223)));
    ctx.strokeStyle = rgba(C.red, k); ctx.lineWidth = 2; ctx.strokeRect(X0 - 20, y - 34, X1 - X0 + 40, RH + 6);
    glow(ctx, X0 - 20, y - 12, 60, C.red, 0.4 * k);
    UI.note(ctx, 'FIRST TO BE SACRIFICED · 第一个', X1 + 20, y, { color: C.red, alpha: k, align: 'right' });
  }
  if (frozen) { ctx.fillStyle = `rgba(0,0,0,${0.5 * smooth(prog(t, TS, TS + 0.2))})`; ctx.fillRect(0, 0, W, H); }

  // —— 文案 ——
  if (!frozen) {
    T.slam(ctx, t, '出了事，第一个献祭的。', { t0: A.beatT(213), y: 150, size: 56, hl: { '献祭': C.red }, out: A.beatT(224) - 0.2 });
    T.slam(ctx, t, '有了问题，第一个背锅的。', { t0: A.beatT(224), y: 150, size: 56, hl: { '背锅': C.red }, out: TS, en: 'First to be sacrificed. First to take the blame.' });
  }
  T.decode(ctx, t, '因为——', { t0: TS + 0.1, y: H / 2 + 20, size: 64, cps: 6 });
}
module.exports = { draw, t0: T0, t1: T1 };
