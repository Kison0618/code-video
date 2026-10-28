// 章节卡 No.1「一分钱一分货」：纸页从右边滑进来，绿松石照片撕边条落下，标题纸片拍上去
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('../core');
const { W, H, Canvas, clamp, lerp, smooth, prog, easeOut, easeIn } = K;
const { Image } = require('skia-canvas');
const TL = require('../timeline');
const P = require('../paper');

const img = new Image(); img.src = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'turquoise.png'));
const T0 = TL.CARD_T0, END = TL.CARDS[0][1];      // 014 开口时整张卡往左滑走，露出故事一
const PW = 1380, PH = 600;
const PHOTO = P.poly(P.jag([[0, 0], [PW, 0], [PW, PH], [0, PH]], 7, 18, 61));
const SHEET = P.poly(P.jag([[0, -40], [W + 80, -40], [W + 80, H + 40], [0, H + 40]], 9, 22, 62));
const NO = P.poly(P.jag([[0, 0], [250, 0], [250, 130], [0, 130]], 3, 14, 63));
const TITLE = P.poly(P.jag([[0, 0], [860, 0], [860, 190], [0, 190]], 3, 16, 64));

module.exports = {
  t0: T0, t1: END + 0.45,
  hideSubs: t => t > T0 && t < END,
  draw(ctx, t) {
    if (t < T0 || t > END + 0.45) return;
    const ex = easeIn(prog(t, END, END + 0.45));
    ctx.save(); ctx.translate(-ex * (W + 200), 0); ctx.rotate(-0.04 * ex);
    this.card(ctx, t);
    ctx.restore();
  },
  card(ctx, t) {
    const s = easeOut(prog(t, T0, T0 + 0.28));
    ctx.save();
    ctx.translate((1 - s) * (W + 100), 0);
    P.piece(ctx, SHEET, '#efe3c9', { blur: 30, dx: -12, dy: 0, color: 'rgba(50,28,8,0.5)' });
    ctx.restore();
    // 照片
    const p = easeOut(prog(t, T0 + 0.12, T0 + 0.42));
    if (p > 0.01) {
      ctx.save();
      ctx.translate(W / 2, H / 2 - 20 - (1 - p) * 80); ctx.rotate(-0.035 + (1 - p) * 0.08); ctx.scale(1.08 - 0.08 * p, 1.08 - 0.08 * p); ctx.translate(-PW / 2, -PH / 2);
      ctx.globalAlpha = clamp(p * 2);
      P.piece(ctx, PHOTO, '#fbf7ee', { blur: 24, dy: 12 });
      ctx.save(); ctx.clip(PHOTO);
      const sc = Math.max(PW / img.width, PH / img.height) * (1.04 + 0.03 * prog(t, T0, END));
      ctx.drawImage(img, PW / 2 - img.width * sc / 2, PH / 2 - img.height * sc / 2, img.width * sc, img.height * sc);
      ctx.fillStyle = 'rgba(40,25,10,0.18)'; ctx.fillRect(0, 0, PW, PH);
      ctx.restore();
      ctx.restore();
    }
    // 标题纸片
    const q = prog(t, T0 + 0.25, T0 + 0.45), q2 = prog(t, T0 + 0.33, T0 + 0.53);
    const slam = u => 1 + (1 - easeOut(u)) * 0.5;
    if (q > 0.01) {
      ctx.save(); ctx.globalAlpha = clamp(q * 3);
      ctx.translate(560, 300); ctx.rotate(-0.07); ctx.scale(slam(q), slam(q));
      P.piece(ctx, NO, '#231b15', { blur: 14, dy: 7 });
      ctx.fillStyle = '#fff6e6'; ctx.font = '700 104px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('No.1', 125, 70);
      ctx.restore();
    }
    if (q2 > 0.01) {
      ctx.save(); ctx.globalAlpha = clamp(q2 * 3);
      ctx.translate(W / 2 + 40, 640); ctx.rotate(0.02); ctx.scale(slam(q2), slam(q2)); ctx.translate(-430, -95);
      P.piece(ctx, TITLE, '#fbf6ea', { blur: 16, dy: 8 });
      ctx.fillStyle = '#231b15'; ctx.font = '900 128px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('一分钱一分货', 430, 100);
      ctx.restore();
    }
  },
};
