'use strict';
// 023–027 生活里随处可见：四张卡依次翻开 —— 深夜药店长队 / 电视罐头笑声 / 网购销量和评论 / 会议室没人反对。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig } = U;
const { smooth, prog, lerp, clamp, easeOut } = K;
const P = require('../paper');
const V5 = require('./v5_util');

// —— 023：桌上摊开四张缩略图卡：药店长队 / 电视 / 手机评论 / 会议室。024–027 各自从自己那张卡里放大出来 ——
const CARD_W = 420, CARD_H = 300, CARD_Y = 480, CARD_X = [-1.5, -0.5, 0.5, 1.5].map(k => 960 + k * 452);
const CARDP = P.poly(P.jag([[-CARD_W / 2, -CARD_H / 2], [CARD_W / 2, -CARD_H / 2], [CARD_W / 2, CARD_H / 2], [-CARD_W / 2, CARD_H / 2]], 2, 16, 1001));
function cover(c, name, w, h) {
  const im = X.photo('gen/' + name), s = Math.max(w / im.width, h / im.height);
  c.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
}
// 缩略图内容（卡片坐标系，原点在卡中心）
const THUMBS = [
  (c, w, h) => cover(c, 'E24', w, h),
  (c, w, h) => { c.fillStyle = '#efe6d2'; c.fillRect(-w / 2, -h / 2, w, h); Q.put(c, 'H06', 0, h * 0.44, h * 0.86, { ar: 1.35, shadow: false }); Q.tag(c, -18, -12, '哈哈哈', 1, { size: 30, hl: true, seed: 1003 }); },
  (c, w, h) => {
    c.fillStyle = '#efe6d2'; c.fillRect(-w / 2, -h / 2, w, h);
    c.save(); c.scale(0.62, 0.62);
    V5.phone(c, 0, 6, 150, 240, (cc, sw, sh) => { cc.fillStyle = '#f6f2ea'; cc.fillRect(0, 0, sw, sh); cc.font = '700 22px Sans'; cc.textBaseline = 'middle';
      for (let k = 0; k < 4; k++) { cc.fillStyle = '#ffffff'; cc.fillRect(8, 14 + k * 44, sw - 16, 36); cc.fillStyle = '#e0a526'; cc.fillText('★★★★★', 14, 32 + k * 44); } });
    c.restore();
  },
  (c, w, h) => cover(c, 'E25', w, h),
];
function card(c, k, x, y, s, a, rot) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  P.piece(c, CARDP, '#fbf7ee', { blur: 18, dy: 8 });
  c.save(); c.beginPath(); c.rect(-CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24); c.clip(); THUMBS[k](c, CARD_W - 24, CARD_H - 24); c.restore();
  c.restore();
}
function table(c, t, a0, done = -1) {
  for (let k = 0; k < 4; k++) {
    const p = pop(t, a0 + k * 0.15, 0.45);
    if (p <= 0.01) continue;
    c.save(); c.globalAlpha *= k <= done ? 0.45 : 1; card(c, k, CARD_X[k], CARD_Y + (1 - p) * 60, 1, clamp(p * 2), (k % 2 ? 1 : -1) * 0.03); c.restore();
  }
}
function s23(c, t) {
  push(c, t, L('023').t0, L('023').t1 + 0.3, 0.03, 960, 520, () => table(c, t, L('023').t0 - 0.2));
  Q.tag(c, 960, 820, '随处可见', pop(t, at('023', '随处可见')), { size: 70, hl: true, seed: 1002 });
}
// 第 k 个例子：先在桌上把第 k 张卡提起来，再从卡的位置放大到全屏，里面是这一句的完整画面
function flipIn(c, t, a, fn) {
  const k = ['024', '025', '026', '027'].findIndex(id => Math.abs(L(id).t0 - a) < 1e-6);
  const p = smooth(prog(t, a - 0.15, a + 0.55));
  if (p >= 1) return fn();
  table(c, t, -1e9, k - 1);
  const x = lerp(CARD_X[k], 960, p), y = lerp(CARD_Y, 540, p), w = lerp(CARD_W - 24, 1920, p), h = lerp(CARD_H - 24, 1080, p);
  c.save(); c.translate(x, y);
  P.piece(c, P.poly([[-w / 2 - 12, -h / 2 - 12], [w / 2 + 12, -h / 2 - 12], [w / 2 + 12, h / 2 + 12], [-w / 2 - 12, h / 2 + 12]]), '#fbf7ee', { blur: 24, dy: 10 });
  c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.clip();
  c.fillStyle = P.BG; c.fillRect(-w / 2, -h / 2, w, h);
  c.scale(w / 1920, h / 1080); c.translate(-960, -540); fn();
  c.restore();
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
const HEADS = [[0.10, 0.34], [0.20, 0.33], [0.29, 0.30], [0.64, 0.34], [0.74, 0.37], [0.86, 0.42]];   // 按新 E25 量的坐着的人
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
