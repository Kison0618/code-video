'use strict';
// v7 · 038–044：反过来为你所用（按芒格 + 西奥迪尼）
//   038 芒格版画 + “能，但得用对”   039 诊所证书墙 + 34%   040 前台转接电话 + 预约 +20% / 签约 +15%
//   041 库克船长：军官餐桌上的酸菜 → 水手抢着要   042 在你敬佩的人手下做事   043 既不道德，也不聪明   044 收尾印章
const K = require('../core'), Q = require('../kit02'), X = require('../kit'), C = require('../card'), CUT = require('../cutout');
const TL = require('../timeline'), U = require('./v5_util'), V = require('./v6_util');
const { L, at } = TL, { prog, smooth, lerp, easeOut, easeInOut } = K;
const pop = V.pop;
const MUNGER = CUT.has('eng_munger') ? CUT.get('eng_munger') : null;
function push(c, t, id, amt = 0.035, cx = 960, cy = 540) {
  const l = L(id), z = 1 + amt * smooth(prog(t, l.t0 - 0.2, l.t1 + 0.4));
  c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
}
const NUMS = ['一', '二', '三', '四'];
function heading(c, t, k, s, id) { Q.tag(c, 470, 170, `第${NUMS[k]} · ${s}`, pop(t, L(id).t0), { size: 56, seed: 760 + k, rot: -0.02 }); }
function pct(c, t, x, y, n, a, size, col = Q.RUST) {        // 滚动计数的百分比
  const p = pop(t, a); if (p <= 0.01) return;
  c.save(); c.globalAlpha = p;
  X.roll(c, lerp(0, n, easeOut(prog(t, a, a + 0.8))), x, y, size, { color: col, digits: 2 });
  c.font = `700 ${size * 0.7}px Num`; c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('%', x + size * 0.62, y + size * 0.06);
  c.restore();
}

function s38(c, t) {
  c.save(); push(c, t, '038', 0.03, 960, 700);
  if (MUNGER) CUT.place(c, MUNGER, 960, 830, 620, {});
  c.restore();
  Q.tag(c, 960, 190, '反过来，为你所用', pop(t, at('038', '反过来')), { size: 76, seed: 761 });
  V.verdict(c, t, '038', '能，但得用对', at('038', '能，'), 960, 850, 84);
}
function s39(c, t) {
  c.save(); push(c, t, '039', 0.04, 760, 520);
  V.sheet(c, 'K01', 760, 500, 1180, 790, { seed: 762 });
  c.restore();
  Q.tag(c, 1560, 330, '证书挂上墙', pop(t, at('039', '证书')), { size: 58, seed: 763 });
  Q.tag(c, 1560, 520, '病人坚持康复训练', pop(t, at('039', '坚持')), { size: 50, seed: 764 });
  pct(c, t, 1440, 720, 34, at('039', '百分之三十四') - 0.2, 170);
  Q.tag(c, 1700, 720, '↑', pop(t, at('039', '提高')), { size: 90, bg: 'transparent', seed: 765 });
  heading(c, t, 0, '让真本事被看见', '039');
}
function s40(c, t) {
  c.save(); push(c, t, '040', 0.035, 620, 600);
  V.put(c, 'G07', 620, 960, 700);
  c.restore();
  C.bubble(c, { x: 820, y: 330, text: '他干这行 15 年了', size: 56, pop: pop(t, at('040', '干了多少年') - 0.3, 0.4), tail: [700, 470] });
  const ta = at('040', '预约量'), ts = at('040', '签约量');
  V.reveal(c, t, ta, () => { Q.tag(c, 1430, 560, '预约', 1, { size: 56, seed: 766 }); });
  pct(c, t, 1600, 560, 20, ta + 0.2, 130);
  V.reveal(c, t, ts, () => { Q.tag(c, 1430, 760, '签约', 1, { size: 56, seed: 767 }); });
  pct(c, t, 1600, 760, 15, ts + 0.2, 130);
  heading(c, t, 1, '让别人替你说', '040');
}
function s41(c, t) {
  const sw = at('041', '没多久') - 0.3, q = smooth(prog(t, sw, sw + 0.6));
  if (q < 1) {
    c.save(); c.globalAlpha = 1 - q; push(c, t, '041', 0.04);
    V.sheet(c, 'K02', 960, 520, 1300, 860, { seed: 768 });
    c.restore();
    Q.tag(c, 1500, 280, '库克船长', pop(t, at('041', '库克船长')), { size: 60, seed: 769 });
    Q.tag(c, 960, 850, '只给军官的餐桌摆酸菜', pop(t, at('041', '只让军官')), { size: 62, hl: true, seed: 770 });
  }
  if (q > 0) {
    c.save(); c.globalAlpha = q; push(c, t, '041', 0.03);
    V.sheet(c, 'K03', 960, 520, 1300, 860, { seed: 771 });
    c.restore();
    Q.tag(c, 960, 850, '水手抢着要', pop(t, at('041', '抢着要')), { size: 70, hl: true, seed: 772 });
    X.stamp(c, 1520, 300, '躲过坏血病', prog(t, at('041', '坏血病'), at('041', '坏血病') + 0.5), { size: 64, rot: -0.08, seed: 773, color: Q.RUST });
  }
  heading(c, t, 2, '让他尊敬的人先做', '041');
}
function s42(c, t) {
  c.save(); push(c, t, '042', 0.03, 960, 600);
  V.sheet(c, 'I06', 960, 540, 1200, 760, { seed: 774 });
  c.restore();
  Q.tag(c, 1450, 330, '给你发工资的人', pop(t, at('042', '发工资')), { size: 56, seed: 775 });
  V.verdict(c, t, '042', '在你真正敬佩的人手下做事', at('042', '敬佩'), 960, 850, 70);
  heading(c, t, 3, '用在你自己身上', '042');
}
function s43(c, t) {
  if (MUNGER) CUT.place(c, MUNGER, 520, 900, 560, {});
  Q.tag(c, 1280, 330, '操纵信任你的人', pop(t, at('043', '操纵')), { size: 64, seed: 776 });
  X.stamp(c, 1280, 540, '不道德', prog(t, at('043', '不道德'), at('043', '不道德') + 0.5), { size: 92, rot: -0.08, seed: 777, color: Q.RUST });
  X.stamp(c, 1300, 730, '不聪明', prog(t, at('043', '不聪明'), at('043', '不聪明') + 0.5), { size: 92, rot: 0.06, seed: 778, color: Q.RUST });
}
function s44(c, t) {
  const a = L('044').t0;
  X.stamp(c, 960, 455, '误判', prog(t, a + 0.2, a + 1.1), { size: 250, rot: -0.08, seed: 740, color: Q.RUST });
  V.verdict(c, t, '044', '你最想先用在哪件事上？', at('044', '最想'), 960, 800, 74);
}
U.stampAt('不道德', at('043', '不道德') + 0.25, 'minor');
U.stampAt('不聪明', at('043', '不聪明') + 0.25, 'minor');
U.stampAt('误判', L('044').t0 + 0.2 + 0.9 / 1.4, 'main');

module.exports = {
  shots: [['038', s38, 'paixian'], ['039', s39], ['040', s40], ['041', s41], ['042', s42], ['043', s43], ['044', s44]]
    .map(([id, draw, gl]) => (gl ? { a: L(id).t0 - 0.15, gl, draw, name: id } : { a: L(id).t0 - 0.15, tr: 'fade', draw, name: id })),
};
