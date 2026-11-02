'use strict';
// 015–022 抢盐（主故事）：互相看 → 谣言短信 → 货架一格格变空（主视觉）→ 空货架成了证据 → 全国抢、涨价 → 辟谣 → 退盐队伍、价回落 → 判词。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, over, crowdAt, gaze, verdict, bigPaper } = U;
const { smooth, prog, lerp, clamp, easeOut, easeIn, easeInOut } = K;
const P = require('../paper');
const V5 = require('./v5_util');

// —— 互相看的一排人（015、022 共用）：每个人头顶到下一个人头顶连一条视线虚线，最后一条绕回第一个 ——
const ROW = [['E05', 420, false], ['E01', 780, false], ['E06', 1140, true], ['E07', 1500, true]];
function lookRow(c, t, a, y = 900, h = 520) {
  const heads = ROW.map(([n, x, flip], k) => {
    if (n === 'E01') you(c, n, x, y, h); else fig(c, n, x, y, h, { flip });
    const [hx, hy] = Q.ptOf(n, x, y, h, 0.5, 0, { ar: 0.42, flip });
    return [hx, hy - (n === 'E01' ? 110 : 20)];
  });
  for (let k = 0; k < 4; k++) gaze(c, heads[k], heads[(k + 1) % 4], prog(t, a + k * 0.3, a + k * 0.3 + 0.6), { bend: k === 3 ? 170 : 70, w: 5 });
}
function s15(c, t) {
  push(c, t, L('015').t0, L('015').t1 + 0.8, 0.03, 960, 600, () => lookRow(c, t, at('015', '每个人')));
  Q.tag(c, 960, 140, '每个人都在看别人', pop(t, at('015', '看别人')), { size: 62, hl: true, seed: 901 });
}

// —— 016：时间卡 + 手机短信，谣言三句依次出现 ——
function s16(c, t) {
  bigPaper(c, 960, 150, 560, 150, '2011 · 3 月', 86, pop(t, L('016').t0 - 0.1, 0.6), { font: 'Num', seed: 902 });
  Q.tag(c, 1560, 160, '日本核泄漏', pop(t, at('016', '日本核泄漏')), { size: 50, seed: 903 });
  push(c, t, L('016').t0, L('016').t1, 0.03, 760, 600, () => {
    Q.put(c, 'E20', 520, 1000, 720, { ar: 0.5, label: '2011 年直板手机' });
    [['吃碘盐能防辐射', '吃碘盐'], ['海水被污染了', '海水'], ['以后盐不够吃', '以后盐']].forEach(([s, w], k) => {
      V5.msg(c, 830, 340 + k * 170, 1000, s, pop(t, at('016', w) - 0.1, 0.5), { size: 56, bg: k === 2 ? '#fff3c4' : '#ffffff' });
    });
  });
  Q.tag(c, 1180, 860, '流传', pop(t, at('016', '流传')), { size: 52, seed: 904 });
}

