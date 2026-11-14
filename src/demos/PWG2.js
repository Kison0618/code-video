'use strict';
// 《INFP》v3 第 2 组（整改版）：B01–B12「特征」。一组里换四个地方，镜头自己带过去：
//   山崖看城（B01–B04）→ 扎进城市 → 雨夜的街（B05–B06）→ 穿过花拱门 → 湖边（B07–B11）→ 书页 P1 → 万家灯火（B12）
const X = require('./pwk');
const S = require('./PWS_kit');
const A = require('./PWS_g2a');
const B = require('./PWS_g2b');
const L = require('./PWS_g2c');
const D = require('./PWS_g2d');
const { K } = X; const { prog, smooth } = K;
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  const dive = t => prog(t, B.T.in - 0.3, B.T.in + 0.2);
  const LIST = [
    { a: G.a - 0.3, draw: (c, t) => A.draw(c, t, { dive: dive(t) }) },
    { a: B.T.in - 0.12, fi: 0.4, draw: (c, t) => { const bl = 22 * (1 - smooth(prog(t, B.T.in - 0.12, B.T.in + 0.45))); if (bl > 0.5) { let st; S.comp(c, c2 => { st = B.draw(c2, t); }, { filter: `blur(${bl.toFixed(1)}px)` }); return st; } return B.draw(c, t); } },
    { a: L.T.in, fi: 0.6, draw: (c, t) => L.draw(c, t) },
    { a: D.T.in - 2, draw: (c, t) => D.draw(c, t) },
  ];
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = S.seq(c, t, LIST); }); return st; },
    over(ctx, t, al) { if (t < B.T.in) A.over(ctx, t, al); else if (t < L.T.in + 0.3) B.over(ctx, t, al); else if (t < D.T.in - 2) L.over(ctx, t, al); else D.over(ctx, t, al); } }];
};
