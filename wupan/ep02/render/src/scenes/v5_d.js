// 第二集 v5 · 反转 + 三条用法 + 收尾（023–031）
//   023 翻页回到档案卡  024 档案卡翻面：监狱记录表，一格格打上“在押”；泛美声明剪报“从来没有这回事”
//   025 讲台照（G10）“前骗子 · FBI 顾问” + 电影海报式剪纸 + 问号  026 推到画面中间一个“你”字
//   027 代码卡 + 三张空便签  028–030 三张便签依次写上  031 印章“误判”落下，问题字幕停留
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const F = require('../filmclip');
const U = require('./v5_util');
const A = require('./v5_a');
const L = TL.L, at = TL.at;
const pop = X.pop;

// ———— 023–024：档案卡，翻面是监狱记录 ————
const TF = at('024', '翻出') - 0.3;                       // 翻面开始
// 记录表：5 行（16–20 岁）× 4 列（季度），大部分格子被打上“在押”（不对应具体年份，只表示“大部分时间”）
const JAIL = [[0, 1, 1, 1], [1, 1, 0, 1], [1, 1, 1, 1], [0, 1, 1, 1], [1, 1, 1, 0]];
function record(ctx, t, x, y) {
  const w = 1120, h = 660;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.025);
  P.piece(ctx, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 2, 18, 231)), '#e9e1cf', { blur: 24, dy: 12 });
  ctx.fillStyle = '#b9ad94'; ctx.fillRect(-w / 2, -h / 2, w, 80);
  ctx.fillStyle = Q.INK; ctx.font = '900 54px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('监狱档案', 0, -h / 2 + 42);
  const gx = -w / 2 + 200, gy = -h / 2 + 120, cw = (w - 250) / 4, rh = 100;
  ctx.strokeStyle = 'rgba(60,45,30,0.6)'; ctx.lineWidth = 3;
  for (let r = 0; r <= 5; r++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 50, gy + r * rh); ctx.lineTo(gx + 4 * cw, gy + r * rh); ctx.stroke(); }
  for (let c = 0; c <= 4; c++) { ctx.beginPath(); ctx.moveTo(gx + c * cw, gy); ctx.lineTo(gx + c * cw, gy + 5 * rh); ctx.stroke(); }
  ctx.font = '700 46px Sans'; ctx.fillStyle = Q.INK;
  for (let r = 0; r < 5; r++) ctx.fillText(`${16 + r} 岁`, -w / 2 + 125, gy + r * rh + rh / 2 + 2);
  const t0 = at('024', '满世界') - 0.1, t1 = at('024', '坐牢') + 0.2;
  const cells = []; JAIL.forEach((row, r) => row.forEach((v, c) => { if (v) cells.push([r, c]); }));
  cells.forEach(([r, c], k) => {
    const ta = lerp(t0, t1, k / cells.length);
    X.stamp(ctx, gx + c * cw + cw / 2, gy + r * rh + rh / 2, '在押', prog(t, ta, ta + 0.25), { size: 40, rot: (k % 3 - 1) * 0.08, seed: 240 + k, color: Q.RUST });
  });
  ctx.restore();
}
function s23(ctx, t) {
  const f = prog(t, TF, TF + 0.6), sx = Math.abs(Math.cos(f * Math.PI));
  ctx.save(); ctx.translate(820, 500); ctx.scale(Math.max(0.02, sx), 1); ctx.translate(-820, -500);
  if (f < 0.5) A.archive(ctx, t, null);
  else { ctx.translate(820, 500); ctx.scale(0.92, 0.92); ctx.translate(-820, -500); record(ctx, t, 760, 500); }
  ctx.restore();
  Q.tag(ctx, 1560, 160, '回到阿巴格内尔', pop(t, at('023', '回到')) * (1 - smooth(prog(t, TF, TF + 0.3))), { size: 56, rot: 0.03, seed: 232 });
  Q.tag(ctx, 1600, 170, '2020 · 调查书', pop(t, at('024', '二零二零')), { size: 58, rot: 0.03, seed: 233 });
  Q.tag(ctx, 1600, 330, '大部分时间在坐牢', pop(t, at('024', '大部分')), { size: 52, hl: true, rot: -0.02, seed: 234 });
  // 泛美声明剪报
  const tp = at('024', '泛美航空') - 0.2, e = easeOut(prog(t, tp, tp + 0.6));
  if (e > 0.01) {
    ctx.save(); ctx.translate(lerp(W + 500, 1550, e), 650); ctx.rotate(0.05); ctx.scale(0.86, 0.86);
    P.piece(ctx, P.poly(P.jag([[-400, -230], [400, -230], [400, 230], [-400, 230]], 5, 14, 235)), '#ede1c2', { blur: 22, dy: 10 });
    ctx.fillStyle = 'rgba(60,45,25,0.8)'; ctx.fillRect(-360, -200, 720, 5); ctx.fillRect(-360, -110, 720, 3);
    ctx.fillStyle = Q.INK; ctx.font = '900 50px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('泛美航空', 0, -155);
    // 假支票金额：划掉
    ctx.font = '700 64px Num'; ctx.fillText('$2,000,000+', 0, -30);
    U.strike(ctx, -230, -24, 230, -40, prog(t, at('024', '两百多万') + 0.3, at('024', '两百多万') + 0.8));
    const ph = pop(t, at('024', '从来没有'));
    if (ph > 0.01) { ctx.globalAlpha = ph; ctx.font = '900 70px Sans'; ctx.fillStyle = Q.RUST; ctx.fillText('从来没有这回事', 0, 110); }
    ctx.restore();
  }
}
U.stampAt('在押', at('024', '满世界') + 0.1);
// ———— 025：讲台照 + 电影海报 + 问号 ————
function s25(ctx, t) {
  Q.put(ctx, 'G10', 560, 1000, 800, { ar: 0.66 });
  Q.tag(ctx, 560, 880, '前骗子 · FBI 顾问', pop(t, at('025', '前骗子')), { size: 58, bg: Q.INK, color: '#fbf3df', rot: 0 });
  Q.tag(ctx, 560, 150, '讲了四十多年', pop(t, at('025', '四十多年')), { size: 58, rot: -0.03, seed: 251 });
  // 电影海报式剪纸：深色海报纸 + 电影定格 + 片名
  const tp = at('025', '斯皮尔伯格') - 0.3, e = easeOut(prog(t, tp, tp + 0.6));
  if (e > 0.01) {
    ctx.save(); ctx.translate(lerp(W + 400, 1380, e), 470); ctx.rotate(0.04);
    P.piece(ctx, P.poly(P.jag([[-300, -400], [300, -400], [300, 400], [-300, 400]], 2, 16, 252)), '#2a2420', { blur: 26, dy: 14 });
    if (F.has('film_airport')) F.draw(ctx, 'film_airport', 2.0, 0, -80, 520, { border: 0, seed: 253 });
    ctx.fillStyle = '#f3ead6'; ctx.font = '900 92px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('猫鼠游戏', 0, 250);
    ctx.font = '700 34px Num'; ctx.fillStyle = 'rgba(243,234,214,0.7)'; ctx.fillText('2002', 0, 330);
    ctx.restore();
    Q.tag(ctx, 1380, 120, '斯皮尔伯格', pop(t, at('025', '斯皮尔伯格')), { size: 60, hl: true, rot: -0.03, seed: 254 });
  }
  const tq = at('025', '谁会去查');
  X.mark(ctx, 960, 470, 420, '?', pop(t, tq, 0.4) * 0.92, Q.RUST);
}
// ———— 026：推到画面中间一个“你”字 ————
function s26(ctx, t) {
  const a = L('026').t0, tn = at('026', '你'), z = easeInOut(prog(t, tn - 0.3, tn + 0.7));
  // 刚才那个故事：档案卡缩小在中间，随推镜放大出画
  ctx.save(); ctx.translate(960, 470); ctx.scale(lerp(0.55, 2.8, z), lerp(0.55, 2.8, z)); ctx.translate(-820, -500); ctx.globalAlpha = 1 - smooth(prog(z, 0.3, 0.8));
  A.archive(ctx, t, null); ctx.restore();
  const p = smooth(prog(t, tn - 0.1, tn + 0.5));
  if (p > 0.01) {
    ctx.save(); ctx.globalAlpha = p; ctx.translate(960, 470); ctx.scale(lerp(0.3, 1, easeOut(p)), lerp(0.3, 1, easeOut(p)));
    ctx.fillStyle = Q.INK; ctx.font = '900 560px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(50,28,8,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillText('你', 0, 20);
    ctx.restore();
    Q.marker(ctx, [[700, 760], [1220, 748]], prog(t, at('026', '也信了') - 0.1, at('026', '也信了') + 0.4), { w: 30 });
  }
}
// ———— 027–031：三张便签 ————
const NOTES = [
  { x: 380, col: '#f6df86', head: '① 防', line: '028', rows: [['先停下', '先停下'], ['告诉一个人', '告诉一个'], ['打官方电话', '打官方电话']] },
  { x: 960, col: '#f2d3a0', head: '② 你是权威时', line: '029', rows: [['领导 / 家长', '领导'], ['“我哪里', '我哪里'], ['可能错了？”', '可能错了']] },
  { x: 1540, col: '#dfe3b0', head: '③ 正当借用', line: '030', rows: [['亮出真资历', '亮出你真有'], ['只说懂的', '只在你懂'], ['让别人介绍', '让别人']] },
];
const NW = 520, NH = 640, NY = 470;
function notes(ctx, t, dim = 0) {
  NOTES.forEach((n, k) => {
    const ta = L(n.line).t0 - 0.2, p = prog(t, ta, ta + 0.45);
    const blank = pop(t, at('027', '三件事') + k * 0.15, 0.4);
    const cur = t >= L(n.line).t0 - 0.2 && t < L(n.line).t1 + 0.2;
    ctx.save(); ctx.globalAlpha = 1 - dim * 0.6;
    U.note(ctx, n.x, NY, NW, NH, Math.max(blank * 0.999, p), n.col, (c, w, h) => {
      c.fillStyle = Q.INK; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (p <= 0.01) { c.font = '700 120px Num'; c.globalAlpha *= 0.25; c.fillText(String(k + 1), w / 2, h / 2); return; }
      c.font = '900 60px Sans'; c.fillText(n.head, w / 2, 90);
      c.fillStyle = 'rgba(35,27,21,0.5)'; c.fillRect(50, 140, w - 100, 4);
      n.rows.forEach(([s, word], i) => {
        const tw = at(n.line, word), m = prog(t, tw - 0.05, tw + 0.5);
        if (m <= 0.01) return;
        const y = 240 + i * 130;
        if (k === 0 && i > 0) { c.font = '700 56px Sans'; c.fillStyle = Q.RUST; c.globalAlpha = m; c.fillText('↓', 64, y - 64); c.globalAlpha = 1; }
        X.write(c, s, 70, y + 20, 64, [...s].length * m * 1.05, { color: '#1d2a4a', weight: 700, seed: 300 + k * 10 + i, sloppy: 0.6 });
      });
    }, { rot: [-0.03, 0.02, -0.02][k], s: cur ? 1.04 : 1 });
    ctx.restore();
  });
}
function s27(ctx, t) {
  const a = L('027').t0, top = easeInOut(prog(t, at('027', '三件事') - 0.4, at('027', '三件事') + 0.4));
  // 代码卡：先在中间，再收到顶部当标题
  X.popScale(ctx, 960, lerp(420, 90, top), pop(t, a - 0.1, 0.4), () => B.ruleCard(ctx, 0, 0, 'IF 权威说 → 照做', lerp(66, 40, top), { seed: 271 }));
  notes(ctx, t);
  Q.tag(ctx, 960, 640, '看懂这段代码', pop(t, at('027', '看懂')) * (1 - top), { size: 66, hl: true, rot: -0.02, seed: 272 });
}
// 031：便签变暗退后，印章“误判”落下
const T31 = L('031').t0 - 0.1;
function s31(ctx, t) {
  const d = smooth(prog(t, T31, T31 + 0.6));
  ctx.save(); ctx.translate(960, 470); ctx.scale(1 - 0.12 * d, 1 - 0.12 * d); ctx.translate(-960, -470);
  B.ruleCard(ctx, 960, 90, 'IF 权威说 → 照做', 40, { seed: 271 });
  notes(ctx, t, d);
  ctx.restore();
  X.stamp(ctx, 960, 470, '误判', prog(t, T31 + 0.2, T31 + 0.75), { size: 230, rot: -0.1, seed: 311, color: Q.RUST });
  Q.tag(ctx, 960, 790, '从来没查过的“权威”', pop(t, at('031', '从来没查过')), { size: 64, hl: true, rot: 0.01, seed: 312 });
}
U.stampAt('误判', T31 + 0.2 + 0.55 / 1.4, 'main');

module.exports = {
  shots: [
    { a: L('023').t0 - 0.3, gl: 'fanye', draw: s23, name: '023' },
    { a: L('025').t0 - 0.2, tr: 'slide', draw: s25, name: '025' },
    { a: L('026').t0 - 0.2, tr: 'fade', draw: s26, name: '026' },
    { a: L('027').t0 - 0.3, gl: 'fanye', draw: s27, name: '027' },
    { a: T31, tr: 'cut', draw: s31, name: '031' },
  ],
};
