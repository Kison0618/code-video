'use strict';
// 《INFP》v3 第 1 组（整改版）：A01–A09 开头，全组在「夜山坡」，结尾镜头升上山顶接 PWG2 的山崖
const S = require('./PWS_kit');
const A = require('./PWS_g1');
module.exports = function make(G) {
  S.muteFront(G.a - 0.3, G.b + 0.3);
  return [{ a: G.a - 0.3, b: G.b + 0.3,
    draw(ctx, t, al) { S.freeLayers(); let st; S.group(ctx, al, c => { st = A.draw(c, t); }); return st; },
    over(ctx, t, al, st) { A.over(ctx, t, al, st); } }];
};
