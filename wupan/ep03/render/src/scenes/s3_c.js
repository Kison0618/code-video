'use strict';
// 010–014 小测试：阿希线段卡 → 五个人依次亮 A → “你”也改成 A → 有一个人亮 B → 判词。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, verdict } = U;
const { smooth, prog, lerp, clamp, easeOut } = K;
const P = require('../paper');

// —— 阿希实验卡：左边标准线，右边 A B C（B 一样长）。卡片坐标系：中心 (0,0)，宽 1300 高 640 ——
const CARD = P.poly(P.jag([[-650, -320], [650, -320], [650, 320], [-650, 320]], 2, 18, 801));
const LINES = [['', -420, 300], ['A', 40, 210], ['B', 250, 300], ['C', 460, 390]];
function aschCard(c, x, y, s, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  P.piece(c, CARD, '#fbf7ee', { blur: 22, dy: 10 });
  c.strokeStyle = 'rgba(120,95,60,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-160, -250); c.lineTo(-160, 250); c.stroke();
  LINES.forEach(([lab, lx, len], k) => {
    const jump = o.jump ? o.jump(k) : 0, base = 170;
    if (o.mark && o.mark(k) > 0) Q.marker(c, [[lx, base], [lx, base - len]], o.mark(k), { w: 40 });
    c.strokeStyle = Q.INK; c.lineWidth = 12; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(lx, base - jump); c.lineTo(lx, base - len - jump); c.stroke();
    if (lab) { c.fillStyle = Q.INK; c.font = '700 72px Num'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lab, lx, 250 - jump); }
  });
  c.restore();
}
function s10(c, t) {
  const a = at('010', '左边这条线'), b = at('010', '哪一条');
  // 句末到 011 之间配音空 2 秒：画面保持静止（推镜也在句末停住）
  push(c, t, L('010').t0, L('010').t1, 0.025, 960, 470, () => {
    aschCard(c, 960, 470, 1, {
      mark: k => (k === 0 ? prog(t, a, a + 0.7) : 0),
      jump: k => (k > 0 ? Math.sin(clamp(prog(t, b + (k - 1) * 0.28, b + (k - 1) * 0.28 + 0.35)) * Math.PI) * 26 : 0),
    });
  });
  Q.tag(c, 960, 105, '小测试', pop(t, at('010', '小测试')), { size: 58, seed: 802 });
}
// —— 一排六个座位：五个被试 + 最右边的“你”。答案牌浮在头顶 ——
const SEATS = [['E14', 230, false], ['E15', 520, false], ['E16', 810, false], ['E14', 1100, true], ['E15', 1390, true], ['E03', 1700, false]];
const SEAT_Y = 975, SEAT_H = 420;
function answer(c, n, x, flip, s, p, o = {}) {
  if (p <= 0.01) return;
  const [hx, hy] = Q.ptOf(n, x, SEAT_Y, SEAT_H, 0.5, 0, { ar: 0.6, flip });
  const lift = (1 - easeOut(p)) * 50, sq = o.flip ? Math.max(0.03, Math.abs(Math.cos(o.flip * Math.PI))) : 1;
  c.save(); c.globalAlpha *= clamp(p * 2); c.translate(hx, hy - 95 + lift); c.scale(sq, 1);
  P.piece(c, P.poly(P.jag([[-62, -66], [62, -66], [62, 66], [-62, 66]], 2, 12, 810 + Math.round(x))), o.bg || '#fbf7ee', { blur: 12, dy: 6 });
  c.fillStyle = o.color || Q.INK; c.font = '700 96px Num'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 6);
  c.restore();
  if (o.ring > 0) Q.ring(c, hx, hy - 95 + lift, 90, 90, o.ring, o.ringCol || 'rgba(158,59,38,0.85)', 10);
}
function row(c, t, opt) {
  SEATS.forEach(([n, x, flip], k) => {
    if (k === 5) you(c, n, x, SEAT_Y, SEAT_H, { tagPop: 0 });
    else fig(c, n, x, SEAT_Y, SEAT_H, { flip, ar: 0.6 });
    opt(k, n, x, flip);
  });
  // “你”的黄签放在座位下方，头顶留给答案牌
  Q.tag(c, 1700, 1000 - 60, '你', 1, { size: 40, hl: true, seed: 701 });
}
function s11(c, t) {
  const five = at('011', '五个人'), mine = L('011').t0 + 0.3;
  aschCard(c, 960, 210, 0.45, {});
  row(c, t, (k, n, x, flip) => {
    if (k < 5) answer(c, n, x, flip, 'A', pop(t, five + k * 0.42, 0.45));
    else answer(c, n, x, flip, 'B', pop(t, mine, 0.5));
  });
}
function s12(c, t) {
  const see = at('012', '看得清清楚楚'), sw = at('012', '跟着说了');
  aschCard(c, 960, 210, 0.45, { mark: k => (k === 2 ? prog(t, see, see + 0.7) : 0) });
  const f = clamp(prog(t, sw, sw + 0.5));
  row(c, t, (k, n, x, flip) => {
    if (k < 5) answer(c, n, x, flip, 'A', 1);
    else answer(c, n, x, flip, f < 0.5 ? 'B' : 'A', 1, { flip: f, ring: prog(t, sw + 0.4, sw + 1.1) });
  });
  Q.tag(c, 1560, 140, '阿希 · 从众实验', pop(t, at('012', '阿希')), { size: 50, seed: 812 });
}
// —— 013：第三个人亮出 B；“少了一大截”时“你”也从 A 翻回 B（有人先说真话，跟着答错的就少了）——
function s13(c, t) {
  const one = at('013', '有一个人'), drop = at('013', '少了一大截');
  aschCard(c, 960, 210, 0.45, { mark: k => (k === 2 ? 1 : 0) });
  row(c, t, (k, n, x, flip) => {
    if (k === 2) { const f = clamp(prog(t, one - 0.1, one + 0.4)); answer(c, n, x, flip, f < 0.5 ? 'A' : 'B', 1, { bg: f < 0.5 ? '#fbf7ee' : Q.YEL, flip: f }); }
    else if (k === 5) { const f = clamp(prog(t, drop - 0.2, drop + 0.3)); answer(c, n, x, flip, f < 0.5 ? 'A' : 'B', 1, { bg: f < 0.5 ? '#fbf7ee' : Q.YEL, flip: f }); }
    else answer(c, n, x, flip, 'A', 1);
  });
  Q.tag(c, 1560, 140, '一个人先说出正确答案', pop(t, at('013', '正确答案')), { size: 46, seed: 814 });
  Q.tag(c, 1560, 250, '跟着答错的少了一大截', pop(t, drop), { size: 46, hl: true, seed: 815, rot: 0.02 });
}
// —— 014 判词：只留那个举 B 的人 ——
function s14(c, t) {
  push(c, t, L('014').t0, L('014').t1, 0.03, 960, 600, () => {
    fig(c, 'E16', 960, 820, 560, { ar: 0.6 });
    const [hx, hy] = Q.ptOf('E16', 960, 820, 560, 0.5, 0, { ar: 0.6 });
    c.save(); c.translate(hx, hy - 110);
    P.piece(c, P.poly(P.jag([[-80, -84], [80, -84], [80, 84], [-80, 84]], 2, 12, 816)), Q.YEL, { blur: 14, dy: 6 });
    c.fillStyle = Q.INK; c.font = '700 124px Num'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('B', 0, 8); c.restore();
  });
  verdict(c, t, '014', '一个不同的声音', at('014', '一个不同的声音'), 960, 900, 78);
}

module.exports = { shots: [['010', s10, 'paixian'], ['011', s11, 'slide'], ['012', s12, 'fade'], ['013', s13, 'fade'], ['014', s14, 'fade']].map(([id, draw, tr]) => (tr === 'paixian' ? { a: L(id).t0 - 0.15, gl: tr, name: id, draw } : { a: L(id).t0 - 0.15, tr, name: id, draw })) };
