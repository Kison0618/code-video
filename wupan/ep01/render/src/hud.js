// 左上角常驻：「人类误判心理学」浅色纸片 + 深色字（44px）；后面跟当前章节标签（深底浅字）
//   开场/蚂蚁：无；No.1 章节卡出现 → 故事一：No.1；No.2 章节卡出现 → 故事二：No.2；收尾 034 起：无
'use strict';
const K = require('./core');
const { smooth, prog } = K;
const TL = require('./timeline');
const P = require('./paper');

const TW = 372, TH = 76, NW = 136;
const TAG = P.poly(P.jag([[0, 0], [TW, 0], [TW, TH], [0, TH]], 1.8, 12, 41));
const NO = P.poly(P.jag([[0, 0], [NW, 0], [NW, TH], [0, TH]], 1.8, 12, 42));
const END = TL.L('034').t0 - 0.2;
function chapter(t) {
  if (t >= END) return [null, 0];
  if (t >= TL.CARD2_T0 + 0.3) return ['No.2', smooth(prog(t, TL.CARD2_T0 + 0.3, TL.CARD2_T0 + 0.6))];
  if (t >= TL.CARD_T0 + 0.3) return ['No.1', smooth(prog(t, TL.CARD_T0 + 0.3, TL.CARD_T0 + 0.6)) * (1 - smooth(prog(t, TL.CARD2_T0, TL.CARD2_T0 + 0.3)))];
  return [null, 0];
}
function draw(ctx, t) {
  ctx.save();
  ctx.translate(40, 32);
  ctx.rotate(-0.01);
  P.piece(ctx, TAG, '#fbf6ea', { blur: 10, dy: 4, color: 'rgba(60,35,10,0.4)' });
  ctx.fillStyle = '#231b15'; ctx.font = '700 44px Sans'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText('人类误判心理学', TW / 2, TH / 2 + 1);
  const [lab, a] = chapter(t);
  if (lab && a > 0.01) {
    ctx.globalAlpha = a;
    ctx.translate(TW + 12, 0); ctx.rotate(0.02);
    P.piece(ctx, NO, '#231b15', { blur: 10, dy: 4, color: 'rgba(60,35,10,0.45)' });
    ctx.fillStyle = '#fbf3df'; ctx.font = '700 48px Num';
    ctx.fillText(lab, NW / 2, TH / 2 + 2);
  }
  ctx.restore();
}
module.exports = { draw };
