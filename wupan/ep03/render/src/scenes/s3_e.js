'use strict';
// 023–027 生活里随处可见：四张卡依次翻开 —— 深夜药店长队 / 电视罐头笑声 / 网购销量和评论 / 会议室没人反对。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig } = U;
const { smooth, prog, lerp, clamp, easeOut } = K;
const P = require('../paper');
const V5 = require('./v5_util');

// —— 023：桌上四张背面朝上的卡 ——
const BACK = P.poly(P.jag([[-170, -230], [170, -230], [170, 230], [-170, 230]], 2, 16, 1001));
function s23(c, t) {
  push(c, t, L('023').t0, L('023').t1 + 0.3, 0.03, 960, 520, () => {
    [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
      const p = pop(t, L('023').t0 - 0.1 + i * 0.12, 0.45);
      c.save(); c.globalAlpha *= clamp(p * 2); c.translate(960 + k * 400, 500 + (1 - easeOut(p)) * 60); c.rotate((i % 2 ? 1 : -1) * 0.03);
      P.piece(c, BACK, '#b7895a', { blur: 18, dy: 8 });
      c.strokeStyle = 'rgba(251,246,234,0.6)'; c.lineWidth = 5; c.strokeRect(-140, -200, 280, 400);
      c.fillStyle = 'rgba(251,246,234,0.85)'; c.font = '700 120px Num'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 0, 8);
      c.restore();
    });
  });
  Q.tag(c, 960, 880, '随处可见', pop(t, at('023', '随处可见')), { size: 70, hl: true, seed: 1002 });
}
// 翻牌进场：每张卡开头 0.5 秒横向展开
function flipIn(c, t, a, fn) {
  const p = smooth(prog(t, a - 0.15, a + 0.45));
  c.save(); c.translate(960, 540); c.scale(Math.max(0.02, p), 1); c.translate(-960, -540); fn(); c.restore();
}
// —— 024：深夜药店长队 ——
function s24(c, t) {
  flipIn(c, t, L('024').t0, () => push(c, t, L('024').t0, L('024').t1, 0.035, 960, 500, () => {
    Q.sheet(c, 'E24', 960, 480, 1700, 880, { seed: 1011, label: '深夜药店 · 门口长队' });
  }));
  Q.tag(c, 250, 130, '2020', pop(t, at('024', '二零二零年')), { size: 64, font: 'Num', seed: 1012 });
  V5.msg(c, 520, 120, 1100, '双黄连可抑制病毒', pop(t, at('024', '双黄连') - 0.2, 0.5), { size: 56, bg: '#fff3c4' });
  Q.tag(c, 1640, 150, '深夜', pop(t, at('024', '深夜')), { size: 64, bg: Q.INK, color: '#fbf3df', seed: 1013 });
  Q.tag(c, 1450, 850, '排起了长队', pop(t, at('024', '排起了长队')), { size: 56, hl: true, seed: 1014 });
}
// —— 025：老电视里一张张“哈哈哈”字卡 ——
const TV = { u0: 0.08, v0: 0.13, u1: 0.78, v1: 0.80 };     // H06 剪影框里屏幕的位置（沿用第二集）
function s25(c, t) {
  flipIn(c, t, L('025').t0, () => push(c, t, L('025').t0, L('025').t1, 0.03, 960, 520, () => {
    const tx = 960, ty = 930, th = 760;
    Q.put(c, 'H06', tx, ty, th, { ar: 1.35 });
    const [ax, ay] = Q.ptOf('H06', tx, ty, th, TV.u0, TV.v0, { ar: 1.35 }), [bx, by] = Q.ptOf('H06', tx, ty, th, TV.u1, TV.v1, { ar: 1.35 });
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    const a = at('025', '笑声');
    [['哈哈哈', -150, -110, -0.05], ['哈哈哈哈', 120, 10, 0.04], ['哈哈哈', -90, 130, 0.02]].forEach(([s, dx, dy, r], k) =>
      Q.tag(c, cx + dx, cy + dy, s, pop(t, a + k * 0.35, 0.4), { size: 64, hl: true, rot: r, seed: 1021 + k }));
    Q.tag(c, cx + 170, cy - 200, '后期加的', pop(t, at('025', '明知道是假的')), { size: 46, color: '#fbf3df', bg: Q.RUST, seed: 1024, rot: 0.05 });
  }));
  Q.tag(c, 1650, 760, '更好笑', pop(t, at('025', '更好笑')), { size: 60, seed: 1025 });
}
// —— 026：手机购物页：销量滚动、评论区最早的几个赞、后面的星星依次亮 ——
function s26(c, t) {
  flipIn(c, t, L('026').t0, () => {
    V5.phone(c, 960, 520, 560, 820, (cc, w, h) => {
      cc.fillStyle = '#f6f2ea'; cc.fillRect(0, 0, w, h);
      cc.fillStyle = '#e4dccd'; cc.fillRect(30, 30, w - 60, 230);
      Q.put(cc, 'H04', w / 2, 250, 200, { ar: 1.2, shadow: false });
      cc.fillStyle = Q.INK; cc.font = '700 40px Sans'; cc.textAlign = 'left'; cc.textBaseline = 'middle';
      cc.fillText('销量', 34, 310);
      const sv = at('026', '销量'); X.roll(cc, 10 * smooth(prog(t, sv, sv + 1.2)), w - 40, 310, 44, { digits: 2, suffix: ' 万+', color: Q.RUST });
      cc.fillStyle = 'rgba(35,27,21,0.2)'; cc.fillRect(30, 350, w - 60, 3);
      cc.fillStyle = Q.INK; cc.font = '700 38px Sans'; cc.fillText('评论', 34, 395);
      const first = at('026', '最早的几个赞'), good = at('026', '往好的方向带');
      for (let k = 0; k < 4; k++) {
        const y = 450 + k * 92, p = pop(t, at('026', '评论') + k * 0.15, 0.4);
        if (p <= 0.01) continue;
        cc.save(); cc.globalAlpha *= p;
        cc.fillStyle = '#ffffff'; cc.beginPath(); cc.roundRect(30, y, w - 60, 78, 10); cc.fill();
        if (k === 0) Q.marker(cc, [[w - 210, y + 40], [w - 50, y + 40]], prog(t, first, first + 0.6), { w: 46 });
        cc.fillStyle = Q.INK; cc.font = '500 30px Sans'; cc.fillText('赞 ' + [128, 12, 6, 3][k], w - 190, y + 40);
        const lit = k === 0 ? 5 : Math.round(lerp(2, 5, smooth(prog(t, good + (k - 1) * 0.35, good + (k - 1) * 0.35 + 0.5))));
        for (let s = 0; s < 5; s++) { cc.fillStyle = s < lit ? '#e0a526' : '#cfc6b6'; cc.font = '700 34px Sans'; cc.fillText('★', 50 + s * 40, y + 40); }
        cc.restore();
      }
    });
  });
  Q.tag(c, 450, 330, '销量和评论', pop(t, at('026', '销量')), { size: 56, seed: 1031 });
  Q.tag(c, 1480, 520, '最早的几个赞', pop(t, at('026', '最早的几个赞')), { size: 54, hl: true, seed: 1032 });
  Q.tag(c, 1480, 760, '往好的方向带', pop(t, at('026', '往好的方向带')), { size: 50, seed: 1033 });
}
// —— 027：会议室，每个人头顶一个“……”；“没人反对”；“方案没问题”盖勾章 ——
const HEADS = [[0.18, 0.36], [0.33, 0.30], [0.50, 0.28], [0.67, 0.30], [0.82, 0.36]];
function s27(c, t) {
  const W = 1700, H = 880, X0 = 960 - W / 2, Y0 = 480 - H / 2;
  flipIn(c, t, L('027').t0, () => push(c, t, L('027').t0, L('027').t1, 0.03, 960, 500, () => {
    Q.sheet(c, 'E25', 960, 480, W, H, { seed: 1041, label: '会议室 · 没人说话' });
    const a = at('027', '什么都不做');
    HEADS.forEach(([u, v], k) => Q.tag(c, X0 + u * W, Y0 + v * H - 70, '……', pop(t, a + k * 0.15, 0.4), { size: 44, seed: 1042 + k }));
  }));
  Q.tag(c, 330, 130, '更隐蔽', pop(t, at('027', '更隐蔽')), { size: 52, seed: 1048 });
  Q.tag(c, 960, 130, '没人反对', pop(t, at('027', '没人反对')), { size: 66, hl: true, seed: 1049 });
  X.stamp(c, 1500, 780, '没问题？', prog(t, at('027', '方案没问题'), at('027', '方案没问题') + 0.8), { size: 70, color: Q.RUST, seed: 1050 });
}

module.exports = { shots: [['023', s23, 'fanye'], ['024', s24, 'cut'], ['025', s25, 'cut'], ['026', s26, 'cut'], ['027', s27, 'cut']].map(([id, draw, tr]) => (tr === 'fanye' ? { a: L(id).t0 - 0.15, gl: tr, name: id, draw } : { a: L(id).t0 - 0.15, tr: 'fade', d: 0.3, name: id, draw })) };
