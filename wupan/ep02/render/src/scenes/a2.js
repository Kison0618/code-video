// 故事一（下）006–012：电话 + 三张纸条 → 接线员 → 第五大道 → 裁缝盒 → 世界地图盖支票 → 三张工牌 → 通缉令 → 讲台
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const L = TL.L, at = TL.at;
const pop = X.pop;
const F = require('../filmclip');
// 电影片段（有文件才用）：009 银行兑支票，010 医生
const T09 = at('009', '兑伪造') - 0.3, FILM09 = F.use('film_bank', T09, L('010').t0 - 0.1);
const T10 = at('010', '医院') - 0.3, T10E = at('010', '儿科主管') + 0.9, FILM10 = F.use('film_doctor', T10, T10E);

// 电话线：从听筒弯到画外（006）或接到接线员（007）
function cord(ctx, a, b, p = 1) {
  const pts = []; for (let k = 0; k <= 60; k++) { const u = k / 60; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 120 + Math.sin(u * 40) * 6]); }
  const q = K.partial(pts, p); if (q.length < 2) return;
  ctx.save(); ctx.strokeStyle = '#3a2f26'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
}
// 006：左边转盘电话，线弯到画外；三张纸条依次贴上
function s06(ctx, t) {
  Q.put(ctx, 'G06', 470, 780, 520, { ar: 1.5 });
  cord(ctx, [700, 560], [W + 40, 420]);
  Q.tag(ctx, 1320, 300, '老机长', pop(t, at('006', '老机长')), { size: 66, rot: -0.04, seed: 61 });
  Q.tag(ctx, 1420, 500, '制服弄丢了', pop(t, at('006', '弄丢')), { size: 66, rot: 0.03, seed: 62 });
  Q.tag(ctx, 1300, 700, '几小时后起飞', pop(t, at('006', '几个小时')), { size: 66, rot: -0.02, seed: 63 });
}
// 007：电话另一头是总机接线员（先出人），旁边依次贴“等一下”“第五大道”（黄）“制服供应商”；不再画街道图
function s07a(ctx, t) {
  cord(ctx, [-40, 380], [560, 470]);
  const e = easeOut(prog(t, L('007').t0 - 0.1, L('007').t0 + 0.5));
  Q.put(ctx, 'G07', lerp(560, 700, e), 980, 820, { ar: 1.2, alpha: e });
  Q.tag(ctx, 1380, 270, '等一下', pop(t, at('007', '等一下')), { size: 62, rot: -0.03, seed: 71 });
  const a = at('007', '第五大道');
  Q.tag(ctx, 1450, 480, '第五大道', pop(t, a), { size: 76, hl: true, rot: -0.04, seed: 72 });
  const p = pop(t, at('007', '制服供应商'));
  if (p > 0.01) { Q.pin(ctx, 1290, 640); Q.tag(ctx, 1420, 700, '制服供应商', p, { size: 62, rot: 0.03, seed: 73 }); }
}
// 008：牛皮纸盒打开，G02 外套从盒里升起（只要外套，不要帽子）；袖口四道金杠用黄马克笔逐道描亮；吊牌“真的”
// 金杠在 G02 剪图里的位置（量自 _g02grid）：左袖 u 0.04–0.22，右袖 u 0.78–0.96，v 0.745 起每道隔 0.02，外低内高
const STRIPES = [0, 1, 2, 3].map(k => 0.748 + k * 0.021);
function s08(ctx, t) {
  const a = L('008').t0, op = easeInOut(prog(t, a, a + 0.9)), BX = 760;
  const kraft = (pts, col, seed) => P.piece(ctx, P.poly(P.jag(pts, 2, 14, seed)), col, { blur: 16, dy: 8 });
  // 盒盖向后翻开
  const lt = lerp(800, 600, op);
  kraft([[BX - 380, 800], [BX + 380, 800], [BX + 330, lt], [BX - 330, lt]], '#d9bb84', 81);
  kraft([[BX - 380, 800], [BX + 380, 800], [BX + 420, 880], [BX - 420, 880]], '#7d5e3c', 82);   // 盒内
  // 外套升起
  const GH = 780, by = lerp(1250, 990, easeOut(prog(t, a + 0.4, a + 1.6)));
  const c = Q.cut('G02');
  if (c) {
    const [x0, y0, x1, y1] = c.box, yc = y0 + (y1 - y0) * 0.17;
    Q.put(ctx, 'G02', BX, by, GH, { shadow: 0.6, clip: z => { z.beginPath(); z.rect(0, yc, 1e4, 1e4); z.clip(); } });
    const tb = at('008', '真正');
    STRIPES.forEach((v, k) => {
      const p = prog(t, tb + k * 0.28, tb + k * 0.28 + 0.35); if (p <= 0) return;
      const seg = (u0, u1, dv) => [Q.ptOf('G02', BX, by, GH, u0, v + dv, {}), Q.ptOf('G02', BX, by, GH, u1, v, {})];
      Q.marker(ctx, seg(0.045, 0.215, 0.012), p, { w: 15 });
      Q.marker(ctx, seg(0.955, 0.785, 0.012), p, { w: 15 });
    });
  } else Q.put(ctx, 'G02', BX, by, GH, { ar: 0.66 });
  kraft([[BX - 420, 880], [BX + 420, 880], [BX + 420, 1120], [BX - 420, 1120]], '#c9a46a', 83);  // 盒子前脸
  const p = pop(t, at('008', '真正') + 0.6);
  if (p > 0.01) X.priceTag(ctx, 1420, 560, '真的', { alpha: clamp(p * 1.5), t, s: 1.3, size: 60, rot: 0.1 });
}
// 009：旧世界地图，航线一段段画过去；每个落点盖一张 PAID 支票
const ROUTE = [[0.255, 0.39], [0.47, 0.33], [0.55, 0.47], [0.77, 0.36], [0.30, 0.62], [0.60, 0.70]];
function s09(ctx, t) {
  const MW = 1560, MH = 860, cx = W / 2, cy = 480;
  Q.sheet(ctx, 'G08', cx, cy, MW, MH, { seed: 91, label: '旧世界地图' });
  const pts = ROUTE.map(([u, v]) => [cx - MW / 2 + u * MW, cy - MH / 2 + v * MH]);
  const t0 = at('009', '满世界') - 0.2, t1 = L('009').t1 - 0.2, seg = (t1 - t0) / (pts.length - 1);
  ctx.save(); ctx.setLineDash([18, 14]); ctx.strokeStyle = Q.RUST; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let k = 0; k < pts.length - 1; k++) {
    const p = prog(t, t0 + k * seg, t0 + (k + 0.8) * seg); if (p <= 0) break;
    const [a, b] = [pts[k], pts[k + 1]], m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 90];
    const arc = []; for (let i = 0; i <= 30; i++) { const u = i / 30; arc.push([(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * m[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * m[1] + u * u * b[1]]); }
    const q = K.partial(arc, p); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.restore();
  for (let k = 1; k < pts.length; k++) {
    const ta = t0 + (k - 0.2) * seg, p = pop(t, ta, 0.3);
    if (p > 0.01) Q.cheque(ctx, pts[k][0], pts[k][1] + 10, 230, { alpha: clamp(p * 2), s: 0.7 + 0.3 * p, rot: (k % 2 ? -0.1 : 0.12), seed: k, paid: prog(t, ta + 0.15, ta + 0.55) });
  }
  // 电影银行片段：从下方滑上来压住地图，对上“兑伪造的支票”
  if (FILM09 && t > T09) {
    const e = easeOut(prog(t, T09, T09 + 0.6));
    F.draw(ctx, 'film_bank', t - T09, W / 2, lerp(H + 500, 470, e), 1300, { rot: 0.015, seed: 19 });
  }
}
// 010：三张工牌像发牌一样滑进来：同一张脸 + 不同小道具，职位写在工牌上
const face = (c, x, y, h) => Q.put(c, 'G03', x, y, h, { shadow: false, ar: 0.83 });
const PROPS = [
  (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#f7f7f2'; c.strokeStyle = '#6d6d6d'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(34, 30); c.lineTo(-34, 30); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#a8322a'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -24); c.lineTo(0, 8); c.moveTo(-16, -8); c.lineTo(16, -8); c.stroke(); c.restore(); },
  (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#5a3c26'; c.beginPath(); c.roundRect(-40, -22, 80, 54, 6); c.fill(); c.strokeStyle = '#3a2618'; c.lineWidth = 5; c.beginPath(); c.roundRect(-14, -34, 28, 14, 4); c.stroke(); c.fillStyle = '#c9a548'; c.fillRect(-6, -2, 12, 10); c.restore(); },
  (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#2f3b33'; c.fillRect(-44, -32, 88, 60); c.strokeStyle = '#8a6a44'; c.lineWidth = 5; c.strokeRect(-44, -32, 88, 60); c.strokeStyle = '#e8e4d8'; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, -10); c.lineTo(10, -10); c.moveTo(-30, 6); c.lineTo(24, 6); c.stroke(); c.restore(); },
];
function s10(ctx, t) {
  const lab = [['儿科主管', '儿科主管', '#7b2a24'], ['助理检察长', '州助理检察长', '#2f4a63'], ['大学老师', '大学老师', '#3d5a3a']];
  lab.forEach(([w, title, band], k) => {
    // 有医生片段时，第一张工牌等片段退场再进
    const ta = (k === 0 && FILM10 ? T10E - 0.1 : at('010', w) - 0.25), e = easeOut(prog(t, ta, ta + 0.55));
    if (e <= 0) return;
    const x = lerp(W + 300, 480 + k * 480, e), rot = lerp(0.5, (k - 1) * 0.07, e);
    Q.badge(ctx, x, 520 + Math.abs(k - 1) * 20, title, face, PROPS[k], { rot, band, seed: 40 + k });
  });
  if (FILM10 && t > T10 && t < T10E + 0.5) {
    const e = easeOut(prog(t, T10, T10 + 0.5)), out = easeInOut(prog(t, T10E - 0.2, T10E + 0.4));
    F.draw(ctx, 'film_doctor', t - T10, lerp(W / 2, -800, out), lerp(H + 500, 470, e), 1300, { rot: -0.015, seed: 23 });
    Q.tag(ctx, lerp(1500, -200, out), 160, '儿科主管', pop(t, at('010', '儿科主管')), { size: 66, rot: -0.03, seed: 24 });
  }
}
// 011：FBI 通缉令钉在软木墙上，贴着肖像；打字机滚出“26 国”“$2,000,000+”
function s11(ctx, t) {
  Q.cork(ctx);
  ctx.save(); ctx.translate(760, 480); ctx.scale(0.9, 0.9); ctx.rotate(-0.02);
  P.piece(ctx, P.poly(P.jag([[-380, -440], [380, -440], [380, 440], [-380, 440]], 2, 18, 111)), '#f1e7cf', { blur: 26, dy: 14 });
  ctx.fillStyle = Q.INK; ctx.font = '700 120px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FBI', 0, -350);
  ctx.fillRect(-330, -280, 660, 6);
  ctx.save(); ctx.beginPath(); ctx.rect(-200, -250, 400, 440); ctx.clip(); ctx.fillStyle = '#e4d8bf'; ctx.fillRect(-200, -250, 400, 440); face(ctx, 0, 196, 460); ctx.restore();
  ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(-200, -250, 400, 440);
  ctx.strokeStyle = 'rgba(60,45,30,0.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-320, 250 + k * 40); ctx.lineTo(320 - k * 60, 250 + k * 40); ctx.stroke(); }
  ctx.restore();
  Q.pin(ctx, 430, 100); Q.pin(ctx, 1090, 96);
  // 两张打字条
  const strip = (y, s, a, rot) => {
    const n = Q.typeN(t, a, 12); if (n <= 0) return;
    ctx.save(); ctx.translate(1500, y); ctx.rotate(rot);
    P.piece(ctx, P.poly(P.jag([[-300, -70], [300, -70], [300, 70], [-300, 70]], 1.5, 16, 113)), '#fbf6ea', { blur: 14, dy: 6 });
    Q.typed(ctx, s, 0, 26, 82, n, { align: 'center', color: '#2b2420' }); ctx.restore();
  };
  strip(360, '26 国'.replace('国', ''), at('011', '二十六') - 0.1, -0.03);
  if (Q.typeN(t, at('011', '二十六') + 0.2, 12) > 0) { ctx.save(); ctx.translate(1500, 360); ctx.rotate(-0.03); ctx.fillStyle = Q.INK; ctx.font = '700 70px Sans'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('国', 80, 52); ctx.restore(); }
  strip(560, '$2,000,000+', at('011', '两百多万') - 0.1, 0.02);
}
// 012：老年的他站在讲台后（不加白雾，人要看得清）；讲台挂牌“前骗子 · FBI 顾问”；台历一页页往上翻，停在“近 50 年”
const YRS = ['1976', '1985', '1994', '2003', '2012', '2020', '近 50 年'];
function deskCal(ctx, x, y, pg) {
  const w = 340, h = 320, n = YRS.length - 1, k = Math.min(n, Math.floor(pg)), f = k >= n ? 0 : pg - k;
  ctx.save(); ctx.translate(x, y);
  P.piece(ctx, P.poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]), '#f4ecdc', { blur: 16, dy: 8 });
  const face = (i, sy = 1) => {
    ctx.save(); ctx.scale(1, sy);
    ctx.fillStyle = '#f4ecdc'; ctx.fillRect(-w / 2, 0, w, h);
    ctx.fillStyle = Q.RUST; ctx.fillRect(-w / 2, 0, w, 70);
    const s = YRS[i]; ctx.fillStyle = Q.INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = s.length > 4 ? '900 76px Sans' : '700 104px Num'; ctx.fillText(s, 0, 190);
    ctx.restore();
  };
  ctx.translate(0, -h / 2);
  face(Math.min(n, k + 1));                 // 底下是下一页
  if (f < 0.98) {                           // 当前页从底边往上卷走（只压扁，不叠半透明，两页的字不会叠在一起）
    const sy = Math.cos(f * Math.PI / 2);
    ctx.save(); if (f > 0) { ctx.shadowColor = 'rgba(40,25,10,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; } face(k, sy); ctx.restore();
  }
  ctx.fillStyle = '#5a4634'; [-90, 90].forEach(dx => { ctx.beginPath(); ctx.arc(dx, 0, 9, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}
function s12(ctx, t) {
  Q.put(ctx, 'G10', 760, 960, 780, { ar: 0.66 });
  const p = pop(t, at('012', '前骗子'));
  Q.tag(ctx, 760, 860, '前骗子 · FBI 顾问', p, { size: 58, bg: Q.INK, color: '#fbf3df', rot: 0 });
  const a = at('012', '一讲就是') - 0.2, b = at('012', '将近') + 0.3;
  const n = YRS.length - 1, u = clamp((t - a) / (b - a)) * n;
  // 每页翻动只占 0.55，剩下时间停稳，避免一直在闪
  const k = Math.floor(u), pg = k + clamp((u - k) / 0.55);
  if (t > a - 0.3) X.popScale(ctx, 1500, 420, pop(t, a - 0.3), () => deskCal(ctx, 0, 0, u >= n ? n : pg));
}
// 故事一常驻小纸签（004 起到 012 末）
function over(ctx, t) {
  const a = at('004', '按他'), b = L('013').t0 - 0.25;
  if (t < a || t > b + 0.4) return;
  const al = 1 - smooth(prog(t, b, b + 0.4));
  Q.tag(ctx, 1640, 90, '按他自己的说法', pop(t, a) * al, { size: 40, rot: 0.02, seed: 44, bg: '#efe3c4' });
}

module.exports = {
  shots: [
    { a: L('006').t0 - 0.2, tr: 'slide', draw: s06, name: '006' },
    { a: L('007').t0 - 0.1, tr: 'slide', draw: s07a, name: '007' },
    { a: L('008').t0 - 0.15, tr: 'slide', draw: s08, name: '008' },
    { a: L('009').t0 - 0.15, tr: 'slide', draw: s09, name: '009' },
    { a: L('010').t0 - 0.1, tr: 'fade', draw: s10, name: '010' },
    { a: L('011').t0 - 0.15, tr: 'slide', draw: s11, name: '011' },
    { a: L('012').t0 - 0.5, gl: 'fanye', draw: s12, name: '012' },
  ],
  over,
};
