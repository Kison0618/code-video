// 第二集 v5 · 开头 + 故事一 + 机制（001–009）
//   001 电影机场铺满 → 002 定格退成照片 + 铜版画人脑裂缝 → 003 章节卡 No.3 → 004 档案卡/场记板 → G02 机长制服
//   005 电影银行 + 支票 PAID → 世界地图航线 → 006 电影医生 → 两张工牌 → 007 一堆证物 + 大问号
//   008 原始部落（H07）→ 人脑 + 代码卡 IF 权威说 → 照做 → 009 “说话的是谁”标黄、“说的对不对”划掉
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const C = require('../card');
const CUT = require('../cutout');
const F = require('../filmclip');
const U = require('./v5_util');
const L = TL.L, at = TL.at;
const pop = X.pop;

// ———— 001：电影机场镜头铺满，两张纸签依次贴上 ————
const T2 = L('002').t0;
F.use('film_airport', 0, T2);
function s01(ctx, t) {
  if (F.has('film_airport')) F.full(ctx, 'film_airport', Math.min(t, T2), { k: 1.0 + 0.05 * smooth(prog(t, 0, T2)), cx: 0.62, cy: 0.35 });
  else Q.sheet(ctx, 'G04', W / 2, H / 2, W, H, { seed: 3 });
  Q.tag(ctx, 470, 300, '十六岁', pop(t, at('001', '十六岁')), { size: 92, hl: true, rot: -0.04, seed: 11 });
  Q.tag(ctx, 560, 470, '没开过一天飞机', pop(t, at('001', '没开过')), { size: 70, rot: 0.02, seed: 12 });
}
// ———— 002：定格，往后退成一张照片；右边铜版画人脑，脑中裂缝亮黄 ————
const CRACK = [[0.34, 0.05], [0.40, 0.13], [0.37, 0.19], [0.46, 0.25], [0.43, 0.31], [0.52, 0.38]];
function crack(ctx, map, p, glow) {
  if (p <= 0.01) return;
  const pts = K.partial(CRACK.map(([u, v]) => map(u, v)), easeOut(p));
  if (pts.length < 2) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); };
  if (glow > 0.01) { ctx.shadowColor = `rgba(255,200,40,${0.95 * glow})`; ctx.shadowBlur = 40; path(); ctx.strokeStyle = `rgba(244,198,61,${glow})`; ctx.lineWidth = 26; ctx.stroke(); ctx.shadowColor = 'transparent'; }
  path(); ctx.strokeStyle = '#2a1d12'; ctx.lineWidth = 9; ctx.stroke();
  path(); ctx.strokeStyle = `rgba(255,236,150,${glow})`; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}
