// v6 镜头表：开头、机制、海淀案例、翻卡、三个办法。
'use strict';
const X = require('../kit');
const TL = require('../timeline');
const parts = ['v6_a', 'v7_m', 'v7_milgram', 'v7_b', 'v7_c', 'v7_d'].map(n => require('./' + n));

const SHOTS = parts.flatMap(p => p.shots).sort((a, b) => a.a - b.a);
for (const s of SHOTS) if (s.gl && !s.tr) s.tr = 'fade';
const GL_DUR = { paixian: 2.2, fanye: 1.6, sizhi: 1.8, moran: 2.4, feibai: 2.0, shuaijing: 1.6 };

function shotAt(t) { let i = -1; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].a) i = k; return i; }
function drawShot(ctx, i, t) { const P = require('../paper'); ctx.fillStyle = P.BG; ctx.fillRect(0, 0, 1920, 1080); if (i >= 0) SHOTS[i].draw(ctx, t); }
function glAt(t) {
  for (let k = 0; k < SHOTS.length; k++) {
    const s = SHOTS[k]; if (!s.gl) continue;
    const d = GL_DUR[s.gl], e = t - s.a;
    if (e >= 0 && e < d) return { id: s.gl, from: k - 1, to: k, elapsed: e, dur: d };
  }
  return null;
}

module.exports = [{
  name: 'ep02_v7', t0: 0, t1: TL.DUR,
  draw(ctx, t) { X.shots(ctx, t, SHOTS); },
  photoSubs(t) { const i = shotAt(t); return i >= 0 && !!SHOTS[i].photoSubs && SHOTS[i].photoSubs(t); },
}];
module.exports.SHOTS = SHOTS;
module.exports.shotAt = shotAt;
module.exports.drawShot = drawShot;
module.exports.glAt = glAt;
module.exports.STAMPS = require('./v5_util').STAMPS;