// —— 货架：E17 剪影框里 4 层 × 6 格，每格一摞盐（E18）。格子位置按剪影框比例给，素材到位后按实图调 ——
const SH = { cols: 6, rows: [[0.06, 0.24], [0.30, 0.48], [0.54, 0.72], [0.78, 0.96]], u0: 0.07, u1: 0.93 };
function cellRect(x, y, h, i) {
  const r = Math.floor(i / SH.cols), k = i % SH.cols;
  const [a0, b0] = Q.ptOf('E17', x, y, h, SH.u0 + (SH.u1 - SH.u0) * k / SH.cols, SH.rows[r][0], { ar: 1.1 });
  const [a1, b1] = Q.ptOf('E17', x, y, h, SH.u0 + (SH.u1 - SH.u0) * (k + 1) / SH.cols, SH.rows[r][1], { ar: 1.1 });
  return [a0, b0, a1, b1];
}
// gone(i) 0..1：第 i 格被拿走的进度（往上提走 + 淡出）
function shelf(c, x, y, h, gone, o = {}) {
  Q.put(c, 'E17', x, y, h, { ar: 1.1, label: '空货架' });
  for (let i = 0; i < 24; i++) {
    const g = clamp(gone(i)); if (g >= 1) continue;
    const [a0, b0, a1, b1] = cellRect(x, y, h, i), cw = a1 - a0, ch = b1 - b0;
    c.save(); c.globalAlpha *= 1 - easeIn(g); c.translate(0, -easeIn(g) * ch * 0.8);
    for (let k = 0; k < 3; k++) Q.put(c, 'E18', a0 + cw * (0.22 + k * 0.28), b1 - 2, ch * 0.78, { ar: 0.7, shadow: false, pw: cw * 0.3 });
    c.restore();
  }
  if (o.after) o.after(cellRect);
}
// 拿盐的节奏：017 两次各 2 格，018 剩下 20 格越来越快
const ORDER = [0, 1, 6, 7, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
function takeTimes() {
  const T = [];
  const g1 = at('017', '多拿了几包'), g2 = at('017', '也多拿了几包');
  T.push(g1 + 0.35, g1 + 0.55, g2 + 0.35, g2 + 0.55);
  const a = at('018', '再下一个人'), b = at('018', '整排空货架') + 0.4;
  for (let k = 0; k < 20; k++) { const u = k / 19; T.push(a + (b - a) * (1 - Math.pow(1 - u, 1.6))); }
  const out = []; ORDER.forEach((cell, k) => { out[cell] = T[k]; }); return out;
}
let TT = null;
const goneAt = t => i => { if (!TT) TT = takeTimes(); return prog(t, TT[i], TT[i] + 0.28); };
const SX = 1130, SY = 960, SHH = 860;
// 手从上方伸进来抓走两格：down → 到格子 → 带着盐提走
function hand(c, t, g, cell) {
  const p = prog(t, g - 0.25, g + 0.9); if (p <= 0 || p >= 1) return;
  const [a0, b0, a1, b1] = cellRect(SX, SY, SHH, cell);
  const dy = p < 0.45 ? lerp(-700, 0, easeOut(p / 0.45)) : lerp(0, -760, easeIn((p - 0.45) / 0.55));
  Q.put(c, 'E19', a1, b1 + dy, 380, { ar: 0.8, label: '伸手抓盐' });
}
function s17(c, t) {
  push(c, t, L('017').t0, L('017').t1, 0.025, 1100, 560, () => {
    shelf(c, SX, SY, SHH, goneAt(t));
    hand(c, t, at('017', '多拿了几包'), 1);
    hand(c, t, at('017', '也多拿了几包'), 7);
    // “下一个人”：“你”从左边走进来，停在货架前
    const a = at('017', '下一个人'), w = smooth(prog(t, a - 0.3, a + 1.0));
    if (w > 0) {
      const x = lerp(-150, 330, w);
      you(c, w < 1 ? 'E02' : 'E01', x, 980, 520);
      over(c, 'E01', x, 980, 520, '！', pop(t, at('017', '心里一紧')), { dy: 130, size: 64, color: Q.RUST, seed: 911 });
    }
  });
  Q.tag(c, 1130, 70, '空了一块', pop(t, at('017', '空了一块')), { size: 50, seed: 912 });
}
function s18(c, t) {
  push(c, t, L('018').t0, L('018').t1, 0.04, 1100, 560, () => {
    shelf(c, SX, SY, SHH, goneAt(t));
    you(c, 'E01', 330, 980, 520);
    // “证据”：大纸签用回形针别在空货架正中
    const p = pop(t, at('018', '证据') - 0.15, 0.6);
    if (p > 0.01) { Q.tag(c, SX, 520, '证据', p, { size: 120, hl: true, seed: 913, rot: -0.04 }); Q.clip(c, SX - 60, 445, 1.2, 0.2); }
  });
  Q.tag(c, 960, 70, '整排空货架', pop(t, at('018', '整排空货架')), { size: 50, seed: 914 });
}

// —— 019：空货架缩成一格，复制成一墙（4 × 3）；扛盐的人走过；价签 1.3 元 → 7–8 元 ——
function s19(c, t) {
  const a = at('019', '全国抢盐'), s = smooth(prog(t, L('019').t0, a + 0.2));
  const cells = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) cells.push([340 + k * 400, 300 + r * 250]);
  cells.forEach(([cx, cy], i) => {
    const first = i === 5;
    const p = first ? 1 : pop(t, a + 0.1 + i * 0.09, 0.4);
    if (p <= 0.01) return;
    const big = first ? 1 - s : 0;
    const x = lerp(cx, SX, big), y = lerp(cy + 110, SY, big), h = lerp(220, SHH, big);
    c.save(); c.globalAlpha *= p; Q.put(c, 'E17', x, y, h, { ar: 1.1 }); c.restore();
  });
  Q.tag(c, 960, 70, '全国', pop(t, a), { size: 64, hl: true, seed: 921 });
  const g = at('019', '扛回去'), w = prog(t, g - 0.4, g + 3.0);
  if (w > 0 && w < 1) fig(c, 'E21', lerp(-200, 2100, w), 1010, 600, { label: '扛着一摞盐的人' });
  const pr = at('019', '七八块');
  X.priceTag(c, 1690, 640, '1.3 元', { text2: '7–8 元', flip: clamp(prog(t, pr, pr + 0.5)), s: 1.5, t, color: t > pr + 0.25 ? Q.RUST : Q.INK, size: 50, alpha: pop(t, pr - 1.2, 0.5) });
}

