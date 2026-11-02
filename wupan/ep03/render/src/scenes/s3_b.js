'use strict';
// 005–009 为什么会这样：章节卡 → 跟着队伍走大多是对的 → 陌生城市挑人多的馆子 → 格格不入的压力 → 两个触发条件。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, over, crowdAt, gaze, bigPaper } = U;
const { smooth, prog, lerp, clamp } = K;
const CUT = require('../cutout');

// —— 005：章节卡（芒格 + 「社会认同倾向」）→ “拿不准”时卡片退到左边，“你”在右边，头顶问号；“照着周围的人”时他跟着人群转身 ——
let MUNGER = null;
function munger(c, x, y, h) { if (!MUNGER) MUNGER = CUT.get('eng_munger'); CUT.place(c, MUNGER, x, y, h); }
function s05(c, t) {
  const side = smooth(prog(t, at('005', '拿不准') - 0.5, at('005', '拿不准') + 0.3));
  c.save(); c.translate(lerp(0, -330, side), lerp(0, 40, side)); const s = lerp(1, 0.72, side); c.translate(700, 560); c.scale(s, s); c.translate(-700, -560);
  munger(c, 520, 900, 620);
  bigPaper(c, 1100, 470, 760, 210, '社会认同倾向', 108, pop(t, at('005', '社会认同') - 0.2, 0.7), { seed: 751 });
  Q.tag(c, 830, 330, 'No.4', pop(t, at('005', '社会认同') - 0.4), { size: 60, bg: Q.INK, color: '#fbf3df', font: 'Num', seed: 752 });
  c.restore();
  if (side <= 0.01) return;
  c.save(); c.globalAlpha *= side;
  // 他身边的人一起朝右走去；“去想、去做”时他也转身跟上
  const go = smooth(prog(t, at('005', '照着周围的人'), at('005', '去做') + 0.5));
  for (let k = 0; k < 3; k++) fig(c, crowdAt(k), 1180 + k * 170 + go * 120, 930, 330);
  const turn = t >= at('005', '去想');
  you(c, turn ? 'E02' : 'E01', 1020 + go * 90, 940, 380);
  if (!turn) over(c, 'E01', 1020, 940, 380, '？', pop(t, at('005', '拿不准')), { dy: 110, size: 56, seed: 753 });
  c.restore();
}
// —— 006：一条队伍向右，“你”跟在后面；“大多数时候”纸签，“是对的”盖章 ——
function s06(c, t) {
  push(c, t, L('006').t0, L('006').t1, 0.03, 960, 600, () => {
    const walk = (t - L('006').t0) * 18;
    for (let k = 0; k < 5; k++) fig(c, crowdAt(k), 1500 - k * 200 + walk, 900, 380);
    you(c, 'E02', 1500 - 5 * 200 + walk, 905, 390);
  });
  Q.tag(c, 960, 230, '大多数时候', pop(t, at('006', '大多数时候')), { size: 66, seed: 761 });
  X.stamp(c, 1420, 300, '对', prog(t, at('006', '是对的'), at('006', '是对的') + 0.8), { size: 110, color: Q.RUST, seed: 762 });
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
const EYES = [[0.10, 0.38], [0.24, 0.30], [0.40, 0.26], [0.62, 0.27], [0.78, 0.31], [0.91, 0.40]];
const MID = [0.5, 0.55];
function s08(c, t) {
  const W = 1700, H = 880, X0 = 960 - W / 2, Y0 = 480 - H / 2;
  push(c, t, L('008').t0, L('008').t1, 0.03, 960, 520, () => {
    Q.sheet(c, 'E13', 960, 480, W, H, { seed: 781, label: '人群围看一个人' });
    const a = at('008', '跟大家不一样'), red = smooth(prog(t, at('008', '压力'), at('008', '压力') + 0.5));
    EYES.forEach(([u, v], k) => gaze(c, [X0 + u * W, Y0 + v * H], [X0 + MID[0] * W, Y0 + MID[1] * H - 80], prog(t, a + k * 0.12, a + k * 0.12 + 0.7),
      { color: red > 0.5 ? 'rgba(158,59,38,0.95)' : 'rgba(35,27,21,0.9)', w: lerp(7, 11, red), bend: 30, dash: [18, 10] }));
  });
  Q.tag(c, 960, 130, '格格不入', pop(t, at('008', '格格不入')), { size: 66, seed: 782 });
  Q.tag(c, 960, 860, '压力', pop(t, at('008', '压力')), { size: 72, hl: true, seed: 783 });
}
// —— 009：“你”居中，左右两张纸签：拿不准 / 有压力 ——
function s09(c, t) {
  push(c, t, L('009').t0, L('009').t1, 0.025, 960, 600, () => {
    you(c, 'E01', 960, 950, 560);
    over(c, 'E01', 960, 950, 560, '？', pop(t, at('009', '拿不准')), { dy: 130, size: 60, seed: 791 });
    const a = at('009', '有压力');
    [[-1, 420], [1, 420], [-1, 760], [1, 760]].forEach(([d, y], k) => gaze(c, [960 + d * 940, y], [960 + d * 150, 560], prog(t, a + k * 0.1, a + k * 0.1 + 0.6), { color: 'rgba(158,59,38,0.85)', w: 6, bend: 0 }));
  });
  Q.tag(c, 960, 140, '两种时候最强', pop(t, at('009', '两种时候')), { size: 56, seed: 792 });
  Q.tag(c, 470, 520, '拿不准', pop(t, at('009', '拿不准')), { size: 84, hl: true, seed: 793, rot: -0.03 });
  Q.tag(c, 1450, 520, '有压力', pop(t, at('009', '有压力')), { size: 84, hl: true, seed: 794, rot: 0.03 });
}

module.exports = { shots: [['005', s05, 'moran'], ['006', s06, 'fade'], ['007', s07, 'slide'], ['008', s08, 'slide'], ['009', s09, 'fade']].map(([id, draw, tr]) => (tr === 'moran' ? { a: L(id).t0 - 0.15, gl: tr, name: id, draw } : { a: L(id).t0 - 0.15, tr, name: id, draw })) };
