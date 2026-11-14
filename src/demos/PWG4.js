'use strict';
// 《INFP》v3 第 4 组（整改版）：C301–C310「忍」（中学教室）→ 书页 P2 → D01–D09 工作
const S = require('./PWS_kit');
const A = require('./PWS_g4a');
const B = require('./PWS_g4b');
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  const LIST = [
    { a: G.a - 0.3, draw: (c, t) => A.draw(c, t) },
    { a: B.T.in - 3, draw: (c, t) => B.draw(c, t) },
  ];
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = S.seq(c, t, LIST); }); return st; },
    over(ctx, t, al) { if (t < B.T.in - 3) A.over(ctx, t, al); else B.over(ctx, t, al); } }];
};
