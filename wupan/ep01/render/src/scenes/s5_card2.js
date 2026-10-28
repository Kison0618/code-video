// 章节卡 No.2「最好比的」：纸页从右边滑进来，旧杂志封面拼条（代码画，无真实 logo）落下，标题纸片拍上去
//   全部画在 over() 里：s6_story2 的第一个镜头在卡片底下先画好，卡片往左滑走时露出来（场景表里 s6 排在 s5 后面）
'use strict';
const K = require('../core');
const { W, H, clamp, prog, easeOut, easeIn } = K;
const TL = require('../timeline');
const P = require('../paper');
const S2 = require('../kit_story2');

const T0 = TL.CARD2_T0, END = TL.CARDS[1][1];     // 026 开口时整张卡往左滑走
const PW = 1380, PH = 600;
const MAG = S2.magazineStrip(PW, PH);
const PHOTO = P.poly(P.jag([[0, 0], [PW, 0], [PW, PH], [0, PH]], 7, 18, 71));
const SHEET = P.poly(P.jag([[0, -40], [W + 80, -40], [W + 80, H + 40], [0, H + 40]], 9, 22, 72));
const NO = P.poly(P.jag([[0, 0], [250, 0], [250, 130], [0, 130]], 3, 14, 73));
const TW = 700, TITLE = P.poly(P.jag([[0, 0], [TW, 0], [TW, 190], [0, 190]], 3, 16, 74));

function card(ctx, t) {
  const s = easeOut(prog(t, T0, T0 + 0.28));
  ctx.save(); ctx.translate((1 - s) * (W + 100), 0);
  P.piece(ctx, SHEET, '#efe3c9', { blur: 30, dx: -12, dy: 0, color: 'rgba(50,28,8,0.5)' });
  ctx.restore();
  const p = easeOut(prog(t, T0 + 0.12, T0 + 0.42));
  if (p > 0.01) {
    ctx.save();
    ctx.translate(W / 2, H / 2 - 20 - (1 - p) * 80); ctx.rotate(0.03 - (1 - p) * 0.08); ctx.scale(1.08 - 0.08 * p, 1.08 - 0.08 * p); ctx.translate(-PW / 2, -PH / 2);
    ctx.globalAlpha = clamp(p * 2);
    P.piece(ctx, PHOTO, '#fbf7ee', { blur: 24, dy: 12 });
    ctx.save(); ctx.clip(PHOTO);
    const z = 1.02 + 0.03 * prog(t, T0, END);
    ctx.drawImage(MAG, PW / 2 - PW * z / 2, PH / 2 - PH * z / 2, PW * z, PH * z);
    ctx.fillStyle = 'rgba(40,25,10,0.12)'; ctx.fillRect(0, 0, PW, PH);
    ctx.restore(); ctx.restore();
  }
  const q = prog(t, T0 + 0.25, T0 + 0.45), q2 = prog(t, T0 + 0.33, T0 + 0.53);
  const slam = u => 1 + (1 - easeOut(u)) * 0.5;
  if (q > 0.01) {
    ctx.save(); ctx.globalAlpha = clamp(q * 3);
    ctx.translate(560, 300); ctx.rotate(-0.07); ctx.scale(slam(q), slam(q));
    P.piece(ctx, NO, '#231b15', { blur: 14, dy: 7 });
    ctx.fillStyle = '#fff6e6'; ctx.font = '700 104px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No.2', 125, 70);
    ctx.restore();
  }
  if (q2 > 0.01) {
    ctx.save(); ctx.globalAlpha = clamp(q2 * 3);
    ctx.translate(W / 2 + 40, 640); ctx.rotate(0.02); ctx.scale(slam(q2), slam(q2)); ctx.translate(-TW / 2, -95);
    P.piece(ctx, TITLE, '#fbf6ea', { blur: 16, dy: 8 });
    ctx.fillStyle = '#231b15'; ctx.font = '900 128px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('最好比的', TW / 2, 100);
    ctx.restore();
  }
}

module.exports = {
  t0: T0, t1: END + 0.45,
  hideSubs: t => t > T0 && t < END,
  draw() {},
  over(ctx, t) {
    if (t < T0 || t > END + 0.45) return;
    const ex = easeIn(prog(t, END, END + 0.45));
    ctx.save(); ctx.translate(-ex * (W + 200), 0); ctx.rotate(-0.04 * ex);
    card(ctx, t);
    ctx.restore();
  },
};