function s02(ctx, t) {
  const z = easeInOut(prog(t, T2, T2 + 1.2));
  const w = lerp(W + 60, 820, z), x = lerp(W / 2, 560, z), y = lerp(H / 2, 470, z);
  if (z < 0.01) { s01(ctx, t); return; }
  F.draw(ctx, 'film_airport', T2, x, y, w, { rot: -0.03 * z, seed: 21, border: 22 * z });
  // “不是假证件”：纸签 + 红褐色划掉
  const pf = pop(t, at('002', '假证件'));
  if (pf > 0.01) {
    Q.tag(ctx, 560, 830, '假证件', pf, { size: 66, rot: -0.02, seed: 22 });
    U.strike(ctx, 440, 836, 680, 822, prog(t, at('002', '假证件') + 0.3, at('002', '假证件') + 0.7));
  }
  // 人脑从右边进来
  const e = easeOut(prog(t, at('002', '你大脑') - 0.5, at('002', '你大脑') + 0.3));
  if (e > 0.01) {
    const map = B.head(ctx, { x: lerp(2300, 1430, e), y: 1000, h: 860, glass: 0.0 });
    const tc = at('002', '漏洞');
    crack(ctx, map, prog(t, tc - 0.35, tc + 0.25), smooth(prog(t, tc, tc + 0.4)));
    if (t > tc) Q.tag(ctx, 1650, 160, '漏洞', pop(t, tc + 0.1), { size: 80, hl: true, rot: 0.04, seed: 23 });
  }
}
// ———— 003：章节卡 No.3 权威误导；芒格版画；“一身制服”“一个头衔” → “跳过核实” ————
const MUNGER = CUT.has('eng_munger') ? CUT.get('eng_munger') : null;
const NO = P.poly(P.jag([[0, 0], [250, 0], [250, 130], [0, 130]], 3, 14, 63));
const TITLE = P.poly(P.jag([[0, 0], [880, 0], [880, 200], [0, 200]], 3, 16, 64));
function s03(ctx, t) {
  const a = L('003').t0, tk = at('003', '权威误导');
  if (MUNGER) {
    const e = easeOut(prog(t, a - 0.1, a + 0.5));
    CUT.place(ctx, MUNGER, lerp(-300, 330, e), 900, 600, {});
    X.nameTag(ctx, lerp(-300, 330, e), 860, '芒格', pop(t, at('003', '芒格')));
  }
  const slam = u => 1 + (1 - easeOut(u)) * 0.5;
  const q = prog(t, tk - 0.25, tk + 0.05), q2 = prog(t, tk, tk + 0.25);
  if (q > 0.01) {
    ctx.save(); ctx.globalAlpha = clamp(q * 3); ctx.translate(820, 230); ctx.rotate(-0.07); ctx.scale(slam(q), slam(q)); ctx.translate(-125, -65);
    P.piece(ctx, NO, Q.INK, { blur: 14, dy: 7 });
    ctx.fillStyle = '#fff6e6'; ctx.font = '700 104px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('No.3', 125, 70);
    ctx.restore();
  }
  if (q2 > 0.01) {
    ctx.save(); ctx.globalAlpha = clamp(q2 * 3); ctx.translate(1290, 380); ctx.rotate(0.02); ctx.scale(slam(q2), slam(q2)); ctx.translate(-440, -100);
    P.piece(ctx, TITLE, Q.CREAM, { blur: 16, dy: 8 });
    ctx.fillStyle = Q.INK; ctx.font = '900 132px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('权威误导', 440, 104);
    ctx.restore();
  }
  const t1 = at('003', '一身制服'), t2 = at('003', '一个头衔'), t3 = at('003', '跳过核实');
  Q.tag(ctx, 900, 640, '一身制服', pop(t, t1), { size: 64, rot: -0.03, seed: 31 });
  Q.tag(ctx, 900, 800, '一个头衔', pop(t, t2), { size: 64, rot: 0.02, seed: 32 });
  const pa = prog(t, at('003', '就能') - 0.1, t3 + 0.1);
  X.arrow(ctx, [1060, 640], [1390, 700], pa, Q.RUST, 9, 0.12);
  X.arrow(ctx, [1060, 800], [1390, 740], pa, Q.RUST, 9, -0.12);
  Q.tag(ctx, 1590, 720, '跳过核实', pop(t, t3), { size: 74, hl: true, rot: -0.02, seed: 33 });
}
// ———— 004：档案卡 + 场记板（猫鼠游戏 2002）→ 档案卡退到左边，G02 机长制服从右下升起 ————
function archive(ctx, t, typedAt) {
  ctx.save(); ctx.translate(820, 500); ctx.rotate(-0.025);
  P.piece(ctx, P.poly(P.jag([[-560, -330], [560, -330], [560, 330], [-560, 330]], 2, 18, 13)), Q.KRAFT, { blur: 24, dy: 12 });
  ctx.fillStyle = '#cfb27c'; ctx.fillRect(-560, -330, 1120, 70);
  ctx.strokeStyle = 'rgba(90,60,30,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-40, -140 + k * 70); ctx.lineTo(500, -140 + k * 70); ctx.stroke(); }
  ctx.save(); ctx.translate(-300, 30); ctx.rotate(0.03);
  P.piece(ctx, P.poly([[-200, -250], [200, -250], [200, 250], [-200, 250]]), '#f4ecdc', { blur: 14, dy: 6 });
  ctx.save(); ctx.beginPath(); ctx.rect(-180, -230, 360, 460); ctx.clip(); Q.put(ctx, 'G03', 0, 236, 470, { shadow: false, ar: 0.83, label: '阿巴格内尔' }); ctx.restore();
  ctx.restore();
  Q.clip(ctx, -330, -310, 1.1, -0.1);
  Q.typed(ctx, 'FRANK W. ABAGNALE', -40, -170, 56, typedAt == null ? 99 : Q.typeN(t, typedAt, 14));
  ctx.restore();
}
function s04(ctx, t) {
  const tg = at('004', '他弄到') - 0.2, sh = easeInOut(prog(t, tg, tg + 0.7));
  ctx.save(); ctx.translate(-330 * sh, 40 * sh); ctx.translate(820, 500); ctx.scale(1 - 0.22 * sh, 1 - 0.22 * sh); ctx.translate(-820, -500);
  archive(ctx, t, at('004', '阿巴格内尔') - 0.2);
  ctx.restore();
  const q = easeOut(prog(t, at('004', '电影') - 0.1, at('004', '电影') + 0.6)), out = easeIn(prog(t, tg, tg + 0.5));
  if (q > 0.01) Q.clapper(ctx, lerp(2200, 1470, q) + out * 900, 690, 520, prog(t, at('004', '猫鼠'), at('004', '猫鼠') + 0.35), ['猫鼠游戏', '2002'], { rot: 0.1 });
  const e = easeOut(prog(t, tg + 0.2, tg + 1.1));
  if (e > 0.01) Q.put(ctx, 'G02', 1430, lerp(1500, 1010, e), 820, { ar: 0.66, rot: 0.02 });
  Q.tag(ctx, 1450, 170, '泛美机长制服', pop(t, at('004', '泛美')), { size: 66, hl: true, rot: 0.03, seed: 41 });
}
// ———— 005 上：电影银行镜头 + 支票盖 PAID ————
const T5 = L('005').t0 - 0.2, T5B = at('005', '航空公司') - 0.25;
F.use('film_bank', T5, T5B + 0.3);
function s05a(ctx, t) {
  const e = easeOut(prog(t, T5, T5 + 0.6));
  if (F.has('film_bank')) F.draw(ctx, 'film_bank', t - T5, 820, lerp(H + 500, 470, e), 1260, { rot: -0.015, seed: 51 });
  else Q.sheet(ctx, 'G05', 820, 470, 1260, 709, { seed: 51 });
  Q.tag(ctx, 1620, 330, '不查支票', pop(t, at('005', '不查支票')), { size: 64, rot: 0.03, seed: 52 });
  const tp = at('005', '就给钱'), pc = pop(t, tp - 0.35, 0.3);
  if (pc > 0.01) Q.cheque(ctx, 1560, 640, 520, { alpha: clamp(pc * 2), s: 0.7 + 0.3 * pc, rot: 0.08, seed: 53, paid: prog(t, tp, tp + 0.4) });
}
U.stampAt('PAID', at('005', '就给钱') + 0.4 / 1.4, 'minor');
// ———— 005 下：世界地图，航线一段段画过去；“驾驶舱”“免费” ————
const ROUTE = [[0.255, 0.39], [0.47, 0.33], [0.55, 0.47], [0.77, 0.36], [0.30, 0.62], [0.60, 0.70]];
function s05b(ctx, t) {
  const MW = 1500, MH = 830, cx = W / 2 - 40, cy = 470;
  Q.sheet(ctx, 'G08', cx, cy, MW, MH, { seed: 91, label: '旧世界地图' });
  const pts = ROUTE.map(([u, v]) => [cx - MW / 2 + u * MW, cy - MH / 2 + v * MH]);
  const t0 = at('005', '满世界') - 0.3, t1 = L('005').t1 + 0.3, seg = (t1 - t0) / (pts.length - 1);
  ctx.save(); ctx.setLineDash([18, 14]); ctx.strokeStyle = Q.RUST; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let k = 0; k < pts.length - 1; k++) {
    const p = prog(t, t0 + k * seg, t0 + (k + 0.8) * seg); if (p <= 0) break;
    const [a, b] = [pts[k], pts[k + 1]], m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 90];
    const q = K.partial(X.bez(a, m, b, 30), p); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.restore();
  for (let k = 0; k < pts.length; k++) { const p = pop(t, t0 + (k - 0.2) * seg, 0.25); if (p > 0.01) { ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = Q.RUST; ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], 12, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
  Q.put(ctx, 'G02', 1640, 900, 420, { ar: 0.66, rot: 0.04, alpha: pop(t, at('005', '驾驶舱') - 0.3) });
  Q.tag(ctx, 1640, 420, '驾驶舱', pop(t, at('005', '驾驶舱')), { size: 64, rot: -0.03, seed: 54 });
  Q.tag(ctx, 300, 200, '免费', pop(t, at('005', '免费')), { size: 70, hl: true, rot: -0.05, seed: 55 });
}
// ———— 006：电影医生镜头 → 两张工牌（儿科主管、州助理检察长） ————
const T6 = L('006').t0 - 0.2, T6E = at('006', '换一身') - 0.2;
F.use('film_doctor', T6, T6E + 0.5);
const face = (c, x, y, h) => Q.put(c, 'G03', x, y, h, { shadow: false, ar: 0.83 });
const PROPS = [
  (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#f7f7f2'; c.strokeStyle = '#6d6d6d'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(34, 30); c.lineTo(-34, 30); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#a8322a'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -24); c.lineTo(0, 8); c.moveTo(-16, -8); c.lineTo(16, -8); c.stroke(); c.restore(); },
  (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#5a3c26'; c.beginPath(); c.roundRect(-40, -22, 80, 54, 6); c.fill(); c.strokeStyle = '#3a2618'; c.lineWidth = 5; c.beginPath(); c.roundRect(-14, -34, 28, 14, 4); c.stroke(); c.fillStyle = '#c9a548'; c.fillRect(-6, -2, 12, 10); c.restore(); },
];
const BADGES = [['儿科主管', '#7b2a24'], ['州助理检察长', '#2f4a63']];
function badges(ctx, t, ts, pos) {
  BADGES.forEach(([title, band], k) => {
    const e = easeOut(prog(t, ts[k], ts[k] + 0.55)); if (e <= 0) return;
    const [x, y, r] = pos[k];
    Q.badge(ctx, lerp(W + 300, x, e), y, title, face, PROPS[k], { rot: lerp(0.5, r, e), band, seed: 40 + k });
  });
}
function s06(ctx, t) {
  const tb = [T6E + 0.15, at('006', '州助理检察长') - 0.3];
  badges(ctx, t, tb, [[700, 520, -0.06], [1220, 540, 0.05]]);
  if (F.has('film_doctor') && t < T6E + 0.6) {
    const e = easeOut(prog(t, T6, T6 + 0.5)), out = easeInOut(prog(t, T6E - 0.1, T6E + 0.5));
    F.draw(ctx, 'film_doctor', t - T6, lerp(W / 2 - 80, -900, out), lerp(H + 500, 470, e), 1260, { rot: -0.015, seed: 61 });
    Q.tag(ctx, lerp(1600, -300, out), 170, '白大褂', pop(t, at('006', '白大褂')), { size: 62, rot: -0.03, seed: 62 });
    Q.tag(ctx, lerp(1580, -300, out), 330, '儿科主管', pop(t, at('006', '儿科主管')), { size: 70, hl: true, rot: 0.02, seed: 63 });
  }
  Q.tag(ctx, 1600, 200, '西装', pop(t, at('006', '西装')), { size: 60, rot: 0.04, seed: 64 });
}
// ———— 007：工牌、支票、制服堆在一起，一个大红褐色问号盖下去 ————
function s07(ctx, t) {
  const a = L('007').t0 - 0.1, f = k => easeOut(prog(t, a + k * 0.12, a + k * 0.12 + 0.45));
  Q.put(ctx, 'G02', 960, lerp(1500, 1000, f(0)), 760, { ar: 0.66, rot: -0.05 });
  Q.cheque(ctx, lerp(-300, 420, f(1)), 700, 440, { rot: -0.18, seed: 71, paid: 1 });
  Q.cheque(ctx, lerp(W + 300, 1520, f(2)), 760, 420, { rot: 0.14, seed: 72, paid: 1 });
  Q.badge(ctx, lerp(-300, 470, f(3)), 360, '儿科主管', face, PROPS[0], { rot: -0.12, band: BADGES[0][1], seed: 40 });
  Q.badge(ctx, lerp(W + 300, 1460, f(4)), 380, '州助理检察长', face, PROPS[1], { rot: 0.1, band: BADGES[1][1], seed: 41 });
  const tq = at('007', '回头'), p = prog(t, tq - 0.1, tq + 0.35);
  if (p > 0.01) { const s = lerp(2.2, 1, easeIn(clamp(p * 1.3))); ctx.save(); ctx.translate(960, 450); ctx.scale(s, s); X.mark(ctx, 0, 0, 560, '?', clamp(p * 2) * 0.92, Q.RUST); ctx.restore(); }
  Q.tag(ctx, 960, 850, '他到底是谁', pop(t, at('007', '他到底')), { size: 76, hl: true, rot: -0.02, seed: 73 });
}
U.stampAt('?', at('007', '回头') - 0.1 + 0.45 / 1.3, 'minor');
// ———— 008 上：铜版画原始部落，首领在前，族人跟随 ————
function s08a(ctx, t) {
  const a = L('008').t0, k = 1 + 0.06 * smooth(prog(t, a, at('008', '服从权威')));
  ctx.save(); ctx.translate(W / 2, 470); ctx.scale(k, k); ctx.translate(-W / 2, -470);
  Q.sheet(ctx, 'H07', W / 2, 470, 1400, 840, { seed: 81, label: '原始部落' });
  ctx.restore();
  Q.tag(ctx, 1010, 120, '首领', pop(t, at('008', '首领')), { size: 70, hl: true, rot: -0.03, seed: 82 });
  Q.tag(ctx, 1640, 760, '活得更久', pop(t, at('008', '活得更久')), { size: 64, rot: 0.03, seed: 83 });
}
// ———— 008 下 + 009：人脑 + 代码卡 ————
const RULE = 'IF 权威说 → 照做';
function sHead(ctx, t) {
  const a = at('008', '服从权威') - 0.3, e = easeOut(prog(t, a, a + 0.6));
  const map = B.head(ctx, { x: lerp(-400, 470, e), y: 1000, h: 860, glass: smooth(prog(t, a + 0.3, a + 0.9)) * 0.9 });
  const tc = at('008', '代码') - 0.4, cp = pop(t, tc, 0.45);
  const [hx, hy] = map(0.55, 0.22);
  if (cp > 0.01) {
    ctx.save(); ctx.globalAlpha = cp; ctx.setLineDash([12, 12]); ctx.strokeStyle = 'rgba(80,55,30,0.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + 200, hy - 120, 900, 330); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(hx, hy, 12, 0, Math.PI * 2); ctx.fillStyle = Q.RUST; ctx.globalAlpha = cp; ctx.fill(); ctx.globalAlpha = 1;
  }
  // 009：代码一启动——卡片闪一下黄光
  const ts = at('009', '启动'), glow = vis(t, ts, ts + 1.2);
  if (glow > 0.01) { const g = ctx.createRadialGradient(1340, 330, 50, 1340, 330, 560); g.addColorStop(0, `rgba(255,214,90,${0.5 * glow})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.fillRect(700, 0, 1220, 700); }
  X.popScale(ctx, 1340, 330, cp, () => B.ruleCard(ctx, 0, 0, RULE, 64, { n: Q.typeN(t, tc + 0.15, 16), seed: 84 }));
  // 008 末：“底层代码”；009 开始后让位
  const out = smooth(prog(t, L('009').t0 - 0.1, L('009').t0 + 0.3));
  ctx.save(); ctx.globalAlpha = 1 - out; Q.tag(ctx, 1340, 560, '底层代码', pop(t, at('008', '底层代码')), { size: 66, rot: 0.02, seed: 85 }); ctx.restore();
  // 009：“说话的是谁”标黄，“说的对不对”被划掉
  const t1 = at('009', '说话的是谁'), t2 = at('009', '说的对不对');
  const w1 = Q.tag(ctx, 1340, 590, '说话的是谁', pop(t, t1), { size: 76, hl: true, rot: -0.02, seed: 86 });
  Q.tag(ctx, 1340, 780, '说的对不对', pop(t, t2), { size: 70, rot: 0.02, seed: 87 });
  U.strike(ctx, 1150, 792, 1530, 770, prog(t, t2 + 0.35, t2 + 0.75));
}
const vis = (t, a, b) => K.vis(t, a, b, 0.25, 0.6);

module.exports = {
  shots: [
    { a: 0, tr: 'cut', draw: s01, name: '001', photoSubs: t => t < T2 + 0.6 },
    { a: T2, tr: 'cut', draw: s02, name: '002' },
    { a: L('003').t0 - 0.25, tr: 'slide', draw: s03, name: '003' },
    { a: L('004').t0 - 0.2, tr: 'slide', draw: s04, name: '004' },
    { a: T5, tr: 'slide', draw: s05a, name: '005a' },
    { a: T5B, tr: 'slide', draw: s05b, name: '005b' },
    { a: T6, tr: 'slide', draw: s06, name: '006' },
    { a: L('007').t0 - 0.15, tr: 'fade', draw: s07, name: '007' },
    { a: L('008').t0 - 0.2, tr: 'slide', draw: s08a, name: '008a' },
    { a: at('008', '服从权威') - 0.3, tr: 'fade', draw: sHead, name: '008b' },
  ],
  archive, face, PROPS, BADGES, RULE,
};
