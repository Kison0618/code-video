// 第二集 v5 · 米尔格拉姆 + 例子快速翻卡（016–022）
//   016 实验员白大褂背影 + 电压开关从左往右推到 450 V，26 / 40   017 “这段代码，今天还在到处跑”，代码卡四散
//   018 卡 1 瑞典假机长：驾驶舱窗口 + 13 年   019 卡 2 电视里的“神医”：苗医传人 → 换台 → 蒙医传人
//   020 卡 3 手机里的名医视频，扫描线扫过“AI 合成”   021–022 卡 4 电话听筒：假警察“我现在查你！”
// 真人（刘洪斌、张文宏）只用剪影，不画相貌
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const C = require('../card');
const U = require('./v5_util');
const RULE = 'IF 权威说 → 照做';
const L = TL.L, at = TL.at;
const pop = require("./v6_util").pop;

// ———— 016：米尔格拉姆 ————
const VOLTS = 30;                                          // 15 V 一档，共 30 个开关
function panel(ctx, x, y, n, t) {
  const w = 1120, h = 330;
  ctx.save(); ctx.translate(x, y);
  P.piece(ctx, P.poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]), '#4b3b2c', { blur: 22, dy: 12 });
  ctx.fillStyle = '#5b4836'; ctx.fillRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(-w / 2 + 40, -h / 2 + 34, w - 80, 70);
  const sw = (w - 120) / VOLTS;
  for (let k = 0; k < VOLTS; k++) {
    const cx = -w / 2 + 60 + sw * (k + 0.5), on = clamp(n - k), hot = k >= VOLTS - 3;
    // 刻度
    ctx.fillStyle = '#3a2d22'; ctx.fillRect(cx - 1.5, -h / 2 + 80, 3, k % 5 === 4 ? 22 : 12);
    if (k % 5 === 4 || k === 0) { ctx.font = '700 30px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String((k + 1) * 15), cx, -h / 2 + 72); }
    // 开关
    ctx.fillStyle = '#2a211a'; ctx.fillRect(cx - sw * 0.32, -10, sw * 0.64, 90);
    ctx.fillStyle = on > 0.5 ? (hot ? '#c8321f' : '#f4c63d') : '#cfc6b4';
    ctx.fillRect(cx - sw * 0.26, on > 0.5 ? 34 : -4, sw * 0.52, 40);
    if (on > 0.5) { ctx.save(); ctx.shadowColor = hot ? 'rgba(220,60,30,0.9)' : 'rgba(255,200,60,0.8)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(cx, 112, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = '#3a2d22'; ctx.beginPath(); ctx.arc(cx, 112, 6, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function s16(ctx, t) {
  const a = L('016').t0;
  Q.tag(ctx, 470, 150, '米尔格拉姆实验', pop(t, a), { size: 58, rot: -0.03, seed: 161 });
  // 实验员：白大褂背影（H02 剪影翻转，浅灰白）
  const e = easeOut(prog(t, a - 0.1, a + 0.6));
  require('./v6_util').doctorBack(ctx,lerp(-300,300,e),900,610);
  const tq = at('016', '请继续');
  C.bubble(ctx, { x: 560, y: 420, text: '请继续', size: 62, pop: pop(t, tq - 0.1, 0.4), tail: [400, 580] });
  // 电压：从“二十六个把电击”开始往右推，到“四百五十伏”推满
  const t0 = at('016', '把电击') - 0.2, t1 = at('016', '四百五十伏') + 0.4;
  const n = lerp(0, VOLTS, easeInOut(prog(t, t0, t1)));
  panel(ctx, 1270, 420, n, t);
  const tv = at('016', '四百五十伏');
  Q.tag(ctx, 1640, 160, '450 V', pop(t, tv), { size: 84, bg: Q.RUST, color: '#fbf3df', rot: 0.04, seed: 162, font: 'Num' });
  // 26 / 40
  const t40 = at('016', '四十个'), t26 = at('016', '二十六');
  const pv = pop(t, t40);
  if (pv > 0.01) {
    ctx.save(); ctx.globalAlpha = pv; ctx.font = '700 150px Num'; ctx.fillStyle = Q.INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('/ 40', 1290, 760); ctx.restore();
    X.roll(ctx, lerp(0, 26, easeOut(prog(t, t26 - 0.1, t26 + 0.6))), 1260, 760, 150, { color: Q.RUST, digits: 2 });
  }
}

module.exports={panel,draw:s16};
