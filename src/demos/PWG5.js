'use strict';
// 《INFP》v3 第 5 组（整改版）：D10–D16 工作（傍晚的工作室）→ E01–E09 伴侣（家）→ 书页 P3
const S = require('./PWS_kit');
const A = require('./PWS_g5a');
const B = require('./PWS_g5b');
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  const LIST = [
    { a: G.a - 0.3, draw: (c, t) => A.draw(c, t) },
    { a: B.T.in, fi: 0.8, draw: (c, t) => B.draw(c, t) },
  ];
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = S.seq(c, t, LIST); }); return st; },
    over(ctx, t, al) { if (t < B.T.in + 0.4) A.over(ctx, t, al); else B.over(ctx, t, al); } }];
};