// —— 020：辟谣公告拍下，两行依次写出、盖章 ——
const NOTICE = P.poly(P.jag([[-470, -330], [470, -330], [470, 330], [-470, 330]], 2, 18, 931));
function s20(c, t) {
  c.save(); c.globalAlpha *= 0.45; Q.put(c, 'E17', 260, 900, 520, { ar: 1.1 }); c.restore();
  const p = pop(t, L('020').t0 - 0.1, 0.5);
  c.save(); c.translate(1000, 470); c.rotate(-0.015); c.scale(lerp(1.15, 1, p), lerp(1.15, 1, p)); c.globalAlpha *= clamp(p * 2);
  P.piece(c, NOTICE, '#fbf7ee', { blur: 24, dy: 12 });
  c.fillStyle = Q.INK; c.font = '900 110px Serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('辟谣', 0, -200);
  c.fillStyle = 'rgba(35,27,21,0.5)'; c.fillRect(-380, -120, 760, 4);
  const l1 = at('020', '防不了辐射'), l2 = at('020', '根本不缺');
  c.font = '700 70px Sans';
  if (t > l1 - 0.2) { c.globalAlpha *= 1; c.fillText('碘盐防不了辐射', 0, -10); }
  if (t > l2 - 0.2) c.fillText('盐也根本不缺', 0, 140);
  c.restore();
  X.stamp(c, 1360, 290, '辟谣', prog(t, at('020', '辟谣'), at('020', '辟谣') + 0.8), { size: 78, color: Q.RUST, seed: 932 });
  Q.marker(c, [[690, 470], [1310, 470]], prog(t, l1, l1 + 0.6), { w: 30 });
  Q.marker(c, [[750, 620], [1250, 620]], prog(t, l2, l2 + 0.6), { w: 30 });
}

// —— 021：两支队伍对比 → 退盐的人排到服务台 → 价签回到 1.3 元、货架重新补满 ——
function s21(c, t) {
  const back = at('021', '货架上的盐'), sw = smooth(prog(t, back - 0.4, back + 0.3));
  if (sw < 1) {
    c.save(); c.globalAlpha *= 1 - sw;
    // 上：抢盐的队伍（褪成灰）走向空货架
    c.save(); c.globalAlpha *= lerp(1, 0.4, smooth(prog(t, at('021', '另一支队伍'), at('021', '排队退盐')))) ;
    Q.put(c, 'E17', 1600, 470, 380, { ar: 1.1 });
    for (let k = 0; k < 5; k++) fig(c, crowdAt(k), 380 + k * 190, 470, 300);
    c.restore();
    Q.tag(c, 150, 230, '抢盐', pop(t, L('021').t0), { size: 50, seed: 941 });
    // 下：抱着盐的人排到服务台退货
    const q = pop(t, at('021', '排队退盐') - 0.5, 0.8);
    c.save(); c.globalAlpha *= q; c.translate(0, (1 - q) * 60);
    Q.put(c, 'E23', 1620, 990, 400, { ar: 1.3, label: '服务台' });
    Q.tag(c, 1620, 560, '退货', pop(t, at('021', '要求退货')), { size: 56, color: '#fbf3df', bg: Q.RUST, seed: 942 });
    for (let k = 0; k < 5; k++) fig(c, 'E22', 1300 - k * 210, 1000, 380, { label: '抱着盐排队' });
    c.restore();
    Q.tag(c, 150, 640, '退盐', q, { size: 50, hl: true, seed: 943 });
    Q.tag(c, 820, 590, '南京', pop(t, at('021', '南京')), { size: 50, seed: 944 });
    X.priceTag(c, 1110, 560, '8 元', { s: 0.9, t, color: Q.RUST, size: 56, alpha: pop(t, at('021', '八块钱')) });
    if (t > at('021', '五十包') - 0.1) { c.save(); X.roll(c, Math.min(50, (t - at('021', '五十包')) * 70), 1420, 640, 90, { digits: 2, suffix: ' 包', color: Q.RUST }); c.restore(); }
    c.restore();
  }
  if (sw > 0) {
    c.save(); c.globalAlpha *= sw;
    const r = prog(t, back + 0.2, at('021', '一块多') + 0.6);
    shelf(c, SX, SY, SHH, i => 1 - clamp(r * 24 - (23 - i)));
    const pr = at('021', '一块多');
    X.priceTag(c, 300, 300, '8 元', { text2: '1.3 元', flip: clamp(prog(t, pr, pr + 0.5)), s: 1.5, t, size: 50, color: t > pr + 0.25 ? Q.INK : Q.RUST });
    c.restore();
  }
}
// —— 022 判词：回到互相看的一排人 ——
function s22(c, t) {
  push(c, t, L('022').t0, L('022').t1, 0.03, 960, 600, () => lookRow(c, t, L('022').t0 - 1.2, 820, 480));
  verdict(c, t, '022', '每个人都只是在看别人', at('022', '每个人'), 960, 900, 76);
}

module.exports = { shots: [['015', s15, 'fade'], ['016', s16, 'sizhi'], ['017', s17, 'slide'], ['018', s18, 'none'], ['019', s19, 'fade'], ['020', s20, 'slide'], ['021', s21, 'fade'], ['022', s22, 'fade']].map(([id, draw, tr]) => {
  if (tr === 'sizhi') return { a: L(id).t0 - 0.15, gl: tr, name: id, draw };
  return { a: L(id).t0 - (tr === 'none' ? 0 : 0.15), tr: tr === 'none' ? 'cut' : tr, d: tr === 'none' ? 0.01 : undefined, name: id, draw };
}) };
