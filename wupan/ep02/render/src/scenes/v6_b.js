// 第二集 v5 · 故事二：北京海淀假“301 医生”（010–015）
//   010 撕纸转场 → 时间卡“北京 · 海淀” → 菜园采摘（H01）  011 讲台“医生”（H02）胸牌 301 → 把脉特写（H03）
//   012 “真专家”章 + 神药瓶一瓶瓶摞高（H04）  013 拟真微信群：编号病情逐条弹出，“老人有10万块钱”标红褐
//   014 价签“进价 3–5 元”“售价 100+ 元”+“普通食品”章 → 团伙里的一个人影撕开，露出挖掘机（H05）
//   015 空白执业证，一个大章“301 医院”把空白整个盖住
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const U = require('./v5_util');
const L = TL.L, at = TL.at;
const V = require("./v6_util");
const pop = V.pop;

// ———— 010：时间卡 + 菜园 ————
const T10 = at('018', '骗子最懂这一点');                        // 撕纸转场开始（配音 009 和 010 之间的停顿里）
function timeCard(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.02);
  P.piece(ctx, P.poly(P.jag([[-330, -95], [330, -95], [330, 95], [-330, 95]], 2.5, 16, 101)), Q.INK, { blur: 18, dy: 9 });
  ctx.strokeStyle = 'rgba(251,243,223,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(-305, -72, 610, 144);
  ctx.fillStyle = '#fbf3df'; ctx.font = '900 104px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('北京 · 海淀', 0, 6);
  ctx.restore();
}
function s10(ctx, t) {
  const tb = at('019', '一群老人') - 0.35, up = easeInOut(prog(t, tb, tb + 0.7));
  const e = easeOut(prog(t, tb + 0.1, tb + 0.8));
  if (e > 0.01) Q.sheet(ctx, 'H01', 860, lerp(H + 500, 570, e), 1300, 730, { seed: 103, label: '菜园采摘的老人' });
  timeCard(ctx, lerp(W / 2, 860, up), lerp(470, 140, up), lerp(1.25, 0.72, up));
  Q.tag(ctx, 1690, 380, '参观菜园', pop(t, at('019', '参观菜园')), { size: 60, rot: 0.03, seed: 104 });
  Q.tag(ctx, 1690, 560, '免费采摘', pop(t, at('019', '免费采摘')), { size: 60, hl: true, rot: -0.03, seed: 105 });
  Q.tag(ctx, 1690, 740, '健康讲座', pop(t, at('019', '健康讲座')), { size: 64, rot: 0.02, seed: 106 });
}
// ———— 011：讲台上的“医生”，胸牌“301 医院” → 把脉特写 ————
const T11B = at('020', '搭上') - 0.35;
function doctor(ctx, t, x, y, h, o = {}) {
  Q.put(ctx, 'H02', x, y, h, { ar: 0.7, ...o });
  // 胸牌：H02 剪影框里胸前左侧（量自 _H02 拼图），小纸牌 + 别针
  const [bx, by] = Q.ptOf('H02', x, y, h, o.badgeU || 0.62, o.badgeV || 0.40, { ar: 0.7 });
  return [bx, by];
}
function badge301(ctx, x, y, p, s = 1) {
  if (p <= 0.01) return;
  X.popScale(ctx, x, y, p, () => {
    ctx.scale(s, s); ctx.rotate(0.05);
    P.piece(ctx, P.poly([[-120, -50], [120, -50], [120, 50], [-120, 50]]), '#f8f6ee', { blur: 10, dy: 5 });
    ctx.fillStyle = '#2f5a8a'; ctx.fillRect(-120, -50, 240, 20);
    ctx.fillStyle = Q.INK; ctx.font = '900 48px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('301 医院', 0, 14);
  });
}
function s11(ctx, t) {
  const sh = easeInOut(prog(t, T11B, T11B + 0.7));
  const [bx, by] = doctor(ctx, t, lerp(760, 380, sh), 1000, lerp(880, 760, sh));
  badge301(ctx, bx, by, pop(t, at('020', '三零一') - 0.1), lerp(1.2, 1.0, sh));
  ctx.save(); ctx.globalAlpha = 1 - sh;
  Q.tag(ctx, 1460, 300, '自称', pop(t, at('020', '自称')), { size: 62, rot: -0.03, seed: 111 });
  Q.tag(ctx, 1460, 470, '301 医院的医生', pop(t, at('020', '医院的医生')), { size: 66, hl: true, rot: 0.02, seed: 112 });
  ctx.restore();
  const e = easeOut(prog(t, T11B + 0.1, T11B + 0.8));
  if (e > 0.01) Q.sheet(ctx, 'H03', lerp(W + 700, 1220, e), 450, 1080, 700, { seed: 113, rot: 0.015, label: '把脉' });
  Q.tag(ctx, 1000, 130, '问诊', pop(t, at('020', '问诊')), { size: 60, rot: -0.04, seed: 114 });
  Q.tag(ctx, 1500, 860, '一把脉', pop(t, at('020', '一把脉')), { size: 66, rot: 0.03, seed: 115 });
  Q.tag(ctx, 1000, 860, '说出了老人的病', pop(t, at('020', '说出了')), { size: 60, hl: true, rot: -0.02, seed: 116 });
}
// ———— 012：“真专家”章 + 神药瓶一瓶瓶摞高 ————
const BOTTLE = [0.0, 0.0, 0.47, 1.0];                     // H04 剪影框里左边的瓶子（右边是礼盒）
const STACK = [];                                          // 金字塔：底层 5 个，往上 4/3/2/1
for (let r = 0; r < 4; r++) for (let c = 0; c < 4 - r; c++) STACK.push([(c - (3 - r) / 2) * 140, -r * 215]);
function bottles(ctx, t, x, y, n, h = 220) {
  for (let k = 0; k < STACK.length; k++) {
    const p = clamp(n - k); if (p <= 0) break;
    const [dx, dy] = STACK[k];
    U.putPart(ctx, 'H04', x + dx, y + dy - (1 - easeOut(p)) * 120, h, BOTTLE, { alpha: clamp(p * 2) });
  }
}
function s12(ctx, t) {
  const [bx, by] = doctor(ctx, t, 380, 1000, 760);
  badge301(ctx, bx, by, 1);
  const ts = at('021', '真专家');
  X.stamp(ctx, 640, 300, '真专家', prog(t, ts - 0.1, ts + 0.3), { size: 96, rot: -0.12, seed: 121, color: Q.RUST });
  Q.tag(ctx, 420, 140, '信了', pop(t, at('021', '信了')), { size: 62, rot: 0.03, seed: 122 });
  const a = at('021', '几千') - 0.2, b = L('021').t1 + 0.2;
  bottles(ctx, t, 1230, 960, lerp(0, STACK.length, easeInOut(prog(t, a, b))));
  Q.tag(ctx, 1730, 680, '几千', pop(t, at('021', '几千')), { size: 70, rot: -0.04, seed: 123 });
  Q.tag(ctx, 1730, 450, '几万', pop(t, at('021', '几万')), { size: 80, hl: true, rot: 0.03, seed: 124 });
  Q.tag(ctx, 1230, 120, '“神药”', pop(t, at('021', '神药')), { size: 66, rot: -0.02, seed: 125 });
}
U.stampAt('真专家', at('021', '真专家') - 0.1 + 0.4 / 1.4);
// ———— 013：拟真微信群 ————
const MSGS = [['1号  高血压，腿脚不好', '#8c9a7e'], ['2号  糖尿病，睡不好觉', '#9a8478'], ['3号  心脏不好，常吃药', '#7e8c9a'], ['4号  老人有10万块钱', '#a07a5a']];
function s13(ctx, t) {
  Q.tag(ctx, 420, 260, '真相是', pop(t, L('022').t0), { size: 70, rot: -0.03, seed: 131 });
  Q.tag(ctx, 420, 450, '销售员', pop(t, at('022', '销售员')), { size: 62, rot: 0.02, seed: 132 });
  Q.tag(ctx, 420, 620, '闲聊里套出来', pop(t, at('022', '闲聊')), { size: 62, hl: true, rot: -0.02, seed: 133 });
  const e = easeOut(prog(t, L('022').t0 - 0.2, L('022').t0 + 0.4));
  const tm = [at('022', '编好号') - 0.1, at('022', '发进群') - 0.1, at('022', '有的还') - 0.2, at('022', '老人有') - 0.05];
  U.phone(ctx, 1240, lerp(1500, 480, e), 640, 800, (c, w, h) => {
    c.fillStyle = '#ededed'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f7f7f7'; c.fillRect(0, 0, w, 96); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 96, w, 2);
    c.fillStyle = '#1e1e1e'; c.font = '500 40px Sans'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('群聊', w / 2, 52);
    c.strokeStyle = '#1e1e1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(48, 36); c.lineTo(30, 52); c.lineTo(48, 68); c.stroke();
    c.fillStyle = '#1e1e1e'; [0, 1, 2].forEach(k => { c.beginPath(); c.arc(w - 70 + k * 18, 52, 4.5, 0, Math.PI * 2); c.fill(); });
    let y = 130;
    MSGS.forEach(([s, av], k) => {
      const p = prog(t, tm[k], tm[k] + 0.3), last = k === MSGS.length - 1;
      const hl = last ? smooth(prog(t, tm[k] + 0.3, tm[k] + 0.7)) : 0;
      const hgt = V.msg(c, 24, y, w - 24, s, p, { avatar: av, size: 38, bg: hl > 0.5 ? '#f3dfd3' : '#ffffff', color: hl > 0.5 ? Q.RUST : '#1e1e1e' });
      if (last && hl > 0.01) { c.save(); c.globalAlpha = hl; c.strokeStyle = Q.RUST; c.lineWidth = 5; c.beginPath(); c.roundRect(108, y - 6, w - 150, hgt + 12, 14); c.stroke(); c.restore(); }
      y += 130;
    });
    c.fillStyle = '#f7f7f7'; c.fillRect(0, h - 90, w, 90); c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(90, h - 70, w - 200, 50, 8); c.fill();
  });
}
// ———— 014 上：神药价签 + “普通食品”章 ————
const T14B = at('023', '团伙') - 0.3;
function s14a(ctx, t) {
  U.putPart(ctx, 'H04', 640, 960, 760, BOTTLE, {});
  const tp = at('023', '进价');
  Q.tag(ctx, 1320, 300, '进价 3–5 元', pop(t, tp), { size: 76, rot: -0.03, seed: 141, font: 'Sans' });
  Q.tag(ctx, 1320, 500, '售价 100+ 元', pop(t, tp + 0.8), { size: 64, rot: 0.02, seed: 142 });
  X.arrow(ctx, [1080, 300], [820, 420], prog(t, tp + 0.2, tp + 0.6), Q.INK, 6, 0.2);
  const ts = at('023', '普通食品');
  X.stamp(ctx, 1320, 740, '普通食品', prog(t, ts - 0.1, ts + 0.3), { size: 96, rot: -0.1, seed: 143, color: Q.RUST });
  Q.tag(ctx, 640, 120, '“神药”', pop(t, L('023').t0), { size: 64, rot: 0.03, seed: 144 });
}
U.stampAt('普通食品', at('023', '普通食品') - 0.1 + 0.4 / 1.4);
// ———— 014 下：讲台上的“医生”+ 团伙里的人影；其中一个人影撕开，露出挖掘机 ————
// 事实边界：“以前是开挖掘机的”是团伙里的一个人，不是讲师本人 —— 撕开的是讲师旁边的团伙人影
const SPLIT = (() => { const r = K.mulberry32(140), pts = []; for (let k = 0; k <= 24; k++) pts.push([(r() - 0.5) * 26, k / 24]); return pts; })();
// 团伙成员卡：米色纸卡 + 头肩剪影（H02 去掉举起的手和讲台）
const BUST = [0.28, 0.0, 1.0, 0.46];
const MW = 360, MH = 470;
function mugCard(ctx, x, y, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = P.poly(P.jag([[-MW / 2, -MH / 2], [MW / 2, -MH / 2], [MW / 2, MH / 2], [-MW / 2, MH / 2]], 2, 16, seed));
  P.piece(ctx, p, '#e6dcc6', { blur: 18, dy: 9 });
  ctx.save(); ctx.clip(p); ctx.fillStyle = '#cfc4ad'; ctx.fillRect(-MW / 2 + 24, -MH / 2 + 24, MW - 48, MH - 110);
  ctx.beginPath(); ctx.rect(-MW / 2 + 24, -MH / 2 + 24, MW - 48, MH - 110); ctx.clip();
  U.putPart(ctx, 'H02', 0, MH / 2 - 86, MH - 150, BUST, { sil: true, shadow: false });
  ctx.restore();
  ctx.fillStyle = 'rgba(35,27,21,0.5)'; ctx.fillRect(-MW / 2 + 40, MH / 2 - 60, MW - 80, 6); ctx.fillRect(-MW / 2 + 40, MH / 2 - 38, MW - 160, 6);
  ctx.restore();
}
function s14b(ctx, t) {
  const te = at('023', '挖掘机') - 0.2, op = easeInOut(prog(t, te, te + 0.7));
  const [bx, by] = doctor(ctx, t, 360, 1000, 700);
  badge301(ctx, bx, by, 1, 0.9);
  // 挖掘机在后面，人影卡撕开后露出来
  if (op > 0.01) Q.put(ctx, 'H05', 1470, 800, 400, { alpha: clamp(op * 2) });
  mugCard(ctx, 880, lerp(H + 400, 520, easeOut(prog(t, T14B, T14B + 0.5))), -0.04, 147);
  const sx = 1380, sy = lerp(H + 400, 520, easeOut(prog(t, T14B + 0.15, T14B + 0.65)));
  for (const side of [-1, 1]) {
    const d = op * 560 * side;
    ctx.save(); ctx.globalAlpha = 1 - smooth(prog(op, 0.55, 1));
    ctx.translate(sx + d, sy + op * 140); ctx.rotate(op * 0.35 * side);
    // 沿锯齿竖线裁成左右两半（卡片自己的坐标系）
    ctx.beginPath(); ctx.moveTo(side * MW, -MH); SPLIT.forEach(([dx, v]) => ctx.lineTo(dx, -MH / 2 - 20 + (MH + 40) * v)); ctx.lineTo(side * MW, MH); ctx.closePath(); ctx.clip();
    mugCard(ctx, 0, 0, 0.03, 148);
    ctx.restore();
  }
  Q.tag(ctx, 1130, 130, '团伙里的一个人', pop(t, at('023', '团伙')), { size: 64, rot: -0.02, seed: 145 });
  Q.tag(ctx, 1380, 330, '以前是开挖掘机的', pop(t, at('023', '开挖掘机') + 0.3), { size: 70, hl: true, rot: 0.03, seed: 146 });
}// ———— 015：空白执业证 + 大章“301 医院” ————
function license(ctx, x, y, a) {
  if (a <= 0.01) return;
  const w = 1000, h = 640;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(-0.02);
  P.piece(ctx, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 1.6, 18, 151)), '#f1e6c9', { blur: 24, dy: 12 });
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 5; ctx.strokeRect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48);
  ctx.fillStyle = Q.INK; ctx.font = '900 72px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('执 业 证', 0, -h / 2 + 90);
  ctx.setLineDash([14, 12]); ctx.strokeStyle = 'rgba(80,60,40,0.75)'; ctx.lineWidth = 4;
  ctx.strokeRect(-w / 2 + 70, -h / 2 + 170, 240, 320);
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 370, -h / 2 + 220 + k * 80); ctx.lineTo(w / 2 - 70, -h / 2 + 220 + k * 80); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.restore();
}
function s15(ctx, t) {
  license(ctx, 960, 470, easeOut(prog(t, L('024').t0 - 0.2, L('024').t0 + 0.3)));
  const tq = at('024', '执业证');

  const ts = at('024', '三零一');
  X.stamp(ctx, 960, 470, '301 医院', prog(t, ts - 0.15, ts + 0.35), { size: 210, rot: -0.1, seed: 152, color: Q.RUST });
  V.verdict(ctx,t,'024','你的执业证呢？',tq,960,850,72);
}
U.stampAt('301 医院', at('024', '三零一') - 0.15 + 0.5 / 1.4, 'mid');

module.exports = {
  shots: [
    { a: T10, gl: 'sizhi', draw: s10, name: '019' },
    { a: L('020').t0 - 0.2, tr: 'slide', draw: s11, name: '020' },
    { a: L('021').t0 - 0.2, tr: 'slide', draw: s12, name: '021' },
    { a: L('022').t0 - 0.2, tr: 'slide', draw: s13, name: '022' },
    { a: L('023').t0 - 0.2, tr: 'slide', draw: s14a, name: '023a' },
    { a: T14B, tr: 'fade', draw: s14b, name: '023b' },
    { a: L('024').t0 - 0.2, tr: 'slide', draw: s15, name: '024' },
  ],
};
