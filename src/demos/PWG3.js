'use strict';
// 《INFP》v3 第 3 组（整改版）：C101–C105 独处，C201–C214 人际
const X = require('./pwk');
const S = require('./PWS_kit');
const A = require('./PWS_g3a');
const B = require('./PWS_g3b');
const Cc = require('./PWS_g3c');
const D = require('./PWS_g3d');
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  const LIST = [
    { a: G.a - 0.3, draw: (c, t) => A.draw(c, t) },
    { a: B.T.in, fi: 0.35, draw: (c, t) => B.draw(c, t) },
    { a: Cc.T.in, fi: 0.9, draw: (c, t) => Cc.draw(c, t) },
    { a: D.T.in, fi: 0.9, draw: (c, t) => D.draw(c, t) },
  ];
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = S.seq(c, t, LIST); }); return st; },
    over(ctx, t, al) { if (t >= Cc.T.in + 0.5) Cc.over(ctx, t, al); else if (t >= B.T.in) B.over(ctx, t, al); } }];
};
