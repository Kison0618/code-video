'use strict';
// 《INFP》v3 第 6 组（整改版）：F01–F10 精力（深夜书桌 → 雨夜的街 → 山崖黎明）→ 书页 P4/P5 → 关注卡
const S = require('./PWS_kit');
const A = require('./PWS_g6');
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  const CARD = A.card(G);
  const LIST = [
    { a: G.a - 0.3, draw: (c, t) => A.actA(c, t) },
    { a: A.TB, fi: 0.7, draw: (c, t) => A.actB(c, t) },
    { a: A.TC, fi: 0.8, draw: (c, t) => A.actC(c, t) },
    { a: CARD.A9 - 1.5, draw: (c, t) => { c.fillStyle = '#000'; c.fillRect(0, 0, 1080, 1920); CARD.draw(c, t); } },
  ];
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = S.seq(c, t, LIST); }); return st; },
    over(ctx, t, al) { if (t >= CARD.A9) CARD.over(ctx, t, al); else A.overAll(ctx, t, al); } }];
};
