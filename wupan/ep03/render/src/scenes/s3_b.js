'use strict';
// 005–009 为什么会这样：章节卡 → 跟着队伍走大多是对的 → 陌生城市挑人多的馆子 → 格格不入的压力 → 两个触发条件。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, over, crowdAt, gaze, bigPaper } = U;
const { smooth, prog, lerp, clamp } = K;
const CUT = require('../cutout');

// —— 005：章节卡（芒格 + 「社会认同倾向」）→ “拿不准”时卡片退到左上，右边是街口：“你”站在人群边上，头顶问号；“照着周围的人”时人群往前走，他也转身跟上 ——
let MUNGER = null;
function munger(c, x, y, h) { if (!MUNGER) MUNGER = CUT.get('eng_munger'); CUT.place(c, MUNGER, x, y, h); }
function s05(c, t) {
  const side = smooth(prog(t, at('005', '拿不准') - 0.5, at('005', '拿不准') + 0.3));
  if (side > 0.01) {
    c.save(); c.globalAlpha *= side;
    Q.sheet(c, 'E32', 1210, 560, 1300, 820, { seed: 755, label: '当代街景' });
    const go = smooth(prog(t, at('005', '照着周围的人'), at('005', '去做') + 0.5));
    for (let k = 0; k < 3; k++) fig(c, crowdAt(k), 1180 + k * 200 + go * 140, 940, 400);
    const turn = t >= at('005', '去想');
    you(c, turn ? 'E02' : 'E01', 960 + go * 110, 950, 440);
    if (!turn) over(c, 'E01', 960, 950, 440, '？', pop(t, at('005', '拿不准')), { dy: 112, size: 60, seed: 753 });
    c.restore();
  }
  c.save(); c.translate(lerp(0, -470, side), lerp(0, -170, side)); const s = lerp(1, 0.55, side); c.translate(700, 560); c.scale(s, s); c.translate(-700, -560);
  munger(c, 520, 900, 620);
  bigPaper(c, 1100, 470, 760, 210, '社会认同倾向', 108, pop(t, at('005', '社会认同') - 0.2, 0.7), { seed: 751 });
  c.restore();
}
// —— 006：真实街景，一条队伍沿人行道往右走，“你”跟在后面；“大多数时候”纸签，“是对的”盖章 ——
function s06(c, t) {
  push(c, t, L('006').t0, L('006').t1, 0.03, 960, 560, () => {
    Q.sheet(c, 'E32', 960, 500, 1760, 900, { seed: 763, label: '当代街景' });
    const walk = (t - L('006').t0) * 22;
    for (let k = 0; k < 5; k++) fig(c, crowdAt(k), 1560 - k * 190 + walk, 965, 430);
    you(c, 'E02', 1560 - 5 * 190 + walk, 970, 440);
  });
  Q.tag(c, 960, 150, '大多数时候', pop(t, at('006', '大多数时候')), { size: 66, seed: 761 });
  X.stamp(c, 1460, 330, '对', prog(t, at('006', '是对的'), at('006', '是对的') + 0.8), { size: 110, color: Q.RUST, seed: 762 });
}
// —— 007：陌生城市的街，两家馆子，左边人多 ——
function s07(c, t) {
  push(c, t, L('007').t0, L('007').t1, 0.035, 700, 500, () => {
    Q.sheet(c, 'E12', 960, 480, 1720, 880, { seed: 771, label: '陌生城市 · 两家馆子' });
    Q.ring(c, 600, 560, 360, 300, prog(t, at('007', '人多的馆子'), at('007', '人多的馆子') + 0.9), 'rgba(244,198,61,0.85)', 16);
  });
  Q.tag(c, 1560, 140, '陌生的城市', pop(t, L('007').t0 + 0.1), { size: 58, seed: 772 });
  X.stamp(c, 1400, 520, '不踩雷', prog(t, at('007', '不会踩雷'), at('007', '不会踩雷') + 0.8), { size: 84, color: Q.RUST, seed: 773 });
  Q.tag(c, 620, 170, '别人替你试过了', pop(t, at('007', '替你试过了')), { size: 60, hl: true, seed: 774 });
}
// —— 008：人群围成半圈，所有目光投向中间那个人；“压力”时视线变红加粗 ——
const EYES = [[0.08, 0.17], [0.20, 0.19], [0.31, 0.24], [0.70, 0.24], [0.81, 0.28], [0.93, 0.24]];   // 按新 E13 量的人头位置（卡片内比例）
const MID = [0.5, 0.45];
function s08(c, t) {
  const W = 1700, H = 880, X0 = 960 - W / 2, Y0 = 480 - H / 2;
  push(c, t, L('008').t0, L('008').t1, 0.03, 960, 520, () => {
    Q.sheet(c, 'E13', 960, 480, W, H, { seed: 781, label: '人群围看一个人' });
    const a = at('008', '跟大家不一样'), red = smooth(prog(t, at('008', '压力'), at('008', '压力') + 0.5));
    const col = red > 0.5 ? 'rgba(158,59,38,0.95)' : 'rgba(35,27,21,0.9)', lw = lerp(7, 11, red);
    const T = [X0 + MID[0] * W, Y0 + MID[1] * H];
    EYES.forEach(([u, v], k) => {
      const A = [X0 + u * W, Y0 + v * H], p = prog(t, a + k * 0.12, a + k * 0.12 + 0.7);
      const B = [lerp(A[0], T[0], 0.86), lerp(A[1], T[1], 0.86)];          // 箭头停在他身边，不压在他身上
      gaze(c, A, B, p, { color: col, w: lw, bend: 0, dash: [18, 10] });
      if (p >= 0.98) { const ang = Math.atan2(B[1] - A[1], B[0] - A[0]); c.save(); c.translate(B[0], B[1]); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(-lw * 4, -lw * 2.3); c.lineTo(-lw * 4, lw * 2.3); c.closePath(); c.fill(); c.restore(); }
    });
  });
  Q.tag(c, 960, 130, '格格不入', pop(t, at('008', '格格不入')), { size: 66, seed: 782 });
  Q.tag(c, 960, 860, '压力', pop(t, at('008', '压力')), { size: 72, hl: true, seed: 783 });
}
// —— 009：背后是盯着看的人群（淡）；“你”身边一个问号、一块倒计时的怀表，说到时分别变成「拿不准」「有压力」两张签 ——
function s09(c, t) {
  const q1 = at('009', '拿不准'), q2 = at('009', '有压力');
  const crowd = lerp(0.28, 0.6, smooth(prog(t, q2 - 0.2, q2 + 0.5)));
  push(c, t, L('009').t0, L('009').t1, 0.025, 960, 560, () => {
    Q.sheet(c, 'E31', 960, 500, 1760, 900, { seed: 795, alpha: crowd, label: '人群' });
    you(c, 'E01', 960, 990, 600);
  });
  // 左：大问号纸片 → 「拿不准」；右：怀表（指针倒着走）→ 「有压力」
  const f1 = smooth(prog(t, q1 - 0.1, q1 + 0.4)), f2 = smooth(prog(t, q2 - 0.1, q2 + 0.4));
  c.save(); c.globalAlpha *= 1 - f1;
  Q.tag(c, 520, 520, '？', pop(t, L('009').t0 - 0.1, 0.5), { size: 190, seed: 796, rot: -0.05 });
  c.restore();
  Q.tag(c, 520, 520, '拿不准', f1, { size: 84, hl: true, seed: 793, rot: -0.03 });
  c.save(); c.globalAlpha *= 1 - f2;
  const w = pop(t, L('009').t0, 0.5);
  if (w > 0.01) {
    c.save(); c.globalAlpha *= w; Q.put(c, 'V6_watch', 1400, 720, 400, { ar: 0.8 });
    const [cx, cy] = Q.ptOf('V6_watch', 1400, 720, 400, 0.5, 0.62, { ar: 0.8 });
    const ang = -(t - L('009').t0) * 2.2;
    c.translate(cx, cy); c.rotate(ang); c.strokeStyle = Q.RUST; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, -105); c.stroke(); c.restore();
  }
  c.restore();
  Q.tag(c, 1400, 520, '有压力', f2, { size: 84, hl: true, seed: 794, rot: 0.03 });
  Q.tag(c, 960, 130, '两种时候最强', pop(t, at('009', '两种时候')), { size: 56, seed: 792 });
}

module.exports = { shots: [['005', s05, 'moran'], ['006', s06, 'fade'], ['007', s07, 'slide'], ['008', s08, 'slide'], ['009', s09, 'fade']].map(([id, draw, tr]) => (tr === 'moran' ? { a: L(id).t0 - 0.15, gl: tr, name: id, draw } : { a: L(id).t0 - 0.15, tr, name: id, draw })) };
